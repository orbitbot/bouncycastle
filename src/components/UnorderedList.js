const m = require('mithril')

module.exports = (stream, transform) => {
  return {
    oninit : ({ state }) => {
      state.source = stream.map(x => x)
      stream.map(m.redraw)
    },
    view : ({ state }) => {
      return m('ul', state.source().map(transform))
    }
  }
}
