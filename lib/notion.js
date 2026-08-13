// Toda la logica de hablar con Notion vive aqui, para que la use tanto
// la version autoinstalable (/api/notion, cada quien con su propio token)
// como la version hospedada (/api/embed/[id], con el token guardado por nosotros).

const V_NUEVA = '2025-09-03'
const V_VIEJA = '2022-06-28'

const norm = (s) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

function pick(props, names, types) {
  const wanted = names.map(norm)
  for (const key of Object.keys(props)) {
    if (wanted.includes(norm(key))) {
      if (!types || types.includes(props[key].type)) return props[key]
    }
  }
  if (types) {
    for (const key of Object.keys(props)) {
      if (types.includes(props[key].type)) return props[key]
    }
  }
  return null
}

const plain = (p) =>
  p && Array.isArray(p.rich_text) ? p.rich_text.map((t) => t.plain_text).join('') : ''

const titleOf = (props) => {
  for (const key of Object.keys(props)) {
    if (props[key].type === 'title') return props[key].title.map((t) => t.plain_text).join('')
  }
  return ''
}

function filesOf(p) {
  if (!p || p.type !== 'files') return []
  return p.files
    .map((f) => {
      const url = f.type === 'external' ? f.external.url : f.file?.url
      if (!url) return null
      const clean = url.split('?')[0].toLowerCase()
      return { url, isVideo: /\.(mp4|mov|webm|m4v)$/.test(clean), name: f.name || '' }
    })
    .filter(Boolean)
}

// Ids de las paginas relacionadas, para filtrar por proyecto o marca.
function relacionesDe(props) {
  const ids = []
  for (const key of Object.keys(props)) {
    const p = props[key]
    if (p.type === 'relation') for (const r of p.relation || []) ids.push(String(r.id).replace(/-/g, ''))
  }
  return ids
}

const selectOf = (p) => {
  if (!p) return ''
  if (p.type === 'select') return p.select?.name || ''
  if (p.type === 'status') return p.status?.name || ''
  if (p.type === 'multi_select') return (p.multi_select || []).map((s) => s.name).join(', ')
  return ''
}

// Del icono de Notion sacamos el logo del perfil: puede ser imagen o emoji.
function perfilDe(obj) {
  if (!obj) return null
  const icon = obj.icon
  let logo = null
  let emoji = null
  if (icon?.type === 'emoji') emoji = icon.emoji
  else if (icon?.type === 'external') logo = icon.external?.url || null
  else if (icon?.type === 'file') logo = icon.file?.url || null
  else if (icon?.type === 'custom_emoji') logo = icon.custom_emoji?.url || null
  else if (icon?.type === 'file_upload') logo = icon.file_upload?.url || null
  if (logo && !/^https?:\/\//.test(logo)) logo = null

  const desc = Array.isArray(obj.description)
    ? obj.description.map((t) => t.plain_text).join('')
    : ''
  const titulo = Array.isArray(obj.title) ? obj.title.map((t) => t.plain_text).join('') : ''

  return { logo, emoji, descripcion: desc, titulo }
}

const cabeceras = (token, version, extra = {}) => ({
  Authorization: `Bearer ${token}`,
  'Notion-Version': version,
  ...extra,
})

async function mensajeDe(res) {
  try {
    const j = await res.json()
    return j.message || j.code || `Notion respondio ${res.status}.`
  } catch {
    return `Notion respondio ${res.status}.`
  }
}

async function traerTodo(url, token, version) {
  const filas = []
  let cursor
  do {
    const res = await fetch(url, {
      method: 'POST',
      headers: cabeceras(token, version, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ page_size: 100, start_cursor: cursor }),
      cache: 'no-store',
    })
    if (!res.ok) return { error: await mensajeDe(res), estado: res.status }
    const json = await res.json()
    filas.push(...json.results)
    cursor = json.has_more ? json.next_cursor : undefined
  } while (cursor)
  return { filas }
}

