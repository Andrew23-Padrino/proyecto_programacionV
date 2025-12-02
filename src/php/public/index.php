<?php
require_once __DIR__.'/../vendor/autoload.php';
require_once __DIR__.'/../bootstrap/autoload.php';
require_once __DIR__.'/../bootstrap/env.php';
require_once __DIR__.'/../config/config.php';

use App\Controllers\ContactController;

$method_ap = $_SERVER['REQUEST_METHOD'];
$route_ap = isset($_GET['route']) ? $_GET['route'] : '';

// Handle CORS preflight
if ($method_ap === 'OPTIONS') {
    http_response_code(204);
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit;
}

if ($method_ap === 'POST' && $route_ap === 'contact/send') {
    (new ContactController())->send($_POST);
} else {
    http_response_code(404);
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    echo json_encode(['ok'=>false,'error'=>'Not found']);
}
