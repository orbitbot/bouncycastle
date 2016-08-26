const Pretender = require('pretender')
const m = require('mithril')

const observableArray = require('./utils/observableArray.js')

class Facade {
  constructor() {
    let facade = this
    facade.enabled = m.prop(false)
    facade.unhandledRequests = observableArray()
    facade.prompt = m.prop()

    facade.enabled.map((enabled) => {
      if (enabled) {
        console.log('enable')
        facade.pretender = new Pretender()
        facade.pretender.unhandledRequest = (verb, path, request) => {
          console.log(`uncaught ${ verb } ${ path }:`, request)
          if (!facade.prompt()) {
            facade.prompt(request)
          } else {
            facade.unhandledRequests.push(request)
          }
        }

        facade.pretender.passthroughRequest = (verb, path, request) => {
          console.log(`passthrough ${ verb } ${ path }:`, request)
        }
      } else {
        console.log('disable')
        facade.unhandledRequests([])
        facade.prompt(undefined)
        if (facade.pretender) {
          facade.pretender.shutdown()
          facade.pretender = undefined
        }
      }
    })
  }

  enable() {
    this.enabled(true)
  }

  disable() {
    this.enabled(false)
  }

  addHandler() {
    let requestQueue = [this.prompt()].concat(this.unhandledRequests() || [])
    this.pretender.register.apply(this.pretender, arguments);
    this.unhandledRequests([])
    this.prompt(undefined)
    requestQueue.map((req) => {
      req.sendFlag = false
      req.send()
    })
  }

  handleRequest() {
    return this.pretender.handleRequest.apply(this.pretender, arguments)
  }
}

module.exports = Facade
