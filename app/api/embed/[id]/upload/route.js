import { obtenerWidget } from '../../../../../lib/store'
import { subirArchivo } from '../../../../../lib/notion'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request, { params }) {
  const widget = await obtenerWidget(params.id)
  if (!widget) return Response.json({ error: 'Este widget no existe.' }, { status: 404 })

  let archivo, pageId
  try {
    const form = await request.formData()
    archivo = form.get('archivo')
    pageId = form.get('pageId')
  } catch {
    return Response.json({ error: 'No se recibio el archivo.' }, { status: 400 })
  }
  if (!archivo || typeof archivo === 'string' || !pageId) {
    return Response.json({ error: 'Falta el archivo o la publicacion.' }, { status: 400 })
  }

  const r = await subirArchivo({ token: widget.token, pageId, archivo })
  if (r.error) return Response.json({ error: r.error }, { status: 400 })
  return Response.json(r)
}
