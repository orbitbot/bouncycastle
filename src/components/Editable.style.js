const j2c = require('j2c')

module.exports = j2c.sheet({
  '.editable' : {
    background: '#f4f4f4',
    width: '100%',
    padding: '1em',
    margin: '.5em 0',
    overflow: 'auto',
    border_radius: '0.3em',

    ' code': {
      outline: 'none',
      display: 'block',
      background: 'none',
      text_align: 'left',
      white_space: 'pre',
      word_spacing: 'normal',
      word_break: 'normal',
      word_wrap: 'normal',
      line_height: '1.5'
    }
  }
})
