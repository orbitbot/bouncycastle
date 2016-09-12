var head = document.getElementsByTagName('head')[0]
var index = {}
var elements = {}

export default function domPlugin(j2c) {
  var sheet = j2c.sheet
  j2c.sheet = (tree) => {
    var sheet = sheet.call(j2c, tree)
    if (sheet in index) {
      index[sheet]++
    } else {
      index[sheet] = 1
      var style = document.createElement('style')
      style.type = 'text/css' // might not even be needed

      if (stlye.styleSheet) {
        style.styleSheet.cssText = sheet;
      } else {
        style.appendChild(document.createTextNode(sheet));
      }

      elements[sheet] = style
      head.appendChild(style)
    }
    return sheet
  }
  j2c.remove = (sheet) => {
    if (!( sheet in index )) return
    index[sheet]--
    if (index[sheet] === 0) {
      var style = elements[sheet]
      style.parentNode.removeChild(style)
      delete elements[sheet]
    }
  }
}
