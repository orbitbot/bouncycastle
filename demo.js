let m = require('mithril');

window.m = m;

const view = () => m('p', 'some content')

window.addEventListener('load', function() {
  m.mount(document.body, { view });
})