async function listarFuentes(token) {
  const todas = []
  try {
    let cursor
    do {
      const res = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: cabeceras(token, V_NUEVA, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          page_size: 100,
          start_cursor: cursor,
          filter: { property: 'object', value: 'data_source' },
        }),
        cache: 'no-store',
      })
      if (!res.ok) return todas
      const json = await res.json()
      todas.push(...json.results)
      cursor = json.has_more ? json.next_cursor : undefined
    } while (cursor)
  } catch {
    return todas
  }
  return todas
}

async function buscarPorRelacion(pageId, token) {
  const limpio = (v) => String(v || '').replace(/-/g, '')
  const objetivo = limpio(pageId)
  const fuentes = await listarFuentes(token)

  const tieneArchivos = (page) => {
    const props = page.properties || {}
    for (const key of Object.keys(props)) {
      const pr = props[key]
      if (pr.type === 'files' && (pr.files || []).length) return true
    }
    return false
  }

  let mejor = null
  for (const f of fuentes.slice(0, 12)) {
    const r = await traerTodo(`https://api.notion.com/v1/data_sources/${f.id}/query`, token, V_NUEVA)
    if (r.error) continue

    const propias = r.filas.filter((page) => {
      const props = page.properties || {}
      for (const key of Object.keys(props)) {
        const pr = props[key]
        if (pr.type === 'relation') {
          for (const rel of pr.relation || []) {
            if (limpio(rel.id) === objetivo) return true
          }
        }
      }
      return false
    })
    if (!propias.length) continue

    const conImagen = propias.filter(tieneArchivos).length
    const puntaje = conImagen * 1000 + propias.length
    if (!mejor || puntaje > mejor.puntaje) mejor = { puntaje, filas: propias, fuente: f }
  }

  if (mejor) return { filas: mejor.filas, yaFiltrado: true }
  return null
}

async function buscarFuentePorPermiso(id, token) {
  const limpio = (v) => String(v || '').replace(/-/g, '')
  const objetivo = limpio(id)
  try {
    let cursor
    do {
      const res = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: cabeceras(token, V_NUEVA, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          page_size: 100,
          start_cursor: cursor,
          filter: { property: 'object', value: 'data_source' },
        }),
        cache: 'no-store',
      })
      if (!res.ok) return null
      const json = await res.json()
      for (const f of json.results) {
        const padre = limpio(f.parent?.database_id)
        if (limpio(f.id) === objetivo || padre === objetivo) return f
      }
      cursor = json.has_more ? json.next_cursor : undefined
    } while (cursor)
  } catch {
    return null
  }
  return null
}

async function paginasPorTexto(texto, token) {
  const ids = new Set()
  try {
    let cursor
    do {
      const res = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: cabeceras(token, V_VIEJA, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          query: texto,
          page_size: 100,
          start_cursor: cursor,
          filter: { property: 'object', value: 'page' },
        }),
        cache: 'no-store',
      })
      if (!res.ok) return ids
      const json = await res.json()
      for (const p of json.results) ids.add(String(p.id).replace(/-/g, ''))
      cursor = json.has_more ? json.next_cursor : undefined
    } while (cursor)
  } catch {
    return ids
  }
  return ids
}

async function buscarBasesAdentro(id, token) {
  const encontradas = []
  let cursor
  try {
    do {
      const url = new URL(`https://api.notion.com/v1/blocks/${id}/children`)
      url.searchParams.set('page_size', '100')
      if (cursor) url.searchParams.set('start_cursor', cursor)
      const res = await fetch(url, { headers: cabeceras(token, V_VIEJA), cache: 'no-store' })
      if (!res.ok) return encontradas
      const json = await res.json()
      for (const b of json.results) {
        if (b.type === 'child_database') encontradas.push(b.id)
      }
      cursor = json.has_more ? json.next_cursor : undefined
    } while (cursor)
  } catch {
    return encontradas
  }
  return encontradas
}

