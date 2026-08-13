import { crearWidget } from '../../../../lib/store'
import { probarConexion } from '../../../../lib/notion'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  let datos
  try {
    datos = await request.json()
  } catch {
    return Response.json({ error: 'Datos invalidos.' }, { status: 400 })
  }

  const token = (datos.token || '').trim()
  const db = (datos.db || '').trim()
  if (!token || !db) {
    return Response.json({ error: 'Falta el token o la base de datos.' }, { status: 400 })
  }

  // Se vuelve a validar aqui: nunca confiamos en lo que ya se probo en el
  // paso anterior, porque el comprador pudo cambiar el token entre medio.
  const prueba = await probarConexion({ token, db })
  if (!prueba.ok) return Response.json({ error: prueba.error }, { status: 400 })

  try {
    const { id, idEdicion } = await crearWidget({
      token,
      db,
      handle: (datos.handle || '').trim(),
      bio: (datos.bio || '').trim(),
      avatar: (datos.avatar || '').trim(),
      estado: (datos.estado || '').trim(),
      marca: (datos.marca || '').trim(),
      proyecto: (datos.proyecto || '').trim(),
      tema: datos.tema === 'claro' ? 'claro' : 'oscuro',
    })
    return Response.json({ id, idEdicion })
  } catch (e) {
    return Response.json(
      { error: `No se pudo guardar tu widget. ${String(e)}` },
      { status: 500 }
    )
  }
}
