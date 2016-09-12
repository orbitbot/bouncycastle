const m = require('mithril')
const j2c = require('j2c')
const Editable = require('./Editable.js')
const common = require('./common.style.js')

let req = {
  row : j2c.inline({
    margin_bottom: '0.4em',
    display: 'flex'
  }),
  method : j2c.inline([{
    display: 'inline-block',
    background: 'powderblue',
    border_top_left_radius: '2px',
    border_bottom_left_radius: '2px',
    padding: '0.6em',
    text_transform: 'uppercase',
    font_weight: 600,
  }, common.text]),
  url : j2c.inline([{
    background: '#f4f4f4',
    padding: '0.6em',
    box_sizing: 'border-box',
    outline: 'none',
    border: 'none',
    border_top_right_radius: '2px',
    border_bottom_right_radius: '2px',
    flex: '1'
  }, common.text])
}

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

  view : ({ state }) =>
    m('div', { style: common.wrapper }, [
      m('div', { style: req.row }, [
        m('span', { style: req.method }, state.request.method ),
        m('input', { value: state.path(), oninput : m.withAttr('value', state.path), style: req.url })
      ]),

      m('div', { style: req.row}, [
        m('span', 'Action'),
        m('button', { onclick: () => state.responseType(0) }, 'Passthrough'),
        m('button', { onclick: () => state.responseType(1) }, 'Record'),
        m('button', { onclick: () => state.responseType(2) }, 'JSON'),
        m('button', { onclick: () => state.responseType(3) }, 'Custom')
      ]),

      m('div', [
        // 0
        m('p', { style: common.text }, 'Allow request to pass through to server'),

        // 1
        m('p', { style: common.text }, 'Record response, allow request to pass through to server once and return the same response for subsequent requests'),

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

      m('button', { onclick : state.addHandler }, 'Done')
    ])
}
