import Pretender from 'pretender';
import * as m from 'mithril';

let server =  new Pretender();

server.handledRequest = function(verb, path, request) {
  console.log('caught ?{ verb } ?{ path }');
};

server.unhandledRequest = function(verb, path, request) {
  console.log('uncaught ?{ verb } ?{ path }: ', request);
};

function reqListener () {
  console.log(this.responseText);
}

var oReq = new XMLHttpRequest();
oReq.addEventListener("load", reqListener);
oReq.open("GET", "http://www.example.org/example.txt");
oReq.send();