async function consultar(id, token, profundidad = 0) {
  const meta = await fetch(`https://api.notion.com/v1/databases/${id}`, {
    headers: cabeceras(token, V_NUEVA),
    cache: 'no-store',
  })

  let perfil = null

  if (meta.ok) {
    const info = await meta.json()
    perfil = perfilDe(info)
    const fuentes = info.data_sources || []
    if (fuentes.length) {
      const todas = []
      for (const f of fuentes) {
        const r = await traerTodo(`https://api.notion.com/v1/data_sources/${f.id}/query`, token, V_NUEVA)
        if (r.error) return r
        todas.push(...r.filas)
      }
      return { filas: todas, perfil }
    }
  }

  const clasica = await traerTodo(`https://api.notion.com/v1/databases/${id}/query`, token, V_VIEJA)
  if (!clasica.error) return { ...clasica, perfil }

  const directa = await traerTodo(`https://api.notion.com/v1/data_sources/${id}/query`, token, V_NUEVA)
  if (!directa.error) {
    const df = await fetch(`https://api.notion.com/v1/data_sources/${id}`, {
      headers: cabeceras(token, V_NUEVA),
      cache: 'no-store',
    })
    if (df.ok) perfil = perfilDe(await df.json()) || perfil
    return { ...directa, perfil }
  }

  const fuente = await buscarFuentePorPermiso(id, token)
  if (fuente) {
    const r = await traerTodo(`https://api.notion.com/v1/data_sources/${fuente.id}/query`, token, V_NUEVA)
    if (!r.error) {
      if (!perfil?.logo && !perfil?.emoji) perfil = perfilDe(fuente) || perfil
      return { ...r, perfil }
    }
  }

  if (profundidad < 2) {
    const hijos = await buscarBasesAdentro(id, token)
    if (hijos.length) {
      const todas = []
      let perfilHijo = null
      for (const hijo of hijos) {
        const r = await consultar(hijo, token, profundidad + 1)
        if (!r.error) {
          todas.push(...r.filas)
          if (!perfilHijo && (r.perfil?.logo || r.perfil?.emoji)) perfilHijo = r.perfil
        }
      }
      if (!perfilHijo?.logo && !perfilHijo?.emoji) {
        const pag = await fetch(`https://api.notion.com/v1/pages/${id}`, {
          headers: cabeceras(token, V_VIEJA),
          cache: 'no-store',
        })
        if (pag.ok) {
          const p = perfilDe(await pag.json())
          if (p?.logo || p?.emoji) perfilHijo = p
        }
      }
      if (todas.length || hijos.length) return { filas: todas, perfil: perfilHijo }
    }
  }

  if (profundidad === 0) {
    const porRel = await buscarPorRelacion(id, token)
    if (porRel) {
      const pg = await fetch(`https://api.notion.com/v1/pages/${id}`, {
        headers: cabeceras(token, V_VIEJA),
        cache: 'no-store',
      })
      if (pg.ok) {
        const p = perfilDe(await pg.json())
        if (p?.logo || p?.emoji) perfil = p
      }
      return { ...porRel, perfil }
    }
  }

  if (!meta.ok) {
    const msg = await mensajeDe(meta)
    return {
      error:
        meta.status === 404
          ? 'Notion no encuentra nada en ese enlace. Abre la base de datos como pagina completa, entra a ••• > Conexiones y agrega la integracion ahi mismo.'
          : msg,
      estado: meta.status,
    }
  }
  return clasica
}

/**
 * Trae y normaliza las publicaciones de un calendario de contenido.
 * @param {object} args
 * @param {string} args.token - Token de integracion de Notion (sin cifrar).
 * @param {string} args.db - Id de la base, fuente de datos o pagina.
 * @param {string} [args.estado] - Filtra por columna Estado.
 * @param {string} [args.cliente] - Filtra por columna Cliente/Marca.
 * @param {string} [args.proyecto] - Filtra por relacion con una pagina puntual.
 * @param {string} [args.marca] - Agrupa por texto en el titulo de la pagina relacionada.
 */
