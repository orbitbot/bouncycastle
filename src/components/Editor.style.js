const j2c = require('j2c')
const common = require('./common.style.js')

module.exports = j2c.sheet({
  '.editor'  : [common.wrapper, common.text, {

    ' > .row' : {
      margin_bottom: '0.4em',
      display: 'flex'
    },

    ' > .header' : {
      display: 'inline-block',
      background: 'powderblue',
      border_top_left_radius: '2px',
      border_bottom_left_radius: '2px',
      padding: '0.6em',
      text_transform: 'uppercase',
      font_weight: 600,
    },

    ' input' : [common.text, {
      background: '#f4f4f4',
      padding: '0.6em',
      box_sizing: 'border-box',
      outline: 'none',
      border: 'none',
      border_top_right_radius: '2px',
      border_bottom_right_radius: '2px',
      flex: '1'
    }]
  }]
})
