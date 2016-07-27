let m = require('mithril');

window.m = m;

const view = () => m('p', 'some content')

m.mount(document.body, { view });
