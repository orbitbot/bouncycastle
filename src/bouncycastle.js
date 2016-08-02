const Facade = require('./facade.js')
const m = require('mithril')
const observableArray = require('./utils/observableArray.js')
const createMountPoint = require('./utils/createMountPoint.js')

let facade = new Facade()

facade.pretender.unhandledRequests = observableArray();
facade.pretender.unhandledRequests.run((value) => {
  console.log(value)
})

window.facade = facade
window.m = m

const listItem = (req) => {
  return m('li', req.url)
}

let RequestList = {
  oninit : ({ state }) => {
    facade.pretender.unhandledRequests.run((requests) => {
      console.log('setting requests')
      state.requests = requests
      m.redraw()
    })
  },
  view : ({ state }) => {
    console.log(state.requests)
    return m('p', ['unhandledRequests',
        m('ul', state.requests.map(listItem))
    ])
  }
}

createMountPoint('bouncycastle')
m.mount(document.getElementById('bouncycastle'), RequestList)
