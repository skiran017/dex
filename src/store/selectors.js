import { ethers } from 'ethers';

import { createSelector } from 'reselect';
import { get, groupBy, reject, maxBy, minBy } from 'lodash';
import moment from 'moment';

const GREEN = '#25CE8F';
const RED = '#F45353';

const account = (state) => get(state, 'provider.account');
const tokens = (state) => get(state, 'tokens.contracts');
const allOrders = (state) => get(state, 'exchange.allOrders.data', []);
const cancelledOrders = (state) =>
  get(state, 'exchange.cancelledOrders.data', []);
const filledOrders = (state) => get(state, 'exchange.filledOrders.data', []);

const openOrders = (state) => {
  const all = allOrders(state);
  const filled = filledOrders(state);
  const cancelled = cancelledOrders(state);

  const openOrders = reject(all, (order) => {
    const orderFilled = filled.some(
      (o) => o.id.toString() === order.id.toString()
    );
    const orderCancelled = cancelled.some(
      (o) => o.id.toString() === order.id.toString()
    );

    return orderFilled || orderCancelled;
  });

  return openOrders;
};

//My Open Orders------------------------------
export const myOpenOrdersSelector = createSelector(
  account,
  tokens,
  openOrders,
  (account, tokens, orders) => {
    if (!tokens[0] || !tokens[1]) {
      return;
    }

    //Filter orders created by current account
    orders = orders.filter((o) => o.user === account);

    //Filter orders by token addresses
    orders = orders.filter(
      (o) =>
        o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address
    );
    orders = orders.filter(
      (o) =>
        o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address
    );

    //Decorate orders- add display attributes
    orders = decorateMyOpenOrders(orders, tokens);

    //Sort orders by time descending for price comparison
    orders = orders.sort((a, b) => b.timeStamp - a.timeStamp);

    return orders;
  }
);

const decorateMyOpenOrders = (orders, tokens) => {
  return orders.map((order) => {
    order = decorateOrder(order, tokens);
    order = decorateMyOpenOrder(order, tokens);
    return order;
  });
};

const decorateMyOpenOrder = (order, tokens) => {
  let orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell';
  return {
    ...order,
    orderType,
    orderTypeClass: orderType === 'buy' ? GREEN : RED,
  };
};

const decorateOrder = (order, tokens) => {
  let token0Amount, token1Amount;
  //Note: DEX should be considered token0, mETH is considered token1
  //Example: Giving mETH in exchange for DEX
  if (order.tokenGive === tokens[1].address) {
    token0Amount = order.amountGive; //The amount of DEX we are giving
    token1Amount = order.amountGet; //The amount of mETH we want...
  } else {
    token0Amount = order.amountGet; //The amount of DEX we want
    token1Amount = order.amountGive; //The amount of mETH we are giving...
  }

  //Calculate token price to 5 decimal places
  const precision = 100000;
  let tokenPrice = token1Amount / token0Amount;
  tokenPrice = Math.round(tokenPrice * precision) / precision;

  return {
    ...order,
    token0Amount: ethers.utils.formatUnits(token0Amount, 'ether'),
    token1Amount: ethers.utils.formatUnits(token1Amount, 'ether'),
    tokenPrice,
    formattedTimeStamp: moment
      .unix(order.timeStamp)
      .format('h:mm:ssa d MMM YY'),
  };
};

//All Filled Orders----------------------------
export const filledOrderSelector = createSelector(
  filledOrders,
  tokens,
  (orders, tokens) => {
    if (!tokens[0] || !tokens[1]) {
      return;
    }

    //Filter orders by selected tokens
    orders = orders.filter(
      (o) =>
        o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address
    );
    orders = orders.filter(
      (o) =>
        o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address
    );

    //Sort orders by time ascending for price comparison
    orders = orders.sort((a, b) => a.timeStamp - b.timeStamp);

    //Decorate the orders
    orders = decorateFilledOrders(orders, tokens);

    //Sort orders by time descending for price comparison
    orders = orders.sort((a, b) => b.timeStamp - a.timeStamp);

    return orders;
  }
);

const decorateFilledOrders = (orders, tokens) => {
  //Track previous order to compare history
  let previousOrder = orders[0];

  return orders.map((order) => {
    order = decorateOrder(order, tokens);
    order = decorateFilledOrder(order, previousOrder);
    previousOrder = order; //update the previous order once its decorated

    return order;
  });
};

const decorateFilledOrder = (order, previousOrder) => {
  return {
    ...order,
    tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder),
  };
};

const tokenPriceClass = (tokenPrice, orderId, previousOrder) => {
  //Show green price if only one order exists
  if (previousOrder.id === orderId) {
    return GREEN;
  }

  //Show gree price if order price is higher than the prev. order and vise versa
  if (previousOrder.tokenPrice <= tokenPrice) {
    return GREEN;
  } else {
    return RED;
  }
};

