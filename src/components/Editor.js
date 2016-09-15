const m = require('mithril')
const j2c = require('j2c')
const Editable = require('./Editable.js')
const styles = require('../utils/styles.js')
const css = require('./Editor.style.js')


module.exports = {

  oninit : ({ state, attrs : { facade } }) => {
    styles.add(css)
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
        let xhr = state.request
        let origRSC = xhr.onreadystatechange
        xhr.onreadystatechange = () => {
          origRSC()
          if (xhr.readyState === 4) {
            let headers = {}
            xhr.getAllResponseHeaders().split('\r\n').forEach(function(el) {
              if (el !== '') {
                header = el.split(':')
                headers[header[0]] = header[1].trim()
              }
            })
            facade.addHandler(xhr.method, state.path(), function() { return [xhr.status, headers, xhr.responseText] } , false)
          }
        }
        facade.addHandler(state.request.method, state.path(), facade.pretender.passthrough, false)
      } else if (responseType === 2) {
        facade.addHandler(state.request.method, state.path(), function() {
          return [state.jsonReply.code(), {}, state.jsonReply.body()]
        }, false)
      } else {
        eval(`var handler = ${ state.jsContent().replace(/\r?\n|\r/g, '') }`)
        facade.addHandler(state.request.method, state.path(), handler, false)
      }
    }
  },

  onremove : () => styles.remove(css),

  view : ({ state }) =>
    m(`.${ css.editor}`, [
      m('.row', [
        m('span.header', state.request.method ),
        m('input', { value: state.path(), oninput : m.withAttr('value', state.path) })
      ]),

      m('.row', [
        m('span', 'Action'),
        m('button', { onclick: () => state.responseType(0) }, 'Passthrough'),
        m('button', { onclick: () => state.responseType(1) }, 'Record'),
        m('button', { onclick: () => state.responseType(2) }, 'JSON'),
        m('button', { onclick: () => state.responseType(3) }, 'Custom')
      ]),

      m('.row', [
        // 0
        m('p', 'Allow request to pass through to server'),

        // 1
        m('p', 'Record response, allow request to pass through to server once and return the same response for subsequent requests'),

        // 2
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

        // 3
        m(Editable, { content : state.jsContent })
      ][state.responseType()]),

      m('row', m('button', { onclick : state.addHandler }, 'Done'))
    ])
}
