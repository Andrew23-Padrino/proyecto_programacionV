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

