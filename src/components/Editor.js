const m = require('mithril')
const h = require('../utils/mithrilWrapper.js')
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
    h('.editor', [
      h('.row', [
        h('span.header', state.request.method ),
        h('input.path', { value: state.path(), oninput : m.withAttr('value', state.path) })
      ]),

      h('.row', [
        h('span', 'Action'),
        h('button', { onclick: () => state.responseType(0) }, 'Passthrough'),
        h('button', { onclick: () => state.responseType(1) }, 'Record'),
        h('button', { onclick: () => state.responseType(2) }, 'JSON'),
        h('button', { onclick: () => state.responseType(3) }, 'Custom')
      ]),

      h('div', [
        // 0
        h('p', 'Allow request to pass through to server'),

        // 1
        h('p', 'Record response, allow request to pass through to server once and return the same response for subsequent requests'),

        // 2
        h('div', [
          h('div.response_code_container', [
            h('span', 'Response code'),
            h('input.response_code', { value : state.jsonReply.code(), oninput : m.withAttr('value', state.jsonReply.code) })
          ]),
          h('div', [
            'Headers',
            h(Editable, { content : state.jsonReply.headers })
          ]),
          h('div', [
            'Body',
            h(Editable, { content : state.jsonReply.body })
          ])
        ]),

        // 3
        h(Editable, { content : state.jsContent })
      ][state.responseType()]),

      h('row', h('button', { onclick : state.addHandler }, 'Done'))
    ])
}
