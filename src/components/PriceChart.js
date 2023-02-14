import { useSelector } from 'react-redux';
import Chart from 'react-apexcharts';

import Banner from './Banner';
import { options } from './PriceChart.config';
import { priceChartSelector } from '../store/selectors';

import arrowDown from '../assets/down-arrow.svg';
import arrowUp from '../assets/up-arrow.svg';

function PriceChart() {
  const symbols = useSelector((state) => state.tokens.symbols);
  const account = useSelector((state) => state.provider.account);

  const priceChart = useSelector(priceChartSelector);

  return (
    <div className="component exchange__chart">
      <div className="component__header flex-between">
        <div className="flex">
          <h2>
            {symbols.length
              ? `${symbols[0]} / ${symbols[1]}`
              : 'Select a valid network'}
          </h2>

          {priceChart && (
            <div className="flex">
              {priceChart.lastPriceChange === '+' ? (
                <img src={arrowUp} alt="Arrow up" />
              ) : (
                <img src={arrowDown} alt="Arrow down" />
              )}
              <span className="up">{priceChart.lastPrice}</span>
            </div>
          )}
        </div>
      </div>
      {!account ? (
        <Banner text={'Please connect with Metamask'} />
      ) : (
        <>
          <Chart
            options={options}
            series={priceChart ? priceChart.series : []}
            type="candlestick"
            width="100%"
            height="100%"
          />
        </>
      )}
    </div>
  );
}

export default PriceChart;
