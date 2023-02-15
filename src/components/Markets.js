import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import config from '../config.json';
import { loadTokens } from '../store/interactions';

function Markets() {
  const provider = useSelector((state) => state.provider.connection);
  const chainId = useSelector((state) => state.provider.chainId);

  const dispatch = useDispatch();

  const marketHandler = async (e) => {
    await loadTokens(provider, e.target.value.split(','), dispatch);
  };

  return (
    <div className="component exchange__markets">
      <div className="component__header">
        <h2>Select Market</h2>
      </div>
      {chainId && config[chainId] ? (
        <select name="markets" id="markets" onChange={marketHandler}>
          <option
            value={`${config[chainId].DexToken.address},${config[chainId].mETH.address}`}
          >
            DEX / mETH
          </option>
          <option
            value={`${config[chainId].DexToken.address},${config[chainId].mDAI.address}`}
          >
            DEX / mDAI
          </option>
        </select>
      ) : (
        <div>
          <p>Not Deployed to network</p>
        </div>
      )}

      <hr />
    </div>
  );
}

export default Markets;
