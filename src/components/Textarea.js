const m = require('mithril')
const Behave = require('behave.js')

module.exports = {

  oninit : ({ state, attrs : { content } }) => {
    state.handleKeyDown = (e) => {
      if (state.editor) {
        setTimeout(() => {
          content(e.target.value)

          var numLines = e.target.value.split("\n").length,
              lineHeight = parseInt(getComputedStyle(e.target)['line-height']),
              padding = parseInt(getComputedStyle(e.target)['padding']);

          e.target.style.height = ((numLines * lineHeight) + (2 * padding)) + 'px';
        }, 0)
      }
    }
  },

  oncreate : ({ state, dom }) => {
    state.editor = new Behave({
      textarea   : dom,
      replaceTab : true,
      softTabs   : true,
      tabSize    : 2,
      autoOpen   : true,
      overwrite  : true,
      autoStrip  : true,
      autoIndent : true
    })
  },

  onremove : ({ state }) => {
    state.editor.destroy()
  },

  view : ({ state, attrs : { content } }) => {
    return m('textarea', { value: content(), onkeydown: state.handleKeyDown, style: 'font-size: 1em; line-height: 1.1em; font-family:monospace; width:100%; min-height: 4.3em; overflow: hidden; padding: 0.5em; resize: none' })
  }
}
