import { guardarOrden } from '../../../../lib/notion'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const token = process.env.NOTION_TOKEN
  if (!token) return Response.json({ error: 'Falta NOTION_TOKEN.' }, { status: 500 })

  let items
  try {
    const body = await request.json()
    items = body.items
  } catch {
    return Response.json({ error: 'Cuerpo invalido.' }, { status: 400 })
  }

  const r = await guardarOrden({ token, items })
  if (r.error) return Response.json(r, { status: 400 })
  return Response.json(r)
}
