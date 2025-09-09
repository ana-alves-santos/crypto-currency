const ctx = document.getElementById('chart').getContext('2d');
const coinListEl = document.getElementById('coinList');
const searchCoin = document.getElementById('searchInput');

let lineChart;
let marketData = [];

async function getMarketData() {
  if (marketData.length) return marketData;

  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h');
    if (!response.ok) throw new Error('Error fetching market data');
    marketData = await response.json();
    return marketData;
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function getHistoricalData(coinId) {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7&interval=daily`);
    if (!response.ok) throw new Error('Error fetching historical data');
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

function formatUSD(value) {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function updateCoinList(data, filter = '') {
  coinListEl.innerHTML = '';
  const filtered = data.filter(({ name, symbol }) =>
    name.toLowerCase().includes(filter.toLowerCase()) || symbol.toLowerCase().includes(filter.toLowerCase())
  );

  filtered.forEach(({ id, symbol, name, current_price }) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${symbol.toUpperCase()} - ${name}</span> <span>${formatUSD(current_price)}</span>`;
    li.addEventListener('click', () => loadChart(id, symbol.toUpperCase()));
    coinListEl.appendChild(li);
  });
}

async function loadChart(coinId, coinSymbol) {
  const historicalData = await getHistoricalData(coinId);
  if (!historicalData) return;

  const labels = historicalData.prices.map(([timestamp]) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
  });

  const prices = historicalData.prices.map(([, price]) => price);

  if (lineChart) {
    lineChart.data.labels = labels;
    lineChart.data.datasets[0].data = prices;
    lineChart.data.datasets[0].label = `${coinSymbol} (USD)`;
    lineChart.update();
  } else {
    lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `${coinSymbol} (USD)`,
          data: prices,
          borderColor: '#4f6ef7',
          backgroundColor: 'rgba(79,110,247,0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: '#f5f6fa' } }
        },
        scales: {
          x: { ticks: { color: '#a4a7b7' }, grid: { color: '#2f3249' } },
          y: { ticks: { color: '#a4a7b7' }, grid: { color: '#2f3249' } }
        }
      }
    });
  }
}

async function init() {
  const data = await getMarketData();
  if (!data.length) {
    coinListEl.innerHTML = '<li>Unable to load data.</li>';
    return;
  }

  updateCoinList(data);
  loadChart(data[0].id, data[0].symbol.toUpperCase());
}

let debounceTimer;
searchCoin.addEventListener('input', e => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    updateCoinList(marketData, e.target.value);
  }, 300);
});

init();
