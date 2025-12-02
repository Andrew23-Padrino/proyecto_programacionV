<?php
$env_ap = __DIR__.'/../.env';
if (file_exists($env_ap)) {
    foreach (file($env_ap, FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES) as $line_ap) {
        if (strpos($line_ap,'=') !== false) {
            [$k_ap,$v_ap] = explode('=', $line_ap, 2);
            putenv(trim($k_ap).'='.trim($v_ap));
        }
    }
}

