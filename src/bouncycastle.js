const Facade = require('./facade.js')
const m = require('mithril')
const createMountPoint = require('./utils/createMountPoint.js')
const Editor = require('./components/Editor.js')

let facade = new Facade()
facade.unhandledRequests.map(m.redraw)
facade.prompt.map(m.redraw)


let Widget = {
  view : () => {
    return m('div', [
      facade.enabled()
        ? [
            m('button', { onclick: () => { facade.enabled(false) } }, 'disable'),
            m('ul', facade.unhandledRequests().map((req) => { return m('li', `${ req.method } ${ req.url }`) })),
            facade.prompt() ? m(Editor, { facade: facade }) : null
          ]
        : m('button', { onclick: () => { facade.enabled(true) } }, 'enable' )
    ])
  }
}

createMountPoint('bouncycastle')
m.mount(document.getElementById('bouncycastle'), Widget)

window.facade = facade
window.m = m
