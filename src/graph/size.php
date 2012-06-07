<?php

//$files = array('1', '2', '3');
$files = array_slice($_SERVER['argv'], 1);

$ret = array();

foreach ($files as $file)
{
    $size = getimagesize($file);

    //success
    if ($size)
    {
        $ret[$file] = array(
            'width' => $size[0],
            'height' => $size[1], 
            'type' => $size[2]
        );
    }
    else
    {
        $ret[$file] = false;
    }
}

echo json_encode($ret);
