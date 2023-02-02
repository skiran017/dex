const { ethers } = require('hardhat');
const config = require('../src/config.json');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether');
};

const wait = (seconds) => {
  const milliseconds = seconds * 1000;
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

async function main() {
  //Fetch accounts from wallet - these are unlocked
  const accounts = await ethers.getSigners();

  //Fetch network
  const { chainId } = await ethers.provider.getNetwork();
  console.log('Using chainId:', chainId);

  const DexToken = await ethers.getContractAt(
    'Token',
    config[chainId].DexToken.address
  );
  console.log(`DexToken fetched: ${DexToken.address}\n`);

  const mETH = await ethers.getContractAt(
    'Token',
    config[chainId].mETH.address
  );
  console.log(`mETH token fetched: ${mETH.address}\n`);

  const mDAI = await ethers.getContractAt(
    'Token',
    config[chainId].mDAI.address
  );
  console.log(`mDAI token fetched: ${mDAI.address}\n`);

  //Fetch the deployed exchange
  const exchange = await ethers.getContractAt(
    'Exchange',
    config[chainId].exchange.address
  );
  console.log(`Exchange fetched: ${exchange.address}\n`);

  //Give tokens to account[1]
  const sender = accounts[0];
  const receiver = accounts[1];
  let amount = tokens(10000);

  //user1 transfers 10,000 mETH...
  let transaction, result;
  transaction = await mETH.connect(sender).transfer(receiver.address, amount);
  result = await transaction.wait();
  console.log(
    `Transferred ${amount} tokens from ${sender.address} to ${receiver.address}\n`
  );

  //Setup exchange users
  const user1 = accounts[0];
  const user2 = accounts[1];
  amount = tokens(10000);

  //user1 approves 10,000 DEX...
  transaction = await DexToken.connect(user1).approve(exchange.address, amount);
  result = await transaction.wait();
  console.log(`Approved ${amount} tokens from ${user1.address}`);

  //user1 deposits 10,000 DEX...
  transaction = await exchange
    .connect(user1)
    .depositToken(DexToken.address, amount);
  result = await transaction.wait();
  console.log(`Deposited ${amount} DEX tokens from ${user1.address}\n`);

  //user2 approves mETH...
  transaction = await mETH.connect(user2).approve(exchange.address, amount);
  result = await transaction.wait();
  console.log(`Approved ${amount} tokens from ${user2.address}`);

  //user2 deposits mETH...
  transaction = await exchange
    .connect(user2)
    .depositToken(mETH.address, amount);
  result = await transaction.wait();
  console.log(`Deposited ${amount} mETH from ${user2.address}\n`);

  ///////Seed a Cancelled Order////

  //user1 makes order to get tokens
  let orderId;
  transaction = await exchange
    .connect(user1)
    .makeOrder(mETH.address, tokens(100), DexToken.address, tokens(5)); //get 100mETH; give 5DEX
  result = await transaction.wait();
  console.log(`Made order from ${user1.address}`);

  //user1 cancels order
  orderId = result.events[0].args.id;
  transaction = await exchange.connect(user1).cancelOrder(orderId);
  result = await transaction.wait();
  console.log(`Cancelled order from ${user1.address}\n`);

  //wait 1 second
  await wait(1);

  //////Seed Filled Orders////

  //user1 makes order
  transaction = await exchange
    .connect(user1)
    .makeOrder(mETH.address, tokens(100), DexToken.address, tokens(10));
  result = await transaction.wait();
  console.log(`Made order from ${user1.address}`);

  //user2 fills order
  orderId = result.events[0].args.id;
  transaction = await exchange.connect(user2).fillOrder(orderId);
  result = await transaction.wait();
  console.log(`Filled order from ${user2.address}\n`);

  //wait 1 second
  await wait(1);

  //user1 makes another order
  transaction = await exchange
    .connect(user1)
    .makeOrder(mETH.address, tokens(50), DexToken.address, tokens(15));
  result = await transaction.wait();
  console.log(`Made order from ${user1.address}`);

  //user2 fills another order
  orderId = result.events[0].args.id;
  transaction = await exchange.connect(user2).fillOrder(orderId);
  result = await transaction.wait();
  console.log(`Filled order from ${user2.address}\n`);

  //wait 1 second
  await wait(1);

  //user1 makes final order
  transaction = await exchange
    .connect(user1)
    .makeOrder(mETH.address, tokens(200), DexToken.address, tokens(20));
  result = await transaction.wait();
  console.log(`Made order from ${user1.address}`);

  //user2 fills final order
  orderId = result.events[0].args.id;
  transaction = await exchange.connect(user2).fillOrder(orderId);
  result = await transaction.wait();
  console.log(`Filled order from ${user2.address}\n`);

  //wait 1 second
  await wait(1);

  //////// Seed open Orders ///////

  //user1 makes 10 orders
  for (let i = 1; i <= 10; i++) {
    transaction = await exchange
      .connect(user1)
      .makeOrder(mETH.address, tokens(10 * i), DexToken.address, tokens(10));
    result = await transaction.wait();
    console.log(`Made order from ${user1.address}`);

    //wait 1 second
    await wait(1);
  }

  //user2 makes 10 orders
  for (let i = 1; i <= 10; i++) {
    transaction = await exchange
      .connect(user2)
      .makeOrder(DexToken.address, tokens(10), mETH.address, tokens(10 * i));
    result = await transaction.wait();
    console.log(`Made order from ${user2.address}`);

    //wait 1 second
    await wait(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
