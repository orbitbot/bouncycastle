const Facade = require('./facade.js')
const m = require('mithril')
const observableArray = require('./utils/observableArray.js')
const createMountPoint = require('./utils/createMountPoint.js')
const RequestList = require('./components/RequestList.js')

let facade = new Facade()

facade.pretender.unhandledRequests = observableArray();
facade.pretender.unhandledRequests.run((value) => {
  console.log(value)
})


let requestList = RequestList(facade.pretender.unhandledRequests)

createMountPoint('bouncycastle')
m.mount(document.getElementById('bouncycastle'), requestList)


window.facade = facade
window.m = m
