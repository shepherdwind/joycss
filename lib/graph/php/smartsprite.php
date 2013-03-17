<?php

class SmartSprite
{
    protected $sprites = array();
    protected $verbose = TRUE;
    protected $_filename = '';
    protected $currentDir = '';
    protected $_maxColors = 0;
    protected $_trueColor;
    protected $log;

    function __construct($filename, $config){
        $this->_filename = $filename;

        $this->log = new stdclass();
        $this->log->info = array();
        $this->log->spriteImgs = array();
        $this->log->filename = $filename;

        $this->sprites = $config;
        $this->createSpriteImages();
    }

    function createSpriteImages() {

        foreach ($this->sprites as $spritekey => $spritevalue) {
            $_imagelocations = &$this->sprites[$spritekey]['images'];
            $filename = $this->sprites[$spritekey]['filename'];

            $DATAURL = $this->sprites[$spritekey]['dataurl'];

            $backgroundHEX = $this->sprites[$spritekey]['background'];

            if ($_imagelocations) {
                $w = $this->sprites[$spritekey]['width'];
                $h = $this->sprites[$spritekey]['height'];

                $fileEXT = substr($this->sprites[$spritekey]['filename'], -3);

                // $this->_trueColor &&  
                //$this->log->info[] = "using truecolor mode\n";
                if ( $fileEXT == 'png')  $image = imagecreatetruecolor($w, $h);
                if ( $fileEXT == 'gif')  $image = imagecreatetruecolor($w, $h);
                if ( $fileEXT == 'jpg')  $image =  imagecreatetruecolor($w, $h);

                // spriteBG color to RGB:
                $_colArr = sscanf($backgroundHEX, '%2x%2x%2x%2x');
                $BG_R = $_colArr[0];
                $BG_G = $_colArr[1];
                $BG_B = $_colArr[2];
                $BG_A = $_colArr[3];

                if ($fileEXT !='jpg') {
                    if (!empty( $BG_A) ) {
                        imagealphablending($image,false);
                        imagesavealpha($image,true);
                        $transparent = imagecolorallocatealpha($image,$BG_R, $BG_G, $BG_B, $BG_A);
                        $this->log->info[] = $transparent;
                        imagecolortransparent($image,$transparent);
                    } else {
                        $transparent = imagecolorallocate($image,$BG_R, $BG_G, $BG_B);
                    }

                    imagefilledrectangle($image, 0, 0, $w, $h, $transparent);
                } else {
                    //$transparent = imagecolorallocate($image,255, 255, 255);	// white
                    $transparent = imagecolorallocate($image,$BG_R, $BG_G, $BG_B);
                    imagefilledrectangle($image, 0, 0, $w, $h, $transparent);
                }

                foreach ($_imagelocations as $_image => $imagevalue) {
                    $subimg = $this->loadImageFromFile($imagevalue);

                    switch ($imagevalue['align']) {
                    case 'left': $imagevalue['spritepos_left']=0;
                    break;
                    case 'right': $imagevalue['spritepos_left']=$w-$imagevalue['width'];//$w-3; //-$imgleft = $imagevalue['width'];
                    break;
                    case 'center': $imagevalue['spritepos_left']=( $w-$imagevalue['width'] ) / 2;//$w-3; //-$imgleft = $imagevalue['width'];
                    break;
                    }

                    // stretching to full width:
                    switch ($imagevalue['repeat']) {
                    case 'repeat-x':
                        // changed 10/06/2010 by tanila
                        // image resample was a stretch
                        // added repeat to support iregular repeat-x
                        $nWidth = 0;
                        while($nWidth <= $w) {
                            imagecopyresampled($image, $subimg,
                                $imagevalue['spritepos_left'] + $nWidth,
                                $imagevalue['spritepos_top'],
                                0,
                                0,
                                $imagevalue['width'],
                                $imagevalue['height'],
                                $imagevalue['width'],
                                $imagevalue['height']);
                            $nWidth += $imagevalue['width'];
                        } 
                        break;
                    case 'repeat-y':
                        $nHeight = 0;
                        while($nHeight <= $h) {
                            imagecopyresampled($image,$subimg,
                                $imagevalue['spritepos_left'],
                                $imagevalue['spritepos_top'] + $nHeight,
                                0,0,
                                $imagevalue['width'],
                                $imagevalue['height'],
                                $imagevalue['width'],
                                $imagevalue['height']);
                            $nHeight += $imagevalue['height'];
                        }
                        break;
                    default:
                        imagecopy($image,$subimg,$imagevalue['spritepos_left'],$imagevalue['spritepos_top'],0,0,$imagevalue['width'],$imagevalue['height']);
                    }
                }	// image loop

                $this->log->info[] = '[sprite info]' .count($_imagelocations) . " images will merge to one image " 
                    . basename($this->sprites[$spritekey]['filename']) . "[{$w}x{$h}]\n";
                $this->safeImageToFile($image, $this->sprites[$spritekey]['imagetype'], 
                    $this->sprites[$spritekey]['filename'], $spritekey, $DATAURL ); 
            }	// if images exists
        }	// Sprite loop

        $this->log->info[] = '[sprites success] end';
        echo json_encode($this->log);
    }
    function safeImageToFile($imgres, $imgtype, $filename, $spritekey, $dataurl) {
        $filename = dirname($this->_filename).'/'.$filename;
        //if ($this->verbose)
        //$this->log->info[] = "[sprite create end]Writing image: " .basename($filename)."  colors: $this->_maxColors  \n";

        $_result = 0;
        switch ($imgtype) {
        case 1 :
            $_result = @imagegif($imgres, $filename);
            $_mime = 'image/gif';
            break;
        case 2 :
            $_result = @imagejpeg($imgres, $filename);
            $_mime = 'image/jpeg';
            break;
        case 3 :
            $_result = @imagepng($imgres, $filename);
            $_mime = 'image/png';
            break;
        default:
            $_result = @imagegif($imgres, $filename);
            $_mime = 'image/gif';
        }
        ImageDestroy($imgres);

        if (!$_result) die("ERROR: Can not write smartsprite file to: $filename\n");

        $this->log->spriteImgs[] = $filename;
        $_optIMG = $filename;	
        // dirname($this->_filename).'/'.

        //$dataurl 
        //? $this->getImageDataURL($_optIMG, $_mime, $spritekey) 
        //: $this->getImageJointBG($_optIMG, $spritekey);//'';
    }

