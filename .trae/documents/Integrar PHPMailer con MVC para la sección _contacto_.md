## Objetivo
- Integrar PHPMailer en `#contacto` con arquitectura MVC en `src/php`.
- Usar convención de nombres con sufijo `_ap` en variables y claves de configuración/entorno relacionadas.

## Flujo
- Frontend envía POST a `/src/php/public/index.php?route=contact/send`.
- `ContactController_ap` valida y delega a `MailerService_ap`.
- PHPMailer envía email y responde JSON.

## Estructura (`src/php`)
- `public/index.php`
- `config/config.php`
- `bootstrap/env.php`
- `controllers/ContactController.php`
- `models/ContactForm.php`
- `services/MailerService.php`
- `helpers/Response.php`
- `vendor/` (Composer)
- `.env.example`

## Endpoint
- POST: `/src/php/public/index.php?route=contact/send`
- Campos: `nombre`, `email`, `asunto`, `mensaje`
- Respuesta: JSON (`ok`, `message` o `errors`)

## Frontend
- `src/js/forms.js` ya usa sufijo `_ap`; se mantendrá y solo cambiará el envío a PHP.
- Meta en `index.html`: `nc-contact-api` para configurar el endpoint.

## Entorno y configuración con `_ap`
- Variables de entorno: `SMTP_HOST_ap`, `SMTP_PORT_ap`, `SMTP_SECURE_ap`, `SMTP_USER_ap`, `SMTP_PASS_ap`, `FROM_EMAIL_ap`, `FROM_NAME_ap`, `TO_EMAIL_ap`, `TO_NAME_ap`.
- `Config_ap` devolverá estas claves y `MailerService_ap` las usará.

## Código propuesto (con sufijo `_ap`)

### `src/php/public/index.php`
```php
<?php
require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/../bootstrap/env.php';
require_once __DIR__.'/../config/config.php';
use App\Controllers\ContactController;
$method_ap = $_SERVER['REQUEST_METHOD'];
$route_ap = isset($_GET['route']) ? $_GET['route'] : '';
if ($method_ap === 'POST' && $route_ap === 'contact/send') {
    (new ContactController())->send($_POST);
} else {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['ok'=>false,'error'=>'Not found']);
}
```

### `src/php/config/config.php`
```php
<?php
namespace App\Config;
class Config_ap {
    public static function smtp_ap() {
        return [
            'host_ap' => getenv('SMTP_HOST_ap') ?: 'smtp.example.com',
            'port_ap' => getenv('SMTP_PORT_ap') ?: 587,
            'secure_ap' => getenv('SMTP_SECURE_ap') ?: 'tls',
            'user_ap' => getenv('SMTP_USER_ap') ?: '',
            'pass_ap' => getenv('SMTP_PASS_ap') ?: '',
            'from_email_ap' => getenv('FROM_EMAIL_ap') ?: 'no-reply@novaciencia.academy',
            'from_name_ap' => getenv('FROM_NAME_ap') ?: 'NovaCiencia',
            'to_email_ap' => getenv('TO_EMAIL_ap') ?: 'contacto@novaciencia.academy',
            'to_name_ap' => getenv('TO_NAME_ap') ?: 'Contacto'
        ];
    }
}
```

### `src/php/controllers/ContactController.php`
```php
<?php
namespace App\Controllers;
use App\Models\ContactForm;
use App\Services\MailerService;
use App\Helpers\Response;
class ContactController {
    public function send(array $data_ap) {
        $form_ap = ContactForm::fromArray($data_ap);
        $errors_ap = $form_ap->validate();
        if ($errors_ap) { Response::json(['ok'=>false,'errors'=>$errors_ap], 422); return; }
        $mailer_ap = new MailerService();
        $sent_ap = $mailer_ap->sendContact($form_ap);
        if (!$sent_ap['ok']) { Response::json($sent_ap, 500); return; }
        Response::json(['ok'=>true,'message'=>'Mensaje enviado']);
    }
}
```

### `src/php/models/ContactForm.php`
```php
<?php
namespace App\Models;
class ContactForm {
    public string $nombre_ap;
    public string $email_ap;
    public string $asunto_ap;
    public string $mensaje_ap;
    public static function fromArray(array $d_ap): self {
        $c_ap = new self();
        $c_ap->nombre_ap = trim($d_ap['nombre'] ?? '');
        $c_ap->email_ap = trim($d_ap['email'] ?? '');
        $c_ap->asunto_ap = trim($d_ap['asunto'] ?? '');
        $c_ap->mensaje_ap = trim($d_ap['mensaje'] ?? '');
        return $c_ap;
    }
    public function validate(): array {
        $e_ap = [];
        if ($this->nombre_ap === '') $e_ap['nombre'] = 'Requerido';
        if ($this->email_ap === '' || !filter_var($this->email_ap, FILTER_VALIDATE_EMAIL)) $e_ap['email'] = 'Correo inválido';
        if ($this->asunto_ap === '') $e_ap['asunto'] = 'Requerido';
        if ($this->mensaje_ap === '' || strlen($this->mensaje_ap) < 10) $e_ap['mensaje'] = 'Muy corto';
        return $e_ap;
    }
}
```

