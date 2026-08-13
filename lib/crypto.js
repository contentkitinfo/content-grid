// Cifra el token de Notion antes de guardarlo. Si alguien mas llega a leer la
// base de datos, ve texto cifrado, no la llave real de la cuenta del comprador.
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'

function llave() {
  const b64 = process.env.ENCRYPTION_KEY
  if (!b64) throw new Error('Falta la variable ENCRYPTION_KEY en el proyecto.')
  const buf = Buffer.from(b64, 'base64')
  if (buf.length !== 32) {
    throw new Error('ENCRYPTION_KEY debe ser una clave de 32 bytes en base64. Genera una nueva.')
  }
  return buf
}

export function cifrar(texto) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', llave(), iv)
  const cifrado = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, cifrado]).toString('base64')
}

export function descifrar(base64) {
  const datos = Buffer.from(base64, 'base64')
  const iv = datos.subarray(0, 12)
  const tag = datos.subarray(12, 28)
  const cifrado = datos.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', llave(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString('utf8')
}
