const j2c = require('j2c')

let font_family = 'OpenSans, sans-serif'
let font_size = '14px'

let editable_background = {
  background: '#f4f4f4'
}

let border_radius = '2px'
let left_borders = {
  border_top_left_radius: border_radius,
  border_bottom_left_radius: border_radius,
}
let right_borders = {
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

let button = j2c.sheet([{
  text_transform: 'uppercase',
}, text])


module.exports = ({
  wrapper,
  button,
  editable_background,
  border_radius,
  left_borders,
  right_borders,
  text,
})
