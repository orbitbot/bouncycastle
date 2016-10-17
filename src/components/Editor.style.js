const j2c = require('j2c')
const common = require('./common.style.js')

module.exports = j2c.sheet({
  '.editor'  : [common.wrapper, common.text, {

    z_index: '99',
    position: 'fixed',
    width: '100%',
    top: '5em',
    left: '50%',
    transform: 'translateX(-50%)',

    ' .row' : {
      margin_bottom: '0.4em',
      display: 'flex'
    },

    ' .header' : {
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
      outline: 'none',
      border: 'none',
      flex: '1'
    }],

    ' button' : [common.button],

    ' .path' : [common.right_corners],

    ' .response_code_container' : {
      display : 'flex',
      align_items : 'baseline'
    },

    ' .response_code' : [common.left_corners, common.right_corners, {
      margin_left: '0.6em'
    }]
  }]
})
