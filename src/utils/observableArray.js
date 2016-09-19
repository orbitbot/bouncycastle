const m = require('mithril')

module.exports = () => {
  let stream = m.prop([])

  stream.push = (...args) => {
    stream(Array.prototype.concat.apply(stream(), args))
  }

  stream.remove = (elem) => {
    let current = stream()
    let index = current.indexOf(elem)
    if (index >= 0) {
      current.splice(index, 1)
      stream(current)
    }
  }

  return stream;
}
