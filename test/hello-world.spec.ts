import 'mocha';
import { hello } from '../src/index';
import { expect } from 'chai';


describe('Hello function', () => {

  it('should return hello world', () => {
    let result = hello();
    expect(result).to.equal('Hello npm!');
    result = hello('world');
    expect(result).to.equal('Hello world!');
  });

});
