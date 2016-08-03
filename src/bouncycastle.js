const Facade = require('./facade.js')
const m = require('mithril')
const createMountPoint = require('./utils/createMountPoint.js')

let facade = new Facade()
facade.unhandledRequests.map(m.redraw)

let Widget = {
  view : () => {
    return m('div', [
      facade.enabled()
        ? [
            m('button', { onclick: () => { facade.enabled(false) } }, 'disable'),
            m('ul', facade.unhandledRequests().map((req) => { return m('li', req.url) }))
          ]
        : m('button', { onclick: () => { facade.enabled(true) } }, 'enable' )
    ])
  }
}

createMountPoint('bouncycastle')
m.mount(document.getElementById('bouncycastle'), Widget)

window.facade = facade
window.m = m
