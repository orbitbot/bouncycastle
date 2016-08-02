const m = require('mithril')

const observableArray = require('../utils/observableArray.js')
const UnorderedList = require('./UnorderedList.js')

module.exports = (facade) => {
  let requestList

  return {
    oninit : () => {
      facade.enable()
      facade.pretender.unhandledRequests = observableArray();
      facade.pretender.unhandledRequests.run(console.log.bind(console))
      requestList = UnorderedList(facade.pretender.unhandledRequests, (req) => m('li', req.url))
    },
    onremove : () => {
      facade.disable()
    },
    view : () => {
      return m(requestList)
    }
  }
}