    function loadImageFromFile($imageInfo) {
        $_result = 0;
        $filelocation = $imageInfo['file_location'];
        $filelocation = dirname($this->_filename).'/'.$filelocation;

        switch ($imageInfo['type']) {
        case 1 : $_result = @imagecreatefromgif($filelocation);
        break;
        case 2 : $_result = @imagecreatefromjpeg($filelocation);
        break;
        case 3 : $_result = @imagecreatefrompng($filelocation);
        break;
        case 4 : $_result = @imagecreatefromswf($filelocation);
        break;
        case 6 : $_result = @imagecreatefromwbmp($filelocation);
        break;
        case 15 : $_result = @imagecreatefromxbm($filelocation);
        break;
        }

        $_colorCount = ImageColorsTotal($_result);
        //$this->log->info[] = 'testing image: '. basename($filelocation) . ' colors: '.$_colorCount . 
            //" size:[{$imageInfo['width']}x{$imageInfo['height']}]\n";

        if (  $this->_maxColors < $_colorCount ) $this->_maxColors = $_colorCount;
        if ($_colorCount  == 0) $this->_trueColor = true;
        if (! $_result) die("ERROR: Can not open file: $filelocation\n");

        return $_result;
    }


    // creates a joint css-rule for all matching css-rules with 
    // dataURL_background-sprite and a hack of IE:
    function getImageDataURL($file, $_mime, $spritekey) {
        // todo spriterefname = spriteimg name
        // only set file extension in sprite def
        //$_fileExt = end(explode(".", basename($file) ));
        //$_fileNoExt = str_replace('.'.$_fileExt,'',basename( $file ) );
        $_data = $this->getBase64EncodedImgString($file);
        $_selectors = $this->sprites[$spritekey]['cssselectors'];
        $_IEHack = "\n".'*background: url("'.basename( $file ).'") no-repeat;'."\n";
        return $_selectors.'{background: url("data:'.$_mime.';base64,'.$_data .'") no-repeat; '.$_IEHack.'}' ;
    }
    // creates a joint css-rule for all matching css-rules with the same
    // background-sprite
    function getImageJointBG($file, $spritekey) {
        //$_fileExt = end(explode(".", basename($file) ));
        //$_fileNoExt = str_replace('.'.$_fileExt,'', basename($file) );
        $_selectors = $this->sprites[$spritekey]['cssselectors'];
        return $_selectors.' {background: url("'.$file.'") no-repeat;}' ;
    }

    function getBase64EncodedImgString($file) {
        $contents = file_get_contents($file);
        return base64_encode($contents);
    }

}
