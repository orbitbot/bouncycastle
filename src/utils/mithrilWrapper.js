const m = require('mithril')
const j2c = require('j2c')

/*
 * This util wraps mithril hyperscript calls so that mithril API calls will use j2c-generated names to avoid collisions with
 * global CSS. Approach from j2c gitter chat
 */

function wrapMithril(m, names) {
  regexp = /-?[_A-Za-z][-\w]*/g
  function replacer(match) {
    return match in names ? names[match] : match
  }
  return function() {
    var vnode = m.apply(m, arguments)
    var attrs = vnode.attrs
    if (!attrs) return vnode
    var className = attrs.class || attrs.className
    if (!className) return vnode
    attrs['class' in attrs ? 'class' : 'className'] = className.replace(regexp, replacer)
    return vnode
  }
}

module.exports = wrapMithril(m, j2c.names)
