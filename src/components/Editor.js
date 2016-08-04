const m = require('mithril')
const Textarea = require('./Textarea.js')

module.exports = {

  oninit : ({ state, attrs : { facade } }) => {
    state.request = facade.prompt()
    state.responseType = m.prop('json')
    state.responseType.map(m.redraw)

    state.path = m.prop(state.request.url)
    state.jsContent = m.prop("function(request) {\n  return [200, {}, '{}']\n}")
    state.jsonReply = {
      code    : m.prop(200),
      headers : {},
      body    : m.prop('{\n  \n}')
    }

    state.getView = (type) => {
      return {
        json :  m('div', [
                  m('span', ['Response code', m('input', { value : state.jsonReply.code(), oninput : m.withAttr('value', state.jsonReply.code) })]),
                  m(Textarea, { content : state.jsonReply.body })
                ]),
        pass : m('p', 'Allow request to pass through to server'),
        js   : m(Textarea, { content : state.jsContent })
      }[type]
    }

    state.addHandler = () => {
      var responseType = state.responseType()

      if (responseType === 'pass') {
        facade.addHandler(state.request.method, state.path(), facade.pretender.passthrough, false)
      } else if (responseType === 'js') {
        eval(`var handler = ${ state.jsContent().replace(/\r?\n|\r/g, '') } `)
        facade.addHandler(state.request.method, state.path(), handler, false)
      } else {
        facade.addHandler(state.request.method, state.path(), function() {
          return [state.jsonReply.code(), {}, state.jsonReply.body()]
        }, false)
      }
    }
  },

  view : ({ state, attrs : { facade } }) =>
    [
      m('div', `Unhandled request: ${ state.request.method } ${ state.request.url }`),
      m('div', [
        m('button', { onclick: () => state.responseType('json') }, 'JSON'),
        m('button', { onclick: () => state.responseType('pass') }, 'Passthrough'),
        // m('button', { onclick: state.responseType('json') }, 'Record')
        m('button', { onclick: () => state.responseType('js') }, 'Custom')
      ]),
      m('div', [
        m('span', 'Path editor'),
        m('input', { value: state.path(), oninput : m.withAttr('value', state.path) })
      ]),

      state.getView(state.responseType()),

      m('button', { onclick : state.addHandler }, 'Done')
    ]
}
