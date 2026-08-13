import { redirect } from 'next/navigation'

// La pagina de ventas ahora vive en el sitio de Hostinger. Este dominio de
// Vercel solo sirve el asistente de instalacion y el widget en si.
export default function Inicio() {
  redirect('/setup')
}
