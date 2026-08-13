'use client'

import { useState } from 'react'

const PASOS = ['Conectar', 'Personalizar', 'Listo']

export default function Setup() {
  const [paso, setPaso] = useState(1)
  const [token, setToken] = useState('')
  const [db, setDb] = useState('')
  const [verificando, setVerificando] = useState(false)
  const [error, setError] = useState('')
  const [resumen, setResumen] = useState(null)

  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [estado, setEstado] = useState('')
  const [marca, setMarca] = useState('')
  const [oscuro, setOscuro] = useState(true)

  const [creando, setCreando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [copiado, setCopiado] = useState('')

  async function verificar() {
    setError('')
    if (!/^(ntn_|secret_)/.test(token.trim())) {
      setError('Eso no parece un token de Notion. Debe empezar con ntn_ o secret_.')
      return
    }
    if (!db.trim()) {
      setError('Falta el enlace de tu base de datos.')
      return
    }
    setVerificando(true)
    try {
      const res = await fetch('/api/setup/probar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), db: db.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo conectar.')
      setResumen(json)
      if (json.perfil?.titulo) setHandle((h) => h || slugificar(json.perfil.titulo))
      if (json.perfil?.descripcion) setBio((b) => b || json.perfil.descripcion)
      setPaso(2)
    } catch (e) {
      setError(e.message)
    } finally {
      setVerificando(false)
    }
  }

  async function crear() {
    setError('')
    setCreando(true)
    try {
      const res = await fetch('/api/setup/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          db: db.trim(),
          handle: handle.trim(),
          bio: bio.trim(),
          avatar: avatar.trim(),
          estado: estado.trim(),
          marca: marca.trim(),
          tema: oscuro ? 'oscuro' : 'claro',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo crear tu widget.')
      setResultado(json)
      setPaso(3)
    } catch (e) {
      setError(e.message)
    } finally {
      setCreando(false)
    }
  }

  function slugificar(t) {
    return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '')
  }

  const origen = typeof window !== 'undefined' ? window.location.origin : ''
  const enlaceEmbed = resultado ? `${origen}/embed/${resultado.id}` : ''
  const enlaceEdicion = resultado ? `${origen}/setup/${resultado.idEdicion}` : ''

  async function copiar(texto, cual) {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(cual)
      setTimeout(() => setCopiado(''), 2000)
    } catch {}
  }

  return (
    <main className="setup">
      <a href="/" style={{ display: 'inline-block', marginBottom: 18, fontSize: 13, color: 'var(--sub)', textDecoration: 'none' }}>
        ← Volver al inicio
      </a>
      <div className="marca-cabecera">
        <img src="/marca/logotipo.png" alt="Content Kit" className="marca-logotipo" />
      </div>
      <h1>Instala tu feed</h1>
      <p className="intro">
        Sin GitHub, sin Vercel. Todo corre aqui. Toma unos 5 minutos.
      </p>

      <div className="campo" style={{ display: 'flex', gap: 6, marginBottom: 30 }}>
        {PASOS.map((p, i) => (
          <span
            key={p}
            className="btn"
            data-activo={paso === i + 1}
            style={{ pointerEvents: 'none', opacity: paso >= i + 1 ? 1 : 0.4 }}
          >
            {i + 1}. {p}
          </span>
        ))}
      </div>

      {paso === 1 && (
        <>
          <div className="campo">
            <label htmlFor="token">Token de integración de Notion</label>
            <input
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ntn_..."
            />
            <p className="ayuda">
              1. Entra a <strong>notion.so/my-integrations</strong> → New integration → nombre
              cualquiera → tipo Internal → Submit.
              <br />
              2. Copia el <strong>Internal Integration Secret</strong> y pégalo aquí. Es privado:
              solo nosotros lo guardamos, cifrado, para leer tu calendario.
            </p>
          </div>

          <div className="campo">
            <label htmlFor="db">Enlace de tu calendario en Notion</label>
            <input
              id="db"
              value={db}
              onChange={(e) => setDb(e.target.value)}
              placeholder="https://www.notion.so/..."
            />
            <p className="ayuda">
              Antes de continuar, abre esa base en Notion → ••• → Conexiones → agrega la
              integración que acabas de crear.
            </p>
          </div>

          {error && (
            <div className="aviso">
              <h3>Algo falta</h3>
              <p>{error}</p>
            </div>
          )}

          <button className="btn" onClick={verificar} disabled={verificando}>
            {verificando ? 'Verificando…' : 'Verificar conexión'}
          </button>
        </>
      )}

      {paso === 2 && (
        <>
          <div className="resultado" style={{ marginBottom: 24 }}>
            <p>
              Conectado. Encontré {resumen?.total ?? 0} publicaciones, {resumen?.conImagen ?? 0}{' '}
              con imagen.
            </p>
          </div>

          <div className="campo">
            <label htmlFor="handle">Usuario de Instagram</label>
            <input id="handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="tunegocio" />
          </div>

          <div className="campo">
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
            <p className="ayuda">Si la dejas vacía, se toma de la descripción de tu base en Notion.</p>
          </div>

          <div className="campo">
            <label htmlFor="avatar">Foto de perfil (opcional)</label>
            <input id="avatar" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." />
            <p className="ayuda">Si la dejas vacía, se toma del ícono de tu calendario en Notion.</p>
          </div>

          <div className="campo">
            <label htmlFor="marca">Filtrar por marca (opcional)</label>
            <input id="marca" value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Asistir" />
            <p className="ayuda">Solo si organizas el trabajo por proyectos mensuales dentro de una misma base.</p>
          </div>

          <div className="campo">
            <label htmlFor="estado">Mostrar solo un estado (opcional)</label>
            <input id="estado" value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="Aprobado" />
          </div>

          <div className="campo">
            <label>Tema</label>
            <div className="acciones">
              <button className="btn" data-activo={oscuro} onClick={() => setOscuro(true)}>Oscuro</button>
              <button className="btn" data-activo={!oscuro} onClick={() => setOscuro(false)}>Claro</button>
            </div>
          </div>

          {error && (
            <div className="aviso">
              <h3>Algo falta</h3>
              <p>{error}</p>
            </div>
          )}

          <div className="acciones">
            <button className="btn" onClick={() => setPaso(1)}>Atrás</button>
            <button className="btn" data-activo={true} onClick={crear} disabled={creando}>
              {creando ? 'Creando…' : 'Crear mi widget'}
            </button>
          </div>
        </>
      )}

      {paso === 3 && resultado && (
        <>
          <div className="resultado">
            <p>Tu widget está listo. Pega este enlace en Notion:</p>
            <code className="enlace">{enlaceEmbed}</code>
            <div className="acciones">
              <button className="btn" onClick={() => copiar(enlaceEmbed, 'embed')}>
                {copiado === 'embed' ? 'Copiado' : 'Copiar enlace'}
              </button>
              <a className="btn" href={enlaceEmbed} target="_blank" rel="noreferrer">Ver el feed</a>
            </div>
          </div>

          <div className="resultado" style={{ marginTop: 20 }}>
            <p>
              Guarda este segundo enlace en un lugar seguro. Es privado: te sirve para volver y
              cambiar tu usuario, bio o token más adelante.
            </p>
            <code className="enlace">{enlaceEdicion}</code>
            <div className="acciones">
              <button className="btn" onClick={() => copiar(enlaceEdicion, 'edicion')}>
                {copiado === 'edicion' ? 'Copiado' : 'Copiar enlace de edición'}
              </button>
            </div>
          </div>

          <section className="pasos">
            <h2>Último paso</h2>
            <ol>
              <li>En Notion, escribe <strong>/embed</strong></li>
              <li>Pega el primer enlace de arriba</li>
              <li>Elige <strong>Insertar enlace</strong></li>
              <li>Estira el bloque desde abajo para darle altura</li>
            </ol>
          </section>
        </>
      )}
    </main>
  )
}
