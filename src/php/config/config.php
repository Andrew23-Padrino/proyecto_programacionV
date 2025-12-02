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
            'debug_ap' => getenv('SMTP_DEBUG_ap') ?: 0,
            'transport_ap' => getenv('MAIL_TRANSPORT_ap') ?: 'smtp',
            'log_file_ap' => getenv('MAIL_LOG_PATH_ap') ?: (dirname(__DIR__) . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'mail.log'),
            'from_email_ap' => getenv('FROM_EMAIL_ap') ?: 'no-reply@novaciencia.academy',
            'from_name_ap' => getenv('FROM_NAME_ap') ?: 'NovaCiencia',
            'to_email_ap' => getenv('TO_EMAIL_ap') ?: 'contacto@novaciencia.academy',
            'to_name_ap' => getenv('TO_NAME_ap') ?: 'Contacto'
        ];
    }
}
