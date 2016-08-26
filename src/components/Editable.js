const m = require('mithril')
const Misbehave = require('misbehave')

module.exports = {
  view : ({ state, attrs : { content } }) => {
    return m('pre',
      m({
        oncreate : ({ state, dom }) => {
          state.editor = new Misbehave(dom, { onchange : content })
        },

        onremove : ({ state }) => {
          state.editor.destroy()
        },

        view : ({ state, dom }) => {
          return m('code', { contenteditable: true, textContent: content() })
        }
      }
    ))
  }
}
