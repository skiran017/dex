import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  myOpenOrdersSelector,
  myFilledOrdersSelector,
} from '../store/selectors';
import { cancelOrder } from '../store/interactions';
import Banner from './Banner';

import sort from '../assets/sort.svg';

function Transactions() {
  const [showMyOrders, setShowMyOrders] = useState(true);

  const tradesRef = useRef(null);
  const ordersRef = useRef(null);

  const dispatch = useDispatch();

  const provider = useSelector((state) => state.provider.connection);
  const exchange = useSelector((state) => state.exchange.contract);
  const symbols = useSelector((state) => state.tokens.symbols);
  const myOpenOrders = useSelector(myOpenOrdersSelector);
  const myFilledOrders = useSelector(myFilledOrdersSelector);

  const tabHandler = (e) => {
    if (e.target.className !== ordersRef.current.className) {
      e.target.className = 'tab tab--active';
      ordersRef.current.className = 'tab';
      setShowMyOrders(false);
    } else {
      e.target.className = 'tab tab--active';
      tradesRef.current.className = 'tab';
      setShowMyOrders(true);
    }
  };

  const cancelHandler = (order) => {
    cancelOrder(provider, exchange, order, dispatch);
  };

  return (
    <div className="component exchange__transactions">
      {showMyOrders ? (
        <div>
          <div className="component__header flex-between">
            <h2>My Orders</h2>

            <div className="tabs">
              <button
                ref={ordersRef}
                onClick={tabHandler}
                className="tab tab--active"
              >
                Orders
              </button>
              <button ref={tradesRef} onClick={tabHandler} className="tab">
                Trades
              </button>
            </div>
          </div>

          {!myOpenOrders || myOpenOrders.length === 0 ? (
            <Banner text={'No Open Orders'} />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>
                    {symbols && symbols[0]}
                    <img src={sort} alt="Sort" />
                  </th>
                  <th>
                    {symbols && `${symbols[0]} / ${symbols[1]}`}
                    <img src={sort} alt="Sort" />
                  </th>
                  <th>{}</th>
                </tr>
              </thead>

              <tbody>
                {myOpenOrders &&
                  myOpenOrders.map((order, idx) => {
                    return (
                      <tr key={idx}>
                        <td
                          style={{
                            color: `${order.orderTypeClass}`,
                          }}
                        >
                          {order.token0Amount}
                        </td>
                        <td>{order.tokenPrice}</td>
                        <td>
                          <button
                            className="button--sm"
                            onClick={() => cancelHandler(order)}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div>
          <div className="component__header flex-between">
            <h2>My Transactions</h2>

            <div className="tabs">
              <button
                onClick={tabHandler}
                ref={ordersRef}
                className="tab tab--active"
              >
                Orders
              </button>
              <button onClick={tabHandler} ref={tradesRef} className="tab">
                Trades
              </button>
            </div>
          </div>

          {!myFilledOrders || myFilledOrders.length === 0 ? (
            <Banner text={'No Transactions'} />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>
                    Time
                    <img src={sort} alt="Sort" />
                  </th>
                  <th>
                    {symbols && symbols[0]}
                    <img src={sort} alt="Sort" />
                  </th>
                  <th>
                    {symbols && `${symbols[0]} / ${symbols[1]}`}
                    <img src={sort} alt="Sort" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {myFilledOrders &&
                  myFilledOrders.map((order, idx) => {
                    return (
                      <tr key={idx}>
                        <td>{order.formattedTimeStamp}</td>
                        <td
                          style={{
                            color: `${order.orderTypeClass}`,
                          }}
                        >
                          {order.orderSign}
                          {order.token0Amount}
                        </td>
                        <td>{order.tokenPrice}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default Transactions;
