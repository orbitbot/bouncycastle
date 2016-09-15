var head = document.getElementsByTagName('head')[0]
var index = {}
var elements = {}

module.exports = {
  add : (sheet) => {
    if (sheet in index) {
      index[sheet]++
    } else {
      index[sheet] = 1
      let style = document.createElement('style')
      style.type = 'text/css'

      if (style.styleSheet) {
        style.styleSheet.cssText = sheet;
      } else {
        style.appendChild(document.createTextNode(sheet));
      }

      elements[sheet] = style
      head.appendChild(style)
    }
  },
  remove : (sheet) => {
    if (sheet in index) {
      index[sheet]--
      if (index[sheet] === 0) {
        let style = elements[sheet]
        style.parentNode.removeChild(style)
        delete elements[sheet]
        delete index[sheet]
      }
    }
  }
}
