<?php
$img = $_SERVER['argv'][1];
$json = json_decode($_SERVER['argv'][2], true);

include 'smartsprite.php';
new SmartSprite($img, $json);
