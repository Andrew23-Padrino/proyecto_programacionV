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
        Response::json(['ok'=>true,'message'=>'Mensaje enviado','transport'=>$sent_ap['transport'] ?? 'smtp']);
    }
}
