<?php
if (function_exists('gd_info')){
    $info = gd_info();
    echo '{"gd": "' . $info['GD Version'] . '"}';
} else {
    echo '{"gd": false}';
}