export async function consultarFeed({ token, db, estado = '', cliente = '', proyecto = '', marca = '' }) {
  const id = String(db || '').replace(/-/g, '')
  if (!id) return { error: 'Falta el id de la base de datos.', estado: 400 }
  if (!token) return { error: 'Falta el token de Notion.', estado: 400 }

  const r = await consultar(id, token)
  if (r.error) return { error: r.error, estado: r.estado || 400 }

  let posts = r.filas.map((page) => {
    const props = page.properties || {}
    const media = filesOf(
      pick(
        props,
        ['Imagen', 'Imagenes', 'Portada', 'Media', 'Archivo', 'Archivos', 'Attachment', 'Adjunto', 'Foto', 'Pieza'],
        ['files']
      )
    )
    const linkProp = pick(props, ['Link', 'URL', 'Enlace', 'Canva'], ['url'])
    const fechaProp = pick(props, ['Fecha Publicacion', 'Fecha', 'Publicacion', 'Date', 'Fecha de publicacion'], ['date'])
    const ordenProp = pick(props, ['Orden', 'Order', 'Posicion'], ['number'])
    const likesProp = pick(props, ['Likes', 'Me gusta'], ['number'])

    return {
      id: page.id,
      titulo: titleOf(props),
      caption: plain(pick(props, ['Caption', 'Copy', 'Texto', 'Descripcion', 'Contenido'], ['rich_text'])),
      hashtags: plain(pick(props, ['Hashtags', 'Etiquetas'], ['rich_text'])),
      musica: plain(pick(props, ['Musica', 'Audio', 'Music', 'Cancion'], ['rich_text'])),
      formato: selectOf(pick(props, ['Formato', 'Tipo', 'Type'], ['select', 'multi_select'])),
      estado: selectOf(pick(props, ['Estado', 'Status'], ['status', 'select'])),
      cliente: selectOf(pick(props, ['Cliente', 'Marca', 'Cuenta'], ['select', 'multi_select'])),
      fecha: fechaProp?.date?.start || '',
      orden: ordenProp?.number ?? null,
      likes: likesProp?.number ?? null,
      media,
      relaciones: relacionesDe(props),
      externalLink: linkProp?.url || '',
      notionUrl: page.url,
    }
  })

  const proy = String(proyecto || '').replace(/-/g, '')
  if (proy) posts = posts.filter((p) => p.relaciones.includes(proy))

  if (marca && marca.trim()) {
    const delCliente = await paginasPorTexto(marca.trim(), token)
    if (delCliente.size) posts = posts.filter((p) => p.relaciones.some((rid) => delCliente.has(rid)))
  }

  let perfil = r.perfil || null
  if (proy) {
    const pg = await fetch(`https://api.notion.com/v1/pages/${proy}`, {
      headers: cabeceras(token, V_VIEJA),
      cache: 'no-store',
    })
    if (pg.ok) {
      const p = perfilDe(await pg.json())
      if (p?.logo || p?.emoji) perfil = { ...(perfil || {}), ...p }
    }
  }

  const total = posts.length
  if (estado) posts = posts.filter((p) => norm(p.estado) === norm(estado))
  if (cliente) posts = posts.filter((p) => norm(p.cliente) === norm(cliente))

  const conOrden = posts.filter((p) => p.orden !== null)
  if (conOrden.length === posts.length && posts.length > 0) posts.sort((a, b) => a.orden - b.orden)
  else posts.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))

  const conImagen = posts.filter((p) => p.media.length || p.externalLink).length

  return { posts, total, conImagen, perfil, actualizado: new Date().toISOString() }
}

