let Pretender = require('pretender');

window.server =  new Pretender();

window.returnFn = function(request) {
  return [
    200,
    {'content-type': 'application/javascript'},
    '[{"id": 12}, {"id": 14}]'
  ];
};

server.handledRequest = function(verb, path, request) {
  console.log(`caught ${ verb } ${ path }`);
};

server.unhandledRequest = function(verb, path, request) {
  console.log(`uncaught ${ verb } ${ path }:`, request);
  window.unhandled = request;
  window.path = path;
};
