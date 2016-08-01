const chai   = require('chai');
const should = chai.should();

const Facade = require('../src/facade.js')

describe('facade API', () => {

  let facade

  beforeEach(() => {
    facade = new Facade();
  })

  it('has a basic API', () => {
    facade.enable.should.not.equal(undefined)
    facade.disable.should.not.equal(undefined)
    facade.addHandler.should.not.equal(undefined)
    facade.handleRequest.should.not.equal(undefined)
  })

})
