import { obtenerWidget } from '../../../../../lib/store'
import { consultarFeed } from '../../../../../lib/notion'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request, { params }) {
  const widget = await obtenerWidget(params.id)
  if (!widget) {
    return Response.json(
      { error: 'Este widget no existe o fue eliminado.' },
      { status: 404 }
    )
  }

  const r = await consultarFeed({
    token: widget.token,
    db: widget.db,
    estado: widget.estado,
    marca: widget.marca,
    proyecto: widget.proyecto,
  })
  if (r.error) return Response.json({ error: r.error }, { status: 400 })

  return Response.json(
    { ...r, handle: widget.handle, bio: widget.bio, avatar: widget.avatar, tema: widget.tema },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
