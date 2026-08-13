import Link from 'next/link'

export const metadata = {
  title: 'Content Kit — tu feed de Instagram, dentro de Notion',
  description:
    'Conecta tu calendario de contenido de Notion y visualiza tu feed de Instagram en tiempo real, sin salir de Notion.',
}

const FUNCIONES = [
  {
    icono: '🖼️',
    titulo: 'Grid en tiempo real',
    texto: 'Tu feed como cuadrícula 3x3, igual a Instagram. Cambias algo en Notion y se refleja al instante.',
  },
  {
    icono: '👆',
    titulo: 'Arrastra y suelta',
    texto: 'Toma una imagen de tu computador, suéltala sobre una casilla y queda guardada en Notion. Sin abrir la tarea.',
  },
  {
    icono: '🔀',
    titulo: 'Reordena arrastrando',
    texto: 'Mueve publicaciones para probar el orden del feed. El cambio se guarda solo en tu calendario.',
  },
  {
    icono: '▶️',
    titulo: 'Carruseles y reels',
    texto: 'Navega tus carruseles y previsualiza reels dentro del widget, tal como los vería un seguidor.',
  },
  {
    icono: '👤',
    titulo: 'Vista previa del post',
    texto: 'Toca una publicación y ve exactamente cómo se verá: caption, hashtags, música y likes.',
  },
  {
    icono: '🌙',
    titulo: 'Modo claro y oscuro',
    texto: 'Se adapta solo al tema de tu Notion, o lo fijas tú al generar el enlace.',
  },
]

const PASOS = [
  {
    n: '1',
    titulo: 'Conecta tu Notion',
    texto: 'Crea una integración gratuita en Notion y pega el token en nuestra página de instalación.',
  },
  {
    n: '2',
    titulo: 'Pega tu calendario',
    texto: 'Copia el enlace de tu base de datos de contenido. Nosotros la leemos, tú no tocas código.',
  },
  {
    n: '3',
    titulo: 'Recibe tu widget',
    texto: 'Te damos un enlace único. Lo pegas en Notion como bloque /embed y tu grid aparece al instante.',
  },
  {
    n: '4',
    titulo: 'Actualiza y ya',
    texto: 'Cada vez que cambies algo en Notion, presiona Actualizar en el widget y tu feed se pone al día.',
  },
]

