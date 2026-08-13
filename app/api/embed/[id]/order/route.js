import { obtenerWidget } from '../../../../../lib/store'
import { guardarOrden } from '../../../../../lib/notion'

export const dynamic = 'force-dynamic'

export async function POST(request, { params }) {
  const widget = await obtenerWidget(params.id)
  if (!widget) return Response.json({ error: 'Este widget no existe.' }, { status: 404 })

  let items
  try {
    const body = await request.json()
    items = body.items
  } catch {
    return Response.json({ error: 'Cuerpo invalido.' }, { status: 400 })
  }

  const r = await guardarOrden({ token: widget.token, items })
  if (r.error) return Response.json(r, { status: 400 })
  return Response.json(r)
}
