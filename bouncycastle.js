import Pretender from 'pretender';
import * as m from 'mithril';

let server =  new Pretender();

server.handledRequest = function(verb, path, request) {
  console.log('caught ?{ verb } ?{ path }');
};

server.unhandledRequest = function(verb, path, request) {
  console.log('uncaught ?{ verb } ?{ path }: ', request);
};
