const j2c = require('j2c')

let font_family = 'OpenSans, sans-serif'
let font_size = '14px'

let editable_background = {
  background: '#f4f4f4'
}

let border_radius = '2px'
let left_corners = {
  border_top_left_radius: border_radius,
  border_bottom_left_radius: border_radius,
}
let right_corners = {
  border_top_right_radius: border_radius,
  border_bottom_right_radius: border_radius,
}

let text = {
  font_family,
  font_size
}

let wrapper = {
  max_width: '30em',
  margin: '0 auto 1em',
  background : '#fff',
  box_shadow: '0 11px 7px 0 rgba(0, 0, 0, 0.19)',
  padding: '0.8em',
  border_radius
}

let button = [{
  position: 'relative',
  display: 'block',
  // margin: 'auto 0.6em',
  padding: '0.4em',
  overflow: 'hidden',

  border_width: '0',
  outline: 'none',
  border_radius: border_radius,
  box_shadow: '0 1px 2px rgba(0, 0, 0, .2)',

// .btn:hover, .btn:focus {
//   background-color: #27ae60;
// }

// .btn > * {
//   position: relative;
// }

// .btn span {
//   display: block;
//   padding: 12px 24px;
// }

}, text]


module.exports = ({
  wrapper,
  button,
  editable_background,
  border_radius,
  left_corners,
  right_corners,
  text,
})
