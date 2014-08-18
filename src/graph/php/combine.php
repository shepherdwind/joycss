<?php
$dir = $_SERVER['argv'][1];
$json = json_decode($_SERVER['argv'][2], true);

include 'smartsprite.php';
new SmartSprite($dir, $json);
//new SmartSprite('/Users/eward/cats/css/index.css', 'a.json');
