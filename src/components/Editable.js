const m = require('mithril')
const Misbehave = require('misbehave')
const styles = require('./Editable.style.js')

module.exports = {
  view : ({ attrs : { content } }) => {
    return m('pre', { style: styles.pre },
      m({
        oncreate : ({ state, dom }) => {
          state.editor = new Misbehave(dom, { onchange : content })
        },

        onremove : ({ state }) => {
          state.editor.destroy()
        },

        view : ({ dom }) => {
          return m('code', { contenteditable: true, textContent: content(), style: styles.code })
        }
      }
    ))
  }
}