/** Confirma que un token puede leer una base de datos, para validarlo en el asistente de instalacion. */
export async function probarConexion({ token, db }) {
  const r = await consultarFeed({ token, db })
  if (r.error) return { ok: false, error: r.error }
  return { ok: true, total: r.total, conImagen: r.conImagen, perfil: r.perfil }
}

/** Busca la columna de archivos de una publicacion y sube una imagen ahi. */
export async function subirArchivo({ token, pageId, archivo, reemplazar = true }) {
  if (!token) return { error: 'Falta el token de Notion.' }
  if (!archivo || !pageId) return { error: 'Falta el archivo o la publicacion.' }
  if (archivo.size > 20 * 1024 * 1024) {
    return { error: 'La imagen pesa mas de 20 MB. Reducela e intenta de nuevo.' }
  }

  const columna = await nombreDeColumna(pageId, token)
  if (columna.error) return { error: columna.error }

  try {
    const crear = await fetch('https://api.notion.com/v1/file_uploads', {
      method: 'POST',
      headers: cabeceras(token, V_VIEJA, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        filename: archivo.name || 'imagen.jpg',
        content_type: archivo.type || 'image/jpeg',
      }),
    })
    if (!crear.ok) return { error: await mensajeDe(crear) }
    const subida = await crear.json()

    const cuerpo = new FormData()
    cuerpo.append('file', archivo, archivo.name || 'imagen.jpg')
    const enviar = await fetch(subida.upload_url, {
      method: 'POST',
      headers: cabeceras(token, V_VIEJA),
      body: cuerpo,
    })
    if (!enviar.ok) return { error: await mensajeDe(enviar) }

    const anteriores = reemplazar
      ? []
      : (columna.actuales || []).filter((f) => f.type === 'external' || f.type === 'file_upload')

    const nuevos = [
      ...anteriores,
      { type: 'file_upload', file_upload: { id: subida.id }, name: archivo.name || 'imagen.jpg' },
    ]

    const guardar = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: cabeceras(token, columna.version, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ properties: { [columna.nombre]: { files: nuevos } } }),
    })
    if (!guardar.ok) return { error: await mensajeDe(guardar) }

    return { ok: true, columna: columna.nombre }
  } catch (e) {
    return { error: `No se pudo subir la imagen. ${String(e)}` }
  }
}

async function nombreDeColumna(pageId, token) {
  for (const v of [V_NUEVA, V_VIEJA]) {
    const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: cabeceras(token, v),
      cache: 'no-store',
    })
    if (!res.ok) continue
    const page = await res.json()
    const props = page.properties || {}
    const preferidas = ['portada', 'imagen', 'imagenes', 'media', 'archivo', 'archivos', 'foto', 'pieza']

    for (const p of preferidas) {
      for (const key of Object.keys(props)) {
        if (norm(key) === p && props[key].type === 'files') {
          return { nombre: key, version: v, actuales: props[key].files || [] }
        }
      }
    }
    for (const key of Object.keys(props)) {
      if (props[key].type === 'files') return { nombre: key, version: v, actuales: props[key].files || [] }
    }
    return { error: 'Esta base no tiene una columna de archivos donde guardar la imagen.' }
  }
  return { error: 'No se pudo leer la publicacion en Notion.' }
}

/** Guarda el nuevo orden de las publicaciones. */
export async function guardarOrden({ token, items }) {
  if (!token) return { error: 'Falta el token de Notion.' }
  if (!Array.isArray(items)) return { error: 'Cuerpo invalido.' }

  const errores = []
  for (const item of items) {
    const res = await fetch(`https://api.notion.com/v1/pages/${item.id}`, {
      method: 'PATCH',
      headers: cabeceras(token, V_VIEJA, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ properties: { Orden: { number: item.orden } } }),
    })
    if (!res.ok) errores.push(await mensajeDe(res))
  }
  if (errores.length) {
    return {
      error: 'No se pudo guardar el orden. Revisa que tu base tenga una propiedad Numero llamada "Orden".',
      detail: errores[0],
    }
  }
  return { ok: true }
}
