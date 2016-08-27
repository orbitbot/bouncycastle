const m = require('mithril')
const Editable = require('./Editable.js')

module.exports = {

  oninit : ({ state, attrs : { facade } }) => {
    state.request = facade.prompt()
    state.responseType = m.prop(0)
    state.responseType.map(m.redraw)

    state.path = m.prop(state.request.url)
    state.jsContent = m.prop("function(request) {\n  return [200, {}, '{}']\n}")
    state.jsonReply = {
      code    : m.prop(200),
      headers : m.prop('{}'),
      body    : m.prop('{\n  \n}')
    }

    state.addHandler = () => {
      var responseType = state.responseType()

      if (responseType === 0) {
        facade.addHandler(state.request.method, state.path(), facade.pretender.passthrough, false)
      } else if (responseType === 1) {
        facade.addHandler(state.request.method, state.path(), function() {
          return [state.jsonReply.code(), {}, state.jsonReply.body()]
        }, false)
      } else {
        eval(`var handler = ${ state.jsContent().replace(/\r?\n|\r/g, '') }`)
        facade.addHandler(state.request.method, state.path(), handler, false)
      }
    }
  },

  view : ({ state, attrs : { facade } }) =>
    [
      m('div', `Unhandled request: ${ state.request.method } ${ state.request.url }`),
      m('div', [
        m('button', { onclick: () => state.responseType(0) }, 'Passthrough'),
        m('button', { onclick: () => state.responseType(1) }, 'JSON'),
        // m('button', { onclick: state.responseType('json') }, 'Record')
        m('button', { onclick: () => state.responseType(2) }, 'Custom')
      ]),
      m('div', [
        m('span', 'Path editor'),
        m('input', { value: state.path(), oninput : m.withAttr('value', state.path) })
      ]),

      m('div', [
        m('p', 'Allow request to pass through to server'),

        m('div', [
          m('div', [
            'Response code',
            m('input', { value : state.jsonReply.code(), oninput : m.withAttr('value', state.jsonReply.code) })
          ]),
          m('div', [
            'Headers',
            m(Editable, { content : state.jsonReply.headers })
          ]),
          m('div', [
            'Body',
            m(Editable, { content : state.jsonReply.body })
          ])
        ]),

        m(Editable, { content : state.jsContent })
      ][state.responseType()]),

      m('button', { onclick : state.addHandler }, 'Done')
    ]
}
