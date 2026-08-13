import { consultarFeed } from '../../../lib/notion'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Version autoinstalable: el token vive en la variable de entorno de la
// copia propia de cada usuario, nunca en una base de datos compartida.
export async function GET(request) {
  const token = process.env.NOTION_TOKEN
  if (!token) {
    return Response.json({ error: 'Falta la variable NOTION_TOKEN en el proyecto.' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const db = searchParams.get('db') || ''
  if (!db) return Response.json({ error: 'Falta el id de la base de datos.' }, { status: 400 })

  const r = await consultarFeed({
    token,
    db,
    estado: searchParams.get('estado') || '',
    cliente: searchParams.get('cliente') || '',
    proyecto: searchParams.get('proyecto') || '',
    marca: searchParams.get('marca') || '',
  })
  if (r.error) return Response.json({ error: r.error }, { status: r.estado || 400 })

  return Response.json(r, { headers: { 'Cache-Control': 'no-store' } })
}
