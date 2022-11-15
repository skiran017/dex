const { ethers } = require('hardhat');
const { expect } = require('chai');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether');
};

describe('Token', () => {
  let token;

  //gets executed before each 'it'
  beforeEach(async () => {
    //get token from blockchain
    const Token = await ethers.getContractFactory('Token');
    token = await Token.deploy('Spektr Token', 'SPKTR', 999999999);
  });

  describe('Deployment', () => {
    const name = 'Spektr Token';
    const symbol = 'SPKTR';
    const decimals = '18';
    const totalSupply = tokens('999999999');

    it('has correct name', async () => {
      //read token name
      expect(await token.name()).to.equal(name); //check that name is correct
    });

    it('has correct symbol', async () => {
      expect(await token.symbol()).to.equal(symbol);
    });

    it('has correct decimals', async () => {
      expect(await token.decimals()).to.equal(decimals);
    });

    it('has correct totalSupply', async () => {
      expect(await token.totalSupply()).to.equal(totalSupply);
    });
  });
});
