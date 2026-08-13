import { obtenerPorEdicion, actualizarWidget } from '../../../../lib/store'
import { probarConexion } from '../../../../lib/notion'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const encontrado = await obtenerPorEdicion(params.idEdicion)
  if (!encontrado) {
    return Response.json({ error: 'Ese enlace de edicion no es valido o ya expiro.' }, { status: 404 })
  }
  return Response.json(encontrado)
}

export async function POST(request, { params }) {
  const encontrado = await obtenerPorEdicion(params.idEdicion)
  if (!encontrado) {
    return Response.json({ error: 'Ese enlace de edicion no es valido o ya expiro.' }, { status: 404 })
  }

  let datos
  try {
    datos = await request.json()
  } catch {
    return Response.json({ error: 'Datos invalidos.' }, { status: 400 })
  }

  const cambios = {}
  for (const campo of ['handle', 'bio', 'avatar', 'estado', 'marca', 'proyecto']) {
    if (typeof datos[campo] === 'string') cambios[campo] = datos[campo].trim()
  }
  if (datos.tema === 'claro' || datos.tema === 'oscuro') cambios.tema = datos.tema

  // Cambiar el token o la base requiere volver a validar contra Notion.
  if (typeof datos.token === 'string' && datos.token.trim()) {
    const db = typeof datos.db === 'string' && datos.db.trim() ? datos.db.trim() : encontrado.config.db
    const prueba = await probarConexion({ token: datos.token.trim(), db })
    if (!prueba.ok) return Response.json({ error: prueba.error }, { status: 400 })
    cambios.token = datos.token.trim()
    cambios.db = db
  } else if (typeof datos.db === 'string' && datos.db.trim() && datos.db.trim() !== encontrado.config.db) {
    return Response.json(
      { error: 'Para cambiar de base de datos, vuelve a pegar tambien tu token.' },
      { status: 400 }
    )
  }

  const r = await actualizarWidget(encontrado.id, cambios)
  if (r.error) return Response.json(r, { status: 400 })
  return Response.json({ ok: true })
}
