# PHPMailer y API de Contacto

Este módulo PHP expone un endpoint para enviar mensajes del formulario de contacto desde el frontend y soporta dos modos de envío: SMTP real y modo de registro en archivo (log) para desarrollo.

## Estructura
- `src/php/public/index.php` — Punto de entrada (maneja CORS, rutas y respuestas JSON)
- `src/php/controllers/ContactController.php` — Controlador que valida y envía el correo
- `src/php/services/MailerService.php` — Configura PHPMailer (SMTP o log) y compone el email
- `src/php/config/config.php` — Lee variables de entorno (`.env`) y construye la configuración
- `src/php/.env` — Variables de entorno para SMTP y opciones del transporte

## Ejecutar el servidor en desarrollo
Arranca el servidor embebido de PHP en el puerto 8001:

```
php -S 127.0.0.1:8001 -t src/php/public
```

Con esto el endpoint estará disponible en:

```
http://127.0.0.1:8001/index.php?route=contact/send
```

## Integración con el frontend
El frontend envía el POST al endpoint definido por la meta `nc-contact-api` en `index.html`. Ejemplo:

```
<meta name="nc-contact-api" content="http://127.0.0.1:8001/index.php?route=contact/send" />
```

El script del formulario (`src/js/forms.js`) envía los campos como `application/x-www-form-urlencoded`:
- `nombre`
- `email`
- `asunto`
- `mensaje`

Respuesta JSON esperada:
- Éxito: `{ ok: true, message: "Mensaje enviado", transport: "smtp" | "log" }`
- Error: `{ ok: false, error: "...", [debug]: [...] }`

## CORS
`index.php` maneja preflight y cabeceras de CORS para permitir peticiones desde el dev server (Vite 5173):
- `OPTIONS` responde `204` con `Access-Control-Allow-Origin: *`
- Las respuestas incluyen `Access-Control-Allow-Origin: *`

Si usas un proxy/reverse proxy, ajusta las cabeceras según sea necesario.

## Configuración (.env)
Edita `src/php/.env` para configurar SMTP o el modo log. Variables principales (todas con sufijo `_ap`):

```
# Transporte: 'smtp' para envío real, 'log' para desarrollo
MAIL_TRANSPORT_ap=log

# SMTP (rellena si usas MAIL_TRANSPORT_ap=smtp)
SMTP_HOST_ap=smtp.example.com
SMTP_PORT_ap=587
SMTP_SECURE_ap=tls   # tls o ssl
SMTP_USER_ap=
SMTP_PASS_ap=
SMTP_DEBUG_ap=0      # 0–4 (a mayor valor, más trazas)

# Remitente y destinatario
FROM_EMAIL_ap=no-reply@novaciencia.academy
FROM_NAME_ap=NovaCiencia
TO_EMAIL_ap=contacto@novaciencia.academy
TO_NAME_ap=Contacto

# Ruta del archivo de log (modo log). Si no se define, usa src/php/public/mail.log
MAIL_LOG_PATH_ap=
```

Notas:
- En modo `log`, el correo no se envía: se escribe el MIME del mensaje en un archivo (`mail.log`) para inspección.
- Si `MAIL_LOG_PATH_ap` está vacío, se usará `src/php/public/mail.log` por defecto.

## Verificación rápida
1) Arranca el servidor PHP:
```
php -S 127.0.0.1:8001 -t src/php/public
```
2) Asegura la meta en `index.html`:
```
<meta name="nc-contact-api" content="http://127.0.0.1:8001/index.php?route=contact/send" />
```
3) Envía el formulario desde la portada o prueba con curl:
```
curl -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "nombre=Prueba&email=prueba@example.com&asunto=Hola&mensaje=Mensaje" \
  http://127.0.0.1:8001/index.php?route=contact/send
```
4) Si `MAIL_TRANSPORT_ap=log`, revisa `src/php/public/mail.log` (o la ruta definida) para confirmar que se registró el mensaje.

## Solución de problemas
- "Failed to fetch" en el navegador:
  - El servidor PHP no está corriendo en 8001.
  - La meta `nc-contact-api` tiene una URL distinta al servidor activo.
  - Firewall/antivirus bloquea el puerto 8001.
  - Mismatch http/https u origen restringido por un proxy.
- Error SMTP:
  - Revisa credenciales y puerto/seguridad (`SMTP_*_ap`).
  - Sube `SMTP_DEBUG_ap` a `2` o más para ver trazas en el JSON de respuesta (`debug`).
- Archivo de log no se crea (modo log):
  - Asegura permisos de escritura en la carpeta destino.
  - Define `MAIL_LOG_PATH_ap` con una ruta válida si prefieres ubicarlo fuera de `public`.

## Producción
- Coloca el endpoint detrás de un servidor (Apache/Nginx) y configura HTTPS.
- Restringe `Access-Control-Allow-Origin` al dominio de tu frontend.
- Cambia `MAIL_TRANSPORT_ap` a `smtp` y usa credenciales seguras.

## Endpoint
- URL: `/index.php?route=contact/send`
- Método: `POST`
- Content-Type: `application/x-www-form-urlencoded`
- Respuesta: JSON

