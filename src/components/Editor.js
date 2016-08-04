const m = require('mithril')
const Textarea = require('./Textarea.js')

module.exports = {

  oninit : ({ state, attrs : { facade } }) => {
    state.request = facade.prompt()
    state.responseType = m.prop('json')
    state.responseType.map(m.redraw)

    state.jsContent = m.prop('function(request) {\n  return [200, {}, "{}"]\n}')
    state.jsonReply = {
      code    : m.prop(200),
      headers : {},
      body    : m.prop('{\n  \n}')
    }

    state.getView = (type) => {
      return {
        json :  m('div', [
                  m('span', ['Response code', m('input', { type: Number, value : state.jsonReply.code })]),
                  m(Textarea, { content : state.jsonReply.body })
                ]),
        pass : m('p', { style : '' }, 'Allow request to pass through to server'),
        js   : m(Textarea, { content : state.jsContent })
      }[type]
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
        m('input', { type: 'text', value: state.request.url })
      ]),

      state.getView(state.responseType()),

      m('button', { onclick : () => facade.prompt(undefined) }, 'Done')
    ]
}
