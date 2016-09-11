const Facade = require('./facade.js')
const m = require('mithril')
const createMountPoint = require('./utils/createMountPoint.js')

let facade = new Facade()
facade.unhandledRequests.map(m.redraw)
facade.prompt.map(m.redraw)

let Widget = require('./components/Widget.js')

createMountPoint('bouncycastle')
m.mount(document.getElementById('bouncycastle'), Widget(facade))

window.facade = facade
window.m = m
