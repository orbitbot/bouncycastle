const createMountPoint = (id) => {
  let elem = document.createElement('div')
  elem.setAttribute('id', id)
  let scripts = document.getElementsByTagName('script')
  let thisScript = scripts[scripts.length -1]
  thisScript.parentNode.insertBefore(elem, thisScript)
}

module.exports = createMountPoint
