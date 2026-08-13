import { probarConexion } from '../../../../lib/notion'

export const dynamic = 'force-dynamic'

// Paso intermedio del asistente: confirma que el token funciona y que puede
// leer la base, antes de dejar avanzar al comprador al siguiente paso.
export async function POST(request) {
  let token, db
  try {
    const body = await request.json()
    token = (body.token || '').trim()
    db = (body.db || '').trim()
  } catch {
    return Response.json({ error: 'Datos invalidos.' }, { status: 400 })
  }

  if (!token) return Response.json({ error: 'Falta el token.' }, { status: 400 })
  if (!/^(ntn_|secret_)/.test(token)) {
    return Response.json(
      { error: 'Eso no parece un token de Notion. Debe empezar con ntn_ o secret_.' },
      { status: 400 }
    )
  }
  if (!db) return Response.json({ error: 'Falta el enlace de tu base de datos.' }, { status: 400 })

  const resultado = await probarConexion({ token, db })
  if (!resultado.ok) return Response.json({ error: resultado.error }, { status: 400 })

  return Response.json(resultado)
}