//My Filled Orders-----------------------------
export const myFilledOrdersSelector = createSelector(
  account,
  tokens,
  filledOrders,
  (account, tokens, orders) => {
    if (!tokens[0] || !tokens[1]) {
      return;
    }

    //Filter orders created by current account
    orders = orders.filter((o) => o.user === account || o.creator === account);

    //Filter orders by token addresses
    orders = orders.filter(
      (o) =>
        o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address
    );
    orders = orders.filter(
      (o) =>
        o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address
    );

    //Decorate orders- add display attributes
    orders = decorateMyFilledOrders(orders, account, tokens);

    //Sort orders by date descending
    orders = orders.sort((a, b) => b.timeStamp - a.timeStamp);

    return orders;
  }
);

const decorateMyFilledOrders = (orders, account, tokens) => {
  return orders.map((order) => {
    order = decorateOrder(order, tokens);
    order = decorateMyFilledOrder(order, account, tokens);
    return order;
  });
};

const decorateMyFilledOrder = (order, account, tokens) => {
  const myOrder = order.creator === account;

  let orderType;
  if (myOrder) {
    orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell';
  } else {
    orderType = order.tokenGive === tokens[1].address ? 'sell' : 'buy';
  }
  return {
    ...order,
    orderType,
    orderTypeClass: orderType === 'buy' ? GREEN : RED,
    orderSign: orderType === 'buy' ? '+' : '-',
  };
};

//OrderBook------------------------------------
export const orderBookSelector = createSelector(
  openOrders,
  tokens,
  (orders, tokens) => {
    if (!tokens[0] || !tokens[1]) {
      return;
    }

    //Filter orders by selected tokens
    orders = orders.filter(
      (o) =>
        o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address
    );
    orders = orders.filter(
      (o) =>
        o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address
    );

    //Decorate orders
    orders = decorateOrderBookOrders(orders, tokens);

    //Group orders by orderType
    orders = groupBy(orders, 'orderType');

    //Fetch buy orders
    const buyOrders = get(orders, 'buy', []);

    //Sort buy orders by token price
    orders = {
      ...orders,
      buyOrders: buyOrders.sort((a, b) => b.tokenPrice - a.tokenPrice),
    };

    //Fetch sell orders
    const sellOrders = get(orders, 'sell', []);

    //Sort sell orders by token price
    orders = {
      ...orders,
      sellOrders: sellOrders.sort((a, b) => b.tokenPrice - a.tokenPrice),
    };
    return orders;
  }
);

const decorateOrderBookOrders = (orders, tokens) => {
  return orders.map((order) => {
    order = decorateOrder(order, tokens);
    order = decorateOrderBookOrder(order, tokens);
    return order;
  });
};

const decorateOrderBookOrder = (order, tokens) => {
  const orderType = order.tokenGive === tokens[1].address ? 'buy' : 'sell';

  return {
    ...order,
    orderType,
    orderTypeClass: orderType === 'buy' ? GREEN : RED,
    orderFillAction: orderType === 'buy' ? 'sell' : 'buy',
  };
};

//Price Chart----------------------------------
export const priceChartSelector = createSelector(
  filledOrders,
  tokens,
  (orders, tokens) => {
    if (!tokens[0] || !tokens[1]) {
      return;
    }
    //Filter orders by selected tokens
    orders = orders.filter(
      (o) =>
        o.tokenGet === tokens[0].address || o.tokenGet === tokens[1].address
    );
    orders = orders.filter(
      (o) =>
        o.tokenGive === tokens[0].address || o.tokenGive === tokens[1].address
    );

    //Decorate orders -  add display attributes
    orders = orders.map((o) => decorateOrder(o, tokens));

    //Sort orders by date ascending to compare history
    orders = orders.sort((a, b) => a.timeStamp - b.timeStamp);

    //Get last 2 orders  for final price and price change
    let secondLastOrder, lastOrder;
    [secondLastOrder, lastOrder] = orders.splice(
      orders.length - 2,
      orders.length
    );
    //get last order price
    const lastPrice = get(lastOrder, 'tokenPrice', 0);
    //get second last order price
    const secondLastPrice = get(secondLastOrder, 'tokenPrice', 0);

    return {
      lastPrice,
      lastPriceChange: lastPrice >= secondLastPrice ? '+' : '-',
      series: [
        {
          data: buildGraphData(orders),
        },
      ],
    };
  }
);

const buildGraphData = (orders) => {
  //Group orders by hour
  orders = groupBy(orders, (o) =>
    moment.unix(o.timeStamp).startOf('hour').format()
  );

  //Get each hour where data exists
  const hours = Object.keys(orders);

  //Build the graph series
  const graphData = hours.map((hour) => {
    //Fetch all orders from current order
    const group = orders[hour];

    //Calculate price values: open, high, low, close
    const open = group[0]; //first order
    const high = maxBy(group, 'tokenPrice'); //high price
    const low = minBy(group, 'tokenPrice'); //low price
    const close = group[group.length - 1]; //last order

    return {
      x: new Date(hour),
      y: [open.tokenPrice, high.tokenPrice, low.tokenPrice, close.tokenPrice],
    };
  });
  return graphData;
};
