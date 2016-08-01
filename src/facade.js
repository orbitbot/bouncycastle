const Pretender = require('pretender');

const logHandler = (verb, path, request) => console.log.bind(`uncaught ${ verb } ${ path }:`, request)

class Facade {
  constructor({ handler = logHandler } = {}) {
    this.handler = handler
    this.enable()
  }

  enable() {
    this.pretender = new Pretender()
    this.pretender.unhandledRequest = this.handler
    this.unhandledRequests = this.pretender.unhandledRequests
  }

  disable() {
    this.pretender.shutdown()
    this.pretender = null
  }

  addHandler() {
    return this.pretender.register.apply(this.pretender, arguments);
  }

  handleRequest() {
    return this.pretender.handleRequest.apply(this.pretender, arguments)
  }
}

module.exports = Facade
