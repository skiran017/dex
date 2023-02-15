import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import config from '../config.json';

import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadExchange,
  loadAllOrders,
  subscribeToEvents,
} from '../store/interactions';
import Alert from './Alert';

import Balance from './Balance';
import Markets from './Markets';
import Navbar from './Navbar';
import Order from './Order';
import OrderBook from './OrderBook';
import PriceChart from './PriceChart';
import Trades from './Trades';
import Transactions from './Transactions';

function App() {
  const dispatch = useDispatch();

  const loadBlockchainData = async () => {
    //Connect ethers to blockchain
    const provider = loadProvider(dispatch);
    const chainId = await loadNetwork(provider, dispatch);

    //Reload page when network changes
    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });

    //Fetch current account & balance from Metamask when account changes
    window.ethereum.on('accountsChanged', () => {
      loadAccount(provider, dispatch);
    });

    //Load Token smart contract
    const DEX = config[chainId].DexToken;
    const mETH = config[chainId].mETH;
    // const mDAI = config[chainId].mDAI;
    await loadTokens(provider, [DEX.address, mETH.address], dispatch);

    //Load Exchange smart contract
    const exchangeConfig = config[chainId].exchange;
    const exchange = await loadExchange(
      provider,
      exchangeConfig.address,
      dispatch
    );

    //Fetch all orders: open, filled, cancelled
    loadAllOrders(provider, exchange, dispatch);

    //Listen to events
    subscribeToEvents(exchange, dispatch);
  };

  useEffect(() => {
    loadBlockchainData();
  });
  return (
    <div>
      <Navbar />

      <main className="exchange grid">
        <section className="exchange__section--left grid">
          <Markets />

          <Balance />

          <Order />
        </section>
        <section className="exchange__section--right grid">
          <PriceChart />

          <Transactions />

          <Trades />

          <OrderBook />
        </section>
      </main>

      <Alert />
    </div>
  );
}

export default App;
