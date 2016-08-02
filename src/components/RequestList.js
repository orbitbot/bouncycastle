const m = require('mithril')

const listItem = (req) => {
  return m('li', req.url)
}

module.exports = (stream) => {
  console.log(stream())
  return {
    oninit : ({ state }) => {
      state.source = stream.map(x => x)
      stream.map(m.redraw)
    },
    view : ({ state }) => {
      return m('p', ['unhandledRequests',
        m('ul', state.source().map(listItem))
      ])
    }
  }
}
