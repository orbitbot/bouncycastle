const m = require('mithril')
const Editor = require('./Editor.js')
const styles = require('../utils/styles.js')
const css = require('./Widget.style.js')

module.exports = (facade) => ({
  oninit : () => styles.add(css),
  onremove : () =>  styles.remove(css),

  view : () => m(`.${ css.widget }`, [
      m('button', { onclick: () => { facade.enabled( !facade.enabled()) } }, facade.enabled() ? 'disable' : 'enable'),
      facade.enabled()
        ? m('div', [
            facade.unhandledRequests().length
              ? m('ul', facade.unhandledRequests().map((req) => { return m('li', `${ req.method } ${ req.url }`) }))
              : null,
            facade.prompt()
              ? m(Editor, { facade: facade })
              : null
          ])
        : null
    ])
})
