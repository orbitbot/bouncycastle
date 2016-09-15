const m = require('mithril')
const Misbehave = require('misbehave')
const styles = require('../utils/styles.js')
const css = require('./Editable.style.js')

module.exports = {
  oninit : () => styles.add(css),
  onremove : () =>  styles.remove(css),

  view : ({ attrs : { content } }) => m(`pre.${ css.editable }`,
    m({
      oncreate : ({ state, dom }) => {
        state.editor = new Misbehave(dom, { onchange : content })
      },

      onremove : ({ state }) => {
        state.editor.destroy()
      },

      view : ({ dom }) => {
        return m('code', { contenteditable: true, textContent: content() })
      }
    }
  ))
}
