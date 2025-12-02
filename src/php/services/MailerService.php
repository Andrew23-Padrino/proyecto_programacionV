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
            $mail_ap->Subject = $form_ap->asunto_ap;
            $mail_ap->isHTML(true);
            $mail_ap->Body = $this->renderContactBody_ap($form_ap, $mail_ap);
            $mail_ap->AltBody = $this->renderContactAlt_ap($form_ap);

            $transport_ap = $smtp_ap['transport_ap'] ?? 'smtp';
            if ($transport_ap === 'log') {
                try {
                    $mail_ap->setFrom($smtp_ap['from_email_ap'], $smtp_ap['from_name_ap']);
                    $mail_ap->addAddress($smtp_ap['to_email_ap'], $smtp_ap['to_name_ap_ap'] ?? $smtp_ap['to_name_ap']);
                    if (method_exists($mail_ap, 'preSend')) {
                        $mail_ap->preSend();
                        $mime_ap = method_exists($mail_ap, 'getSentMIMEMessage') ? $mail_ap->getSentMIMEMessage() : ($mail_ap->Body ?? '');
                    } else {
                        $mime_ap = $mail_ap->Body ?? '';
                    }
                    $logFile_ap = $smtp_ap['log_file_ap'] ?? (dirname(__DIR__) . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'mail.log');
                    $dir_ap = dirname($logFile_ap);
                    if (!is_dir($dir_ap)) { @mkdir($dir_ap, 0775, true); }
                    $entry_ap = "==== CONTACTO " . date('Y-m-d H:i:s') . " ====\n" . $mime_ap . "\n\n";
                    file_put_contents($logFile_ap, $entry_ap, FILE_APPEND);
                    return ['ok'=>true, 'transport'=>'log'];
                } catch (\Throwable $logErr_ap) {
                    return ['ok'=>false, 'error'=> 'log_transport_failed: ' . $logErr_ap->getMessage()];
                }
            }

            $mail_ap->isSMTP();
            $mail_ap->SMTPAuth = true;
            $mail_ap->SMTPDebug = (int)$smtp_ap['debug_ap'];
            $debugBuf_ap = [];
            if ($mail_ap->SMTPDebug > 0) {
                $mail_ap->Debugoutput = function ($str_ap, $level_ap) use (&$debugBuf_ap) { $debugBuf_ap[] = trim(is_string($str_ap) ? $str_ap : strval($str_ap)); };
            }
            $mail_ap->Host = $smtp_ap['host_ap'];
            $mail_ap->Port = (int)$smtp_ap['port_ap'];
            $mail_ap->SMTPSecure = $smtp_ap['secure_ap'];
            $mail_ap->Username = $smtp_ap['user_ap'];
            $mail_ap->Password = $smtp_ap['pass_ap'];
            $mail_ap->setFrom($smtp_ap['from_email_ap'], $smtp_ap['from_name_ap']);
            $mail_ap->addAddress($smtp_ap['to_email_ap'], $smtp_ap['to_name_ap']);
            try {
                $mail_ap->send();
                return ['ok'=>true, 'debug'=>$debugBuf_ap, 'transport'=>'smtp'];
            } catch (\Throwable $primary_ap) {
                $altSecure = strtolower($smtp_ap['secure_ap']) === 'tls' ? 'ssl' : 'tls';
                $altPort = $altSecure === 'ssl' ? 465 : 587;
                $mail_ap->SMTPSecure = $altSecure;
                $mail_ap->Port = $altPort;
                try {
                    $mail_ap->send();
                    return ['ok'=>true, 'debug'=>$debugBuf_ap, 'transport'=>'smtp'];
                } catch (\Throwable $secondary_ap) {
                    $err_ap = $mail_ap->ErrorInfo ?: $secondary_ap->getMessage();
                    return ['ok'=>false,'error'=>$err_ap, 'debug'=>$debugBuf_ap, 'transport'=>'smtp'];
                }
            }
        } catch (\Throwable $ex_ap) {
            $err_ap = $mail_ap->ErrorInfo ?: $ex_ap->getMessage();
            return ['ok'=>false,'error'=>$err_ap];
        }
    }

    private function renderContactBody_ap(ContactForm $f_ap, PHPMailer $mail_ap): string {
        $logoPath_ap = dirname(__DIR__) . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'img' . DIRECTORY_SEPARATOR . 'NovaCiencia' . DIRECTORY_SEPARATOR . 'Logo.png';
        if (file_exists($logoPath_ap)) {
            $mail_ap->addEmbeddedImage($logoPath_ap, 'logo_novaciencia');
        }

        $n_ap = htmlspecialchars($f_ap->nombre_ap, ENT_QUOTES, 'UTF-8');
        $e_ap = htmlspecialchars($f_ap->email_ap, ENT_QUOTES, 'UTF-8');
        $a_ap = htmlspecialchars($f_ap->asunto_ap, ENT_QUOTES, 'UTF-8');
        $m_ap = nl2br(htmlspecialchars($f_ap->mensaje_ap, ENT_QUOTES, 'UTF-8'));

        $brandColor_ap = 'rgba(37, 150, 190)';

        $body_ap = <<<HTML
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    <div style="background-color: {$brandColor_ap}; color: white; padding: 20px; text-align: center;">
        <img src="cid:logo_novaciencia" alt="NovaCiencia Logo" style="max-width: 150px; margin-bottom: 10px;">
        <h1 style="margin: 0; font-size: 24px;">Nuevo Mensaje de Contacto</h1>
    </div>
    <div style="padding: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold; width: 100px;">Nombre:</td>
                <td style="padding: 10px 0;">{$n_ap}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Correo:</td>
                <td style="padding: 10px 0;"><a href="mailto:{$e_ap}" style="color: {$brandColor_ap}; text-decoration: none;">{$e_ap}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Asunto:</td>
                <td style="padding: 10px 0;">{$a_ap}</td>
            </tr>
            <tr>
                <td style="padding: 10px 0; font-weight: bold; vertical-align: top;">Mensaje:</td>
                <td style="padding: 10px 0;">{$m_ap}</td>
            </tr>
        </table>
    </div>
    <div style="background-color: #f8f8f8; color: #777; padding: 15px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">Mensaje enviado desde el formulario de contacto de novaciencia.academy</p>
    </div>
</div>
HTML;
        return $body_ap;
    }

    private function renderContactAlt_ap(ContactForm $f_ap): string {
        return "Nuevo mensaje\nNombre: {$f_ap->nombre_ap}\nCorreo: {$f_ap->email_ap}\nAsunto: {$f_ap->asunto_ap}\nMensaje: {$f_ap->mensaje_ap}";
    }
}