export default function Landing() {
  return (
    <div className="landing">
      <nav className="nav">
        <img src="/marca/logotipo.png" alt="Content Kit" style={{ height: 22 }} />
        <div className="nav-enlaces">
          <a href="#funciones">Funciones</a>
          <a href="#precio">Precio</a>
          <a href="#faq">FAQ</a>
          <Link href="/setup" className="btn-cta">
            Instalar mi feed
          </Link>
        </div>
      </nav>

      <header className="hero">
        <span className="hero-etiqueta">Widget de Notion para creadores y agencias</span>
        <h1>
          Tu feed de Instagram, <em>dentro de Notion.</em>
        </h1>
        <p>
          Sin mockups manuales, sin capturas de pantalla. Planeas en Notion y ves tu grid
          actualizarse en tiempo real, en el mismo lugar donde ya trabajas.
        </p>
        <div className="hero-acciones">
          <Link href="/setup" className="btn-cta">
            Empezar gratis →
          </Link>
          <a href="#precio" className="btn-fantasma">
            Ver planes
          </a>
        </div>
      </header>

      <section className="seccion">
        <p className="seccion-etiqueta">El problema</p>
        <h2>
          Deja de adivinar cómo <em>va a quedar</em> tu feed.
        </h2>
        <p className="desc">
          Cambias una foto y el mockup manual ya no sirve. Cambias el orden y empiezas de cero.
          Content Kit conecta tu calendario de Notion con una vista de grid real — la actualizas y
          tu feed se refleja al instante, sin volver a armar nada.
        </p>
      </section>

      <section className="seccion" id="funciones">
        <p className="seccion-etiqueta">Qué puedes hacer</p>
        <h2>
          Planea tu contenido <em>con intención,</em> sin salir de Notion.
        </h2>
        <div className="funciones">
          {FUNCIONES.map((f) => (
            <div className="funcion" key={f.titulo}>
              <span className="icono">{f.icono}</span>
              <h3>{f.titulo}</h3>
              <p>{f.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="seccion">
        <p className="seccion-etiqueta">Cómo funciona</p>
        <h2>
          Instalación de una sola vez. <em>Después es automático.</em>
        </h2>
        <div className="pasos-numerados">
          {PASOS.map((p) => (
            <div className="paso-num" key={p.n}>
              <span className="num">{p.n}</span>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="seccion" id="precio">
        <p className="seccion-etiqueta">Precio</p>
        <h2>
          Un solo pago. <em>Tuyo para siempre.</em>
        </h2>
        <p className="desc">Sin suscripciones, sin renovaciones. Pagas una vez y lo usas cuanto quieras.</p>

        <div className="precios">
          <div className="precio-tarjeta">
            <h3>Gratis</h3>
            <p className="precio-sub">Empieza sin tarjeta</p>
            <div className="precio-monto">$0</div>
            <p className="precio-nota">para siempre</p>
            <ul className="precio-lista">
              <li>Grid en tiempo real, cuadrícula 3x3</li>
              <li>Hasta 9 publicaciones</li>
              <li>Arrastra y suelta imágenes</li>
              <li>1 cuenta conectada</li>
            </ul>
            <Link href="/setup" className="btn-fantasma" style={{ width: '100%', justifyContent: 'center' }}>
              Empezar gratis
            </Link>
          </div>

          <div className="precio-tarjeta" data-destacado="true">
            <span className="precio-recomendado">Recomendado</span>
            <h3>Pro</h3>
            <p className="precio-sub">Para agencias y varias cuentas</p>
            <div className="precio-monto">
              $XX.XXX <span>COP</span>
            </div>
            <p className="precio-nota">pago único · acceso de por vida</p>
            <ul className="precio-lista">
              <li>Todo lo del plan gratis</li>
              <li>Cuentas ilimitadas</li>
              <li>Carruseles, reels y vista previa del post</li>
              <li>Reordenar arrastrando</li>
              <li>Modo claro y oscuro</li>
              <li>Actualizaciones futuras incluidas</li>
            </ul>
            <Link href="/setup" className="btn-cta" style={{ width: '100%', justifyContent: 'center' }}>
              Obtener Pro
            </Link>
          </div>
        </div>
      </section>

      <section className="seccion" id="faq">
        <p className="seccion-etiqueta">Preguntas frecuentes</p>
        <h2>FAQ</h2>
        <div>
          <div className="faq-item">
            <h3>¿Necesito saber programar?</h3>
            <p>No. Pegas tu token de Notion en nuestra página y nosotros hacemos el resto.</p>
          </div>
          <div className="faq-item">
            <h3>¿Es seguro darles mi token de Notion?</h3>
            <p>
              Tu token se guarda cifrado. Nunca aparece en el enlace que pegas en Notion, y puedes
              revocarlo desde Notion cuando quieras.
            </p>
          </div>
          <div className="faq-item">
            <h3>¿Qué pasa si cambio mi calendario de Notion?</h3>
            <p>
              Presiona Actualizar en el widget y trae los cambios más recientes. No necesitas
              regenerar el enlace.
            </p>
          </div>
        </div>
      </section>

      <footer className="pie">
        <img src="/marca/logotipo.png" alt="Content Kit" style={{ height: 18, opacity: 0.7 }} />
        <div className="pie-enlaces">
          <a href="mailto:hola@contentkit.co">Contacto</a>
          <Link href="/autoinstalar">Instalar mi propia copia</Link>
        </div>
        <small>© 2026 Content Kit. Todos los derechos reservados.</small>
      </footer>
    </div>
  )
}
