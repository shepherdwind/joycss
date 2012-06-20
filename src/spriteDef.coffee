"use strict"
path      = require 'path'
cssReader = require './cssReader'
StdClass  = require '../lib/stdclass'
Api       = require './graph/api'
some      = (require '../lib/utils').some
forEach   = (require '../lib/utils').forEach
util      = require 'util'
fs        = require 'fs'
Box       = require '../lib/box'

conf =
  "background" : "ffffff7f",
  "colorcount" : "256",
  "dataurl"    : false,
  "filename"   : "../img/mysprite.png",
  "width"      : 0,
  "height"     : 0,
  "force8bit"  : true,
  "imagetype"  : 3,
  "layout"     : "vertical",
  "margin"     : 0,
  "images"     : {}

imageUrlReg = /url\(['"]*([a-z0-9A-Z_\-.\/\\]+)['"]*\)/

class SpriteDef
  constructor: ->
    StdClass.apply @, arguments

StdClass.extend SpriteDef, StdClass,

  attributes:
    file: ''

  CONSIT: {}

  _init: ->
    file = @get 'file'
    throw new Error 'file not defined' if file is ''

    @cssReader = new cssReader file: file

    @sprites = mysprite: conf

    ###
    所有含有background的css集合，{id: url}，id指css集合id，url是图片路径
    ####
    @images = {}

    @imagesDef = {}

    @cssReult = ''

    do @_bind
    return

  _bind: ->
    @cssReader.on (@cssReader.get 'RULE_END_EVT'), @getRule, @
    @cssReader.on 'change:timeEnd', @cssEnd, @
    return

  getRule: (e)->
    property = e.property
    imageIndex = property.indexOf 'background'

    @collectImages e, imageIndex if imageIndex > -1

  writeRule: (rule)->
    selector = rule.selector.join ",\n"
    @cssReult += "#{selector} {\n"
    for p, i in rule.property
      @cssReult += "  #{p}: #{rule.value[i]};\n"
    return

  collectImages: (css, imageIndex)->
    urlVal = css.value[imageIndex]
    image  = @_isSpriteImage urlVal

    @images[css.id] = image if image

  _isSpriteImage: (val)->

    isHttpUrl = (val.indexOf '//') > -1
    ret = false

    if not isHttpUrl
      url = imageUrlReg.exec val
      ret = url[1] if url

    ret

  cssEnd: ->
    baseDir = path.dirname @.get 'file'
    files   = {}

    forEach @images, (file)->
      #去除重复
      files[path.resolve baseDir, file] = 1

    files = Object.keys files
    Api.getImagesSize files, @setDef, @

  setDef: (err, data)->
    throw new Error do data.toString if err
    baseDir = path.dirname @get 'file'

    for file, def of JSON.parse data
      filePath = path.relative baseDir, file
      @imagesDef[filePath] = def

    do @setPos

  setPos: ->
    imagesDef = @imagesDef
    imgs = (Object.keys imagesDef).sort (img1, img2)->
      imagesDef[img2].width - imagesDef[img1].width

    sprites = @sprites['mysprite']
    images  = sprites.images
    height  = 0
    sprites['width'] = imagesDef[imgs[0]].width

    forEach imgs, (img)=>
      css = @getCss img
      images[img] = imagesDef[img]
      box = new Box css.property, css.value
      background = box.background
      images[img]['repeat'] = background.repeat
      images[img]['align'] = if background.position then background.position.x else 'left'
      images[img]['spritepos_left'] = 0
      images[img]['spritepos_top'] = height
      images[img]['file_location'] = img
      height += parseInt images[img].height, 10

    sprites['height'] = height

    do @createSprite

  createSprite: ->
    cfg = JSON.stringify @sprites
    Api.mergeImages [@get('file'), cfg], @writeCssBack, @

  writeCssBack: (err, data)->

    file = @get 'file'
    spriteFile = file.replace '.css', '.sprite.css'
    len = do @cssReader.getLen
    indexs = Object.keys @images
    index = do indexs.shift
    multSelector = []
    i = 0

    while i < len
      rule = @cssReader.getRule i

      if index isnt i
        @writeRule rule
      else
        img = this.images[index]
        multSelector = multSelector.concat rule.selector
        this.writeSpriteRule rule, @imagesDef[img]
        index = do indexs.shift
      i++


    @writeRule
      'selector': multSelector,
      'property': ['background-image', 'background-repeat'],
      'value': ["url(#{@sprites['mysprite']['filename']})", 'no-repeat']

    fs.writeFile spriteFile, @cssReult, (err, data)->
      console.log err
      console.log data
    return

  writeSpriteRule: (rule, def)->
    repeat = def['repeat']
    position = [def['spritepos_left'], def['spritepos_left']]
    backgroudProp = ['background', 'background-position',
      'background-repeat', 'background-image']

    self.cssReult += rule.selector.join ', ' + " {\n"
    for prop, i of rule.property
      if backgroudProp.indexOf prop isnt -1
        self.cssReult += "  #{prop}: #{rule.value[i]} ;\n"

    self.cssReult += "  background-repeat: #{repeat};\n"
    self.cssReult += "  background-position: #{position.join ', '};\n"
    self.cssReult += "}\n"

  getCss: (img)->
    imgId = null
    some @images, (imgPath, id) ->
      if imgPath is img
        imgId = id
        return true

    @cssReader.getRule imgId

module.exports = SpriteDef
