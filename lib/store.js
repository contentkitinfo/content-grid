// Cada widget hospedado se guarda como un registro con dos identificadores:
// - id publico: va en la URL del embed que se pega en Notion (no es secreto,
//   pero es dificil de adivinar, igual que un enlace de "compartir por link").
// - id de edicion: va en el enlace privado que el comprador guarda para volver
//   a configurar su widget. Nunca se muestra en el embed.
import { kv } from '@vercel/kv'
import { randomBytes } from 'crypto'
import { cifrar, descifrar } from './crypto'

const nuevoId = () => randomBytes(16).toString('base64url')

/** Crea un widget nuevo. Devuelve {id, idEdicion}. */
export async function crearWidget(config) {
  const id = nuevoId()
  const idEdicion = nuevoId()
  const registro = {
    ...config,
    token: cifrar(config.token),
    idEdicion,
    creado: new Date().toISOString(),
  }
  await kv.set(`widget:${id}`, registro)
  await kv.set(`edicion:${idEdicion}`, id)
  return { id, idEdicion }
}

/** Trae la configuracion de un widget con el token ya descifrado, lista para usar. */
export async function obtenerWidget(id) {
  const registro = await kv.get(`widget:${id}`)
  if (!registro) return null
  return { ...registro, token: descifrar(registro.token) }
}

/** Igual que obtenerWidget pero sin exponer el token, para mostrarlo en el asistente. */
export async function obtenerWidgetPublico(id) {
  const registro = await kv.get(`widget:${id}`)
  if (!registro) return null
  const { token, ...resto } = registro
  return resto
}

/** Encuentra el widget a partir del enlace privado de edicion. */
export async function obtenerPorEdicion(idEdicion) {
  const id = await kv.get(`edicion:${idEdicion}`)
  if (!id) return null
  const config = await obtenerWidgetPublico(id)
  if (!config) return null
  return { id, config }
}

/** Actualiza los datos de un widget existente (excepto sus ids). */
export async function actualizarWidget(id, cambios) {
  const registro = await kv.get(`widget:${id}`)
  if (!registro) return { error: 'No se encontro el widget.' }
  const nuevo = { ...registro, ...cambios }
  if (cambios.token) nuevo.token = cifrar(cambios.token)
  await kv.set(`widget:${id}`, nuevo)
  return { ok: true }
}
