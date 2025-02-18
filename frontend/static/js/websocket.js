// Initialize Socket.IO connection
const socket = io();

// DOM Elements
const pairSelector = document.getElementById('pair-selector');
const timeframeSelector = document.getElementById('timeframe-selector');
const currentPrice = document.getElementById('current-price');
const priceChange = document.getElementById('price-change');
const priceHigh = document.getElementById('price-high');
const priceLow = document.getElementById('price-low');
const volume = document.getElementById('volume');

// Current state
let currentPair = 'BTCUSDT';
let currentTimeframe = '1h';

// Connect handler
socket.on('connect', () => {
    console.log('Connected to server');
});

// Initial data handler
socket.on('initial_data', (data) => {
    updatePriceDisplay(data.price_data);
    updateSupportLevels(data.support_levels);
    initializeChart(data.price_data);
});

// Price update handler
socket.on('price_update', (data) => {
    updatePriceDisplay(data);
    updateChart(data);
});

// Support levels update handler
socket.on('support_update', (data) => {
    updateSupportLevels(data);
    updateChartSupports(data);
});

// Chart update handler
socket.on('chart_update', (data) => {
    updateFullChart(data);
});

// Update price display
function updatePriceDisplay(data) {
    if (!data) return;

    // Update current price
    currentPrice.textContent = `$${parseFloat(data.price).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    // Update 24h change with color
    const changeValue = parseFloat(data.change_24h);
    priceChange.textContent = `${changeValue > 0 ? '+' : ''}${changeValue.toFixed(2)}%`;
    priceChange.className = changeValue >= 0 ? 'text-green-500' : 'text-red-500';

    // Update 24h high/low
    priceHigh.textContent = `$${parseFloat(data.high_24h).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
    priceLow.textContent = `$${parseFloat(data.low_24h).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

    // Update volume
    volume.textContent = parseFloat(data.volume_24h).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Update support levels display
function updateSupportLevels(levels) {
    const supportLevelsContainer = document.getElementById('support-levels');
    supportLevelsContainer.innerHTML = '';

    levels.forEach((level, index) => {
        const card = document.createElement('div');
        card.className = 'bg-gray-700 rounded-lg p-4';
        
        const lastTest = new Date(level.last_test);
        const timeAgo = getTimeAgo(lastTest);

        card.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="text-lg font-bold">$${level.price.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}</span>
                <span class="text-sm text-gray-400">Level ${index + 1}</span>
            </div>
            <div class="mb-2">
                <div class="flex justify-between text-sm mb-1">
                    <span>Strength</span>
                    <span>${level.strength}%</span>
                </div>
                <div class="w-full bg-gray-600 rounded-full h-2">
                    <div class="bg-blue-500 rounded-full h-2" style="width: ${level.strength}%"></div>
                </div>
            </div>
            <div class="text-sm text-gray-400">
                <div>Touches: ${level.touches}</div>
                <div>Last Test: ${timeAgo}</div>
            </div>
        `;
        
        supportLevelsContainer.appendChild(card);
    });
}

// Utility function to format time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
        }
    }
    
    return 'Just now';
}

// Event Listeners
pairSelector.addEventListener('change', (e) => {
    currentPair = e.target.value;
    socket.emit('change_pair', { pair: currentPair });
});

timeframeSelector.addEventListener('change', (e) => {
    currentTimeframe = e.target.value;
    socket.emit('change_timeframe', { timeframe: currentTimeframe });
});