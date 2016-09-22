const m = require('mithril')
const h = require('../utils/mithrilWrapper.js')
const Editor = require('./Editor.js')
const styles = require('../utils/styles.js')
const css = require('./Widget.style.js')

module.exports = (facade) => ({
  oninit : () => styles.add(css),
  onremove : () =>  styles.remove(css),

  view : () =>
    h('.widget', [
      h('button', { onclick: () => { facade.enabled( !facade.enabled()) } }, facade.enabled() ? 'disable' : 'enable'),
      facade.enabled()
        ? h('div', [
            facade.unhandledRequests().length
              ? h('ul', facade.unhandledRequests().map((req) => { return h('li', `${ req.method } ${ req.url }`) }))
              : null,
            facade.prompt()
              ? h(Editor, { facade: facade })
              : null
          ])
        : null
    ])
})
