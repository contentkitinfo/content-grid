'use client'

import { useEffect, useState } from 'react'

export default function EditarSetup({ params }) {
  const { idEdicion } = params
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [id, setId] = useState('')

  const [token, setToken] = useState('')
  const [db, setDb] = useState('')
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [estado, setEstado] = useState('')
  const [marca, setMarca] = useState('')
  const [oscuro, setOscuro] = useState(true)

  useEffect(() => {
    fetch(`/api/setup/${idEdicion}`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) throw new Error(j.error)
        setId(j.id)
        setDb(j.config.db || '')
        setHandle(j.config.handle || '')
        setBio(j.config.bio || '')
        setAvatar(j.config.avatar || '')
        setEstado(j.config.estado || '')
        setMarca(j.config.marca || '')
        setOscuro(j.config.tema !== 'claro')
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [idEdicion])

  async function guardar() {
    setError('')
    setGuardando(true)
    try {
      const cuerpo = { handle, bio, avatar, estado, marca, tema: oscuro ? 'oscuro' : 'claro' }
      // El token y la base solo se mandan si el usuario los toco; si no,
      // se queda con lo que ya tenia guardado.
      if (token.trim()) cuerpo.token = token.trim()
      if (db.trim()) cuerpo.db = db.trim()

      const res = await fetch(`/api/setup/${idEdicion}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo guardar.')
      setGuardado(true)
      setToken('')
      setTimeout(() => setGuardado(false), 2500)
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const origen = typeof window !== 'undefined' ? window.location.origin : ''

  if (cargando) {
    return (
      <main className="setup">
        <div className="marca-cabecera">
          <img src="/marca/logotipo.png" alt="Content Kit" className="marca-logotipo" />
        </div>
        <h1>Cargando…</h1>
      </main>
    )
  }

  if (error && !id) {
    return (
      <main className="setup">
        <div className="marca-cabecera">
          <img src="/marca/logotipo.png" alt="Content Kit" className="marca-logotipo" />
        </div>
        <h1>No encontrado</h1>
        <div className="aviso">
          <p>{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="setup">
      <div className="marca-cabecera">
        <img src="/marca/logotipo.png" alt="Content Kit" className="marca-logotipo" />
      </div>
      <h1>Edita tu widget</h1>
      <p className="intro">
        Tu feed en vivo: <code>{origen}/embed/{id}</code>
      </p>

      <div className="campo">
        <label htmlFor="handle">Usuario de Instagram</label>
        <input id="handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
      </div>

      <div className="campo">
        <label htmlFor="bio">Bio</label>
        <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>

      <div className="campo">
        <label htmlFor="avatar">Foto de perfil</label>
        <input id="avatar" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." />
      </div>

      <div className="campo">
        <label htmlFor="marca">Filtrar por marca</label>
        <input id="marca" value={marca} onChange={(e) => setMarca(e.target.value)} />
      </div>

      <div className="campo">
        <label htmlFor="estado">Mostrar solo un estado</label>
        <input id="estado" value={estado} onChange={(e) => setEstado(e.target.value)} />
      </div>

      <div className="campo">
        <label>Tema</label>
        <div className="acciones">
          <button className="btn" data-activo={oscuro} onClick={() => setOscuro(true)}>Oscuro</button>
          <button className="btn" data-activo={!oscuro} onClick={() => setOscuro(false)}>Claro</button>
        </div>
      </div>

      <div className="campo" style={{ borderTop: '1px solid var(--hair)', paddingTop: 20, marginTop: 30 }}>
        <label htmlFor="token">Cambiar el token de Notion (opcional)</label>
        <input id="token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="ntn_..." />
        <p className="ayuda">Solo llénalo si tu token dejó de funcionar o quieres reemplazarlo.</p>
      </div>

      <div className="campo">
        <label htmlFor="db">Cambiar la base de datos (opcional)</label>
        <input id="db" value={db} onChange={(e) => setDb(e.target.value)} placeholder="https://www.notion.so/..." />
        <p className="ayuda">Si cambias esto, también tienes que llenar el token de arriba.</p>
      </div>

      {error && (
        <div className="aviso">
          <h3>Algo falta</h3>
          <p>{error}</p>
        </div>
      )}

      <button className="btn" data-activo={true} onClick={guardar} disabled={guardando}>
        {guardando ? 'Guardando…' : guardado ? 'Guardado' : 'Guardar cambios'}
      </button>
    </main>
  )
}
