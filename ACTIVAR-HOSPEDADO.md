# Activar la versión hospedada de Content Kit

Esto es solo para ti, el dueño de Content Kit. Se hace una sola vez, en tu
propio proyecto de Vercel. Tus compradores nunca ven ninguno de estos pasos.

---

## 1. Sube este código a tu proyecto

El zip trae carpetas nuevas: `lib/`, `app/setup/`, `app/embed/`. Súbelas junto
con lo demás a tu repositorio de GitHub, igual que siempre.

---

## 2. Activa el almacenamiento (Vercel KV)

Ahí es donde se guardan, cifrados, los tokens de tus compradores.

1. Entra a tu proyecto en Vercel
2. Pestaña **Storage** → **Create Database** → elige **KV** (Redis)
3. Nómbrala como quieras, por ejemplo `content-kit-widgets`
4. **Connect** al proyecto — Vercel agrega solo las variables que necesita

No tienes que copiar ninguna clave a mano: al conectar la base de datos,
Vercel mete automáticamente las variables `KV_REST_API_URL` y
`KV_REST_API_TOKEN` en tu proyecto.

---

## 3. Genera tu llave de cifrado

Esta es la clave que protege los tokens guardados. Ábrela una terminal
(en tu Mac, la app **Terminal**) y pega esto:

```
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Te va a dar algo como `MeGQZGY7B71G3qU+txstgGQGB4TgocedRJ5lMJRY9e8=`.

En Vercel: **Settings → Environment Variables** → agrega una nueva:

- Name: `ENCRYPTION_KEY`
- Value: lo que te dio la terminal
- Environments: Production and Preview

Guárdala también en un lugar seguro tuyo, fuera de Vercel. **Si la pierdes,
no vas a poder leer los tokens ya guardados** y tus compradores tendrían
que volver a pegar el suyo desde su enlace de edición.

---

## 4. Vuelve a publicar

Con las dos cosas conectadas (KV y ENCRYPTION_KEY), Vercel vuelve a publicar
solo, o lo puedes forzar desde **Deployments → Redeploy**.

---

## Cómo queda para el comprador

1. Va a `tudominio.com/setup`
2. Pega su token de Notion y el enlace de su calendario
3. Personaliza usuario, bio, tema
4. Recibe dos enlaces: uno para pegar en Notion (`/embed/xxxxx`) y uno
   privado para volver a editar su configuración (`/setup/xxxxx`)

Nunca ve GitHub, Vercel, ni una terminal.

---

## Qué implica para ti, sin adornos

- **El servidor tiene que seguir prendido.** Si dejas de pagar Vercel o
  borras el proyecto, todos los widgets hospedados se apagan a la vez —
  a diferencia de la versión autoinstalable, donde cada quien tiene la suya.
- **Estás guardando tokens de terceros.** Van cifrados, pero la
  responsabilidad de cuidarlos es tuya. No compartas tu `ENCRYPTION_KEY`
  con nadie.
- **El costo crece con cada comprador**, aunque sea poco por persona. Con
  pago único, cobra pensando en eso — por eso conviene limitar cuántas
  cuentas de Instagram incluye el plan básico.
- **El límite gratis de Vercel KV es generoso** para empezar (cientos de
  miles de solicitudes al mes), pero revisa el uso en el panel de Storage
  de vez en cuando. Si creces mucho, ahí sí pasas a un plan pago de KV.
