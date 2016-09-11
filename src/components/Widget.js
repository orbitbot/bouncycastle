const m = require('mithril')
const Editor = require('./Editor.js')
const styles = require('./common.style.js')

module.exports = (facade) => {
  return {
    view : () => {
      return m('div', [
        m('button', { onclick: () => { facade.enabled( !facade.enabled()) } }, facade.enabled() ? 'disable' : 'enable'),
        facade.enabled()
          ? m('div', [
              facade.unhandledRequests().length
                ? m('ul', { style: styles.wrapper }, facade.unhandledRequests().map((req) => { return m('li', `${ req.method } ${ req.url }`) }))
                : null,
              facade.prompt()
                ? m(Editor, { facade: facade })
                : null
            ])
          : null
      ])
    }
  }
}
