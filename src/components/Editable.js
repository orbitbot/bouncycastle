const h = require('../utils/mithrilWrapper.js')
const Misbehave = require('misbehave')
const styles = require('../utils/styles.js')
const css = require('./Editable.style.js')

module.exports = {
  oninit : () => styles.add(css),
  onremove : () =>  styles.remove(css),

  view : ({ attrs : { content } }) => h('pre.editable',
    h({
      oncreate : ({ state, dom }) => {
        state.editor = new Misbehave(dom, { onchange : content })
      },

      onremove : ({ state }) => {
        state.editor.destroy()
      },

      view : ({ dom }) => {
        return h('code', { contenteditable: true, textContent: content() })
      }
    }
  ))
}
