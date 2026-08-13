import Grid from '../../../app/g/Grid'

export const dynamic = 'force-dynamic'

// Esta es la pagina que el comprador pega en Notion con /embed. El id en la
// URL es publico (como un enlace para compartir) pero no revela ni el token
// ni la base de datos: eso se queda guardado en el servidor.
export default function PaginaEmbed({ params }) {
  const config = {
    epFeed: `/api/embed/${params.id}/data`,
    epUpload: `/api/embed/${params.id}/upload`,
    epOrder: `/api/embed/${params.id}/order`,
    incluirParametros: false,
    db: params.id, // solo para que la grilla sepa que si hay "algo" configurado
  }
  return <Grid config={config} />
}
