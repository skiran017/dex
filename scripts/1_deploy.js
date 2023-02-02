const { ethers } = require('hardhat');

async function main() {
  console.log(`Preparing for deployment...\n`);

  //Fetch contract to deploy
  const Token = await ethers.getContractFactory('Token');
  const Exchange = await ethers.getContractFactory('Exchange');

  //Fetch accounts
  const accounts = await ethers.getSigners();
  console.log(
    `Accounts fetched:\n${accounts[0].address}\n${accounts[1].address}\n`
  );

  //Deploy contract
  const dexToken = await Token.deploy('DEX Token', 'DEX', '1000000');
  await dexToken.deployed();
  console.log(`DEX token deployed to: ${dexToken.address}`);

  const mETH = await Token.deploy('mock Ether', 'mETH', '1000000');
  await mETH.deployed();
  console.log(`mETH deployed to: ${mETH.address}`);

  const mDAI = await Token.deploy('mock DAI', 'mDAI', '1000000');
  await mDAI.deployed();
  console.log(`mDAI token deployed to: ${mDAI.address}`);

  const exchange = await Exchange.deploy(accounts[1].address, 10); //accounts[1].address: fee account address; 10: feePercent
  await exchange.deployed();
  console.log(`Exchange deployed to: ${exchange.address}`);
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
