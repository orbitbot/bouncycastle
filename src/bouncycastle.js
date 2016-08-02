const Facade = require('./facade.js')
const m = require('mithril')
const createMountPoint = require('./utils/createMountPoint.js')
const Wrapper = require('./components/Wrapper.js')

let facade = new Facade()
let wrapper = Wrapper(facade)
let enabled = m.prop(true)

let Widget = {
  view : () => {
    return m('div', [
      m('button', { onclick : () => { enabled(!enabled()) } }, enabled() ? 'disable' : 'enable' ),
      enabled() ? m(wrapper) : null
    ])
  }
}

createMountPoint('bouncycastle')
m.mount(document.getElementById('bouncycastle'), Widget)

window.facade = facade
window.m = m
