Property = require './Property'
forEach = (require './utils').forEach

class Box
  constructor: (property, value)->

    @property = property
    @value = value

    @width = 0
    @height = 0
    @hasWidth = off
    @hasHeight = off

    @background = {}
    @EM = 0
    @setEM

    property.forEach @getProp, @

    @width = 0 if @hasWidth isnt on
    @height = 0 if @hasHeight isnt on

  setEM: ->
    lineH = @property.indexOf 'line-height'

    if lineH  > -1
      property = new Property 'line-height', @value.lineH

      if property.attributes.utils is 'px'
        @hasHeight = on
        @EM = property.attributes.value

  replaceEM: (val)->
    EM = @EM
    return if EM is 0

    tmp = val.split ' '
    ret = []

    tmp.forEach (v)->
      if /(\d+)em/.test v
        num = parseFloat v, 10 * EM
        ret.push '' + num + 'px'
      else
        ret.push v

    ret.join ' '

  getProp: (prop, i) ->

    return if prop is 'line-height'

    val = @replaceEM @value.i
    property = new Property prop, val
    attr = property.attributes

    switch prop

      when 'width'
        @width += attr.value
        @hasWidth = on

      when 'padding-left', 'padding-right' then @width += attr.value

      when 'padding'
        @width += attr.padding[2] + attr.padding[3]
        @height += attr.padding[0] + attr.padding[2]

      when 'padding-bottom', 'padding-top' then @height += attr.value

      when 'height'
        @hasHeight = true
        @height += if attr.value > @EM then attr.value else @EM

      when 'background' then @background = attr
      when 'background-repeat' then @background.repeat = attr.value
      when 'background-position' then @background.position = attr.position

module.exports = Box