### `src/php/services/MailerService.php`
```php
<?php
namespace App\Services;
use PHPMailer\PHPMailer\PHPMailer;
use App\Config\Config_ap;
use App\Models\ContactForm;
class MailerService {
    public function sendContact(ContactForm $form_ap): array {
        $smtp_ap = Config_ap::smtp_ap();
        $mail_ap = new PHPMailer(true);
        try {
            $mail_ap->isSMTP();
            $mail_ap->Host = $smtp_ap['host_ap'];
            $mail_ap->Port = (int)$smtp_ap['port_ap'];
            $mail_ap->SMTPAuth = true;
            $mail_ap->SMTPSecure = $smtp_ap['secure_ap'];
            $mail_ap->Username = $smtp_ap['user_ap'];
            $mail_ap->Password = $smtp_ap['pass_ap'];
            $mail_ap->setFrom($smtp_ap['from_email_ap'], $smtp_ap['from_name_ap']);
            $mail_ap->addAddress($smtp_ap['to_email_ap'], $smtp_ap['to_name_ap']);
            $mail_ap->Subject = $form_ap->asunto_ap;
            $mail_ap->isHTML(true);
            $mail_ap->Body = $this->renderContactBody_ap($form_ap);
            $mail_ap->AltBody = $this->renderContactAlt_ap($form_ap);
            $mail_ap->send();
            return ['ok'=>true];
        } catch (\Throwable $ex_ap) {
            return ['ok'=>false,'error'=>$ex_ap->getMessage()];
        }
    }
    private function renderContactBody_ap(ContactForm $f_ap): string {
        $n_ap = htmlspecialchars($f_ap->nombre_ap, ENT_QUOTES, 'UTF-8');
        $e_ap = htmlspecialchars($f_ap->email_ap, ENT_QUOTES, 'UTF-8');
        $a_ap = htmlspecialchars($f_ap->asunto_ap, ENT_QUOTES, 'UTF-8');
        $m_ap = nl2br(htmlspecialchars($f_ap->mensaje_ap, ENT_QUOTES, 'UTF-8'));
        return "<h2>Nuevo mensaje de contacto</h2><p><b>Nombre:</b> $n_ap</p><p><b>Correo:</b> $e_ap</p><p><b>Asunto:</b> $a_ap</p><p><b>Mensaje:</b><br>$m_ap</p>";
    }
    private function renderContactAlt_ap(ContactForm $f_ap): string {
        return "Nuevo mensaje\nNombre: {$f_ap->nombre_ap}\nCorreo: {$f_ap->email_ap}\nAsunto: {$f_ap->asunto_ap}\nMensaje: {$f_ap->mensaje_ap}";
    }
}
```

### `src/php/helpers/Response.php`
```php
<?php
namespace App\Helpers;
class Response {
    public static function json(array $data_ap, int $code_ap=200): void {
        http_response_code($code_ap);
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        echo json_encode($data_ap);
    }
}
```

### `src/php/bootstrap/env.php`
```php
<?php
$env_ap = __DIR__.'/../.env';
if (file_exists($env_ap)) {
    foreach (file($env_ap, FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES) as $line_ap) {
        if (strpos($line_ap,'=') !== false) { [$k_ap,$v_ap] = explode('=', $line_ap, 2); putenv(trim($k_ap).'='.trim($v_ap)); }
    }
}
```

### `.env.example`
```
SMTP_HOST_ap=smtp.gmail.com
SMTP_PORT_ap=587
SMTP_SECURE_ap=tls
SMTP_USER_ap=tu_usuario
SMTP_PASS_ap=tu_password
FROM_EMAIL_ap=no-reply@novaciencia.academy
FROM_NAME_ap=NovaCiencia
TO_EMAIL_ap=contacto@novaciencia.academy
TO_NAME_ap=Contacto
```

### `index.html` (meta)
```html
<meta name="nc-contact-api" content="/src/php/public/index.php?route=contact/send" />
```

### `src/js/forms.js` (contacto)
```js
const contactoForm_ap = document.getElementById('contacto-form');
if (contactoForm_ap) {
  contactoForm_ap.addEventListener('submit', async (e) => {
    e.preventDefault();
    const api_ap = document.querySelector('meta[name="nc-contact-api"]').getAttribute('content') || '/src/php/public/index.php?route=contact/send';
    const body_ap = new URLSearchParams({
      nombre: document.getElementById('nombre-contacto').value.trim(),
      email: document.getElementById('email-contacto').value.trim(),
      asunto: document.getElementById('asunto').value.trim(),
      mensaje: document.getElementById('mensaje').value.trim()
    });
    const resp_ap = await fetch(api_ap, { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' }, body: body_ap });
    const json_ap = await resp_ap.json();
    if (!json_ap.ok) throw new Error(json_ap.error || 'No se pudo enviar');
    alert('¡Mensaje enviado con éxito!');
    contactoForm_ap.reset();
  });
}
```

## Instalación
- `cd src/php && composer require phpmailer/phpmailer`.
- Crear `src/php/.env` con las claves `_ap` (no subir). 
- Servir PHP en desarrollo: `php -S localhost:8001 -t src/php/public`.
- Ajustar meta `nc-contact-api` a `http://localhost:8001/index.php?route=contact/send` si se usa servidor separado.

## Notas
- PHPMailer mantiene sus clases sin sufijo; el sufijo `_ap` aplica a variables, claves y helpers propios.
- Respuestas JSON con CORS habilitado.

¿Confirmo y procedo a implementar?