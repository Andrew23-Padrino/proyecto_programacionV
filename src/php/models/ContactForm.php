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

