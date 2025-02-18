/**
 * support.js - Support level handling and visualization
 * Crypto Support Tracker
 */

// Support level state
const supportState = {
    levels: [],
    sortType: 'strength',
    currentPrice: 0,
    activeThreshold: 3, // % threshold to consider a support level "active"
    visibleOnChart: true
  };
  
  // Initialize support levels
  function initializeSupportLevels() {
    const supportLevelsContainer = document.getElementById('support-levels');
    const supportLoadingIndicator = document.getElementById('support-loading');
    const noSupportsMessage = document.getElementById('no-supports');
    const sortSelector = document.getElementById('support-sort');
    const refreshButton = document.getElementById('refresh-supports');
    
    // Set up event listeners
    if (sortSelector) {
      sortSelector.addEventListener('change', () => {
        supportState.sortType = sortSelector.value;
        sortAndRenderSupportLevels();
      });
    }
    
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        showLoadingState();
        requestSupportUpdate();
      });
    }
    
    // Initial loading state
    showLoadingState();
  }
  
  // Update support levels with new data
  function updateSupportLevels(levels, currentPrice) {
    if (!levels || !Array.isArray(levels)) {
      showEmptyState();
      return;
    }
    
    supportState.levels = levels;
    
    if (currentPrice) {
      supportState.currentPrice = currentPrice;
      calculateDistances();
    }
    
    if (supportState.levels.length === 0) {
      showEmptyState();
      return;
    }
    
    sortAndRenderSupportLevels();
    updateActiveSupportCount();
    
    if (supportState.visibleOnChart) {
      drawSupportsOnChart(supportState.levels);
    }
  }
  
  // Calculate distance from current price to each support level
  function calculateDistances() {
    supportState.levels.forEach(level => {
      // Calculate percentage distance
      const distance = ((level.price - supportState.currentPrice) / supportState.currentPrice) * 100;
      level.distance = parseFloat(distance.toFixed(2));
      
      // Determine if support is active based on distance
      level.isActive = Math.abs(distance) <= supportState.activeThreshold;
    });
  }
  
  // Sort and render support levels
  function sortAndRenderSupportLevels() {
    const sortedLevels = [...supportState.levels];
    
    // Sort based on selected criteria
    switch (supportState.sortType) {
      case 'strength':
        sortedLevels.sort((a, b) => b.strength - a.strength);
        break;
      case 'price':
        sortedLevels.sort((a, b) => b.price - a.price);
        break;
      case 'distance':
        // Sort by absolute distance (closest first)
        sortedLevels.sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance));
        break;
      case 'recent':
        // Sort by recency of testing
        sortedLevels.sort((a, b) => {
          const dateA = a.last_test ? new Date(a.last_test) : new Date(0);
          const dateB = b.last_test ? new Date(b.last_test) : new Date(0);
          return dateB - dateA;
        });
        break;
    }
    
    renderSupportLevels(sortedLevels);
  }
  
  // Render support levels to DOM
  function renderSupportLevels(levels) {
    const supportLevelsContainer = document.getElementById('support-levels');
    const supportLoadingIndicator = document.getElementById('support-loading');
    const noSupportsMessage = document.getElementById('no-supports');
    
    if (!supportLevelsContainer) return;
    
    // Hide loading and empty states
    if (supportLoadingIndicator) supportLoadingIndicator.classList.add('hidden');
    if (noSupportsMessage) noSupportsMessage.classList.add('hidden');
    
    // Show container
    supportLevelsContainer.classList.remove('hidden');
    
    // Clear existing content
    supportLevelsContainer.innerHTML = '';
    
    // Create cards for each support level
    levels.forEach(level => {
      const card = createSupportCard(level);
      supportLevelsContainer.appendChild(card);
    });
  }
  
  // Create a support level card
  function createSupportCard(level) {
    const card = document.createElement('div');
    card.className = `support-card bg-gray-700 rounded-lg p-4 transition-all duration-300 hover:bg-gray-600 ${level.isActive ? 'border-l-4 border-green-500' : ''}`;
    
    // Calculate badge color and text
    let badgeClass = 'text-xs font-medium rounded-full px-2 py-0.5 ';
    let badgeText = '';
    
    if (level.isActive) {
      badgeClass += 'bg-green-600 text-white';
      badgeText = 'Active';
    } else if (level.distance < 0) {
      badgeClass += 'bg-gray-500 text-white';
      badgeText = `${Math.abs(level.distance).toFixed(1)}% Below`;
    } else {
      badgeClass += 'bg-gray-500 text-white';
      badgeText = `${level.distance.toFixed(1)}% Above`;
    }
    
    // Format price with appropriate precision
    const formattedPrice = formatPrice(level.price);
    
    // Determine strength bar color
    let strengthBarColor = 'bg-yellow-500';
    if (level.strength >= 80) {
      strengthBarColor = 'bg-green-500';
    } else if (level.strength >= 50) {
      strengthBarColor = 'bg-blue-500';
    }
    
    // Card HTML
    card.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <span class="text-lg font-bold">$${formattedPrice}</span>
        <span class="${badgeClass}">${badgeText}</span>
      </div>
      <div class="mb-3">
        <div class="flex justify-between text-sm mb-1">
          <span>Strength</span>
          <span>${level.strength.toFixed(1)}%</span>
        </div>
        <div class="w-full bg-gray-600 rounded-full h-2">
          <div class="${strengthBarColor} rounded-full h-2" style="width: ${level.strength}%"></div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-sm text-gray-300">
        <div>
          <div class="text-gray-400 text-xs">Distance</div>
          <div class="${level.distance < 0 ? 'text-red-400' : 'text-green-400'}">
            ${Math.abs(level.distance).toFixed(2)}%
          </div>
        </div>
        <div>
          <div class="text-gray-400 text-xs">Touches</div>
          <div>${level.touches || '0'}</div>
        </div>
        <div class="col-span-2">
          <div class="text-gray-400 text-xs">Last Test</div>
          <div>${formatTimeAgo(level.last_test)}</div>
        </div>
      </div>
    `;
    
    return card;
  }
  
  // Update count of active support levels
  function updateActiveSupportCount() {
    const activeSupportCount = document.getElementById('active-supports-count');
    if (!activeSupportCount) return;
    
    const count = supportState.levels.filter(level => level.isActive).length;
    activeSupportCount.textContent = count.toString();
    
    // Update styling based on count
    if (count === 0) {
      activeSupportCount.classList.remove('bg-blue-600', 'bg-green-600');
      activeSupportCount.classList.add('bg-gray-600');
    } else if (count >= 3) {
      activeSupportCount.classList.remove('bg-blue-600', 'bg-gray-600');
      activeSupportCount.classList.add('bg-green-600');
    } else {
      activeSupportCount.classList.remove('bg-gray-600', 'bg-green-600');
      activeSupportCount.classList.add('bg-blue-600');
    }
    
    return count;
  }
  
  // Format relative time (e.g., "2 hours ago")
  function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    
    if (isNaN(diffSeconds)) return 'Invalid date';
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(diffSeconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval !== 1 ? 's' : ''} ago`;
      }
    }
    
    return 'Just now';
  }
  
  // Draw supports on chart
  function drawSupportsOnChart(levels) {
    if (typeof updateChartSupports === 'function') {
      updateChartSupports(levels);
    }
  }
  
  // Toggle support visibility on chart
  function toggleSupportsVisibility(visible) {
    supportState.visibleOnChart = visible;
    
    if (visible) {
      drawSupportsOnChart(supportState.levels);
    } else if (typeof hideChartSupports === 'function') {
      hideChartSupports();
    }
  }
  
  // Show loading state
  function showLoadingState() {
    const supportLevelsContainer = document.getElementById('support-levels');
    const supportLoadingIndicator = document.getElementById('support-loading');
    const noSupportsMessage = document.getElementById('no-supports');
    
    if (!supportLoadingIndicator) return;
    
    supportLevelsContainer.classList.add('hidden');
    noSupportsMessage.classList.add('hidden');
    supportLoadingIndicator.classList.remove('hidden');
  }
  
  // Show empty state
  function showEmptyState() {
    const supportLevelsContainer = document.getElementById('support-levels');
    const supportLoadingIndicator = document.getElementById('support-loading');
    const noSupportsMessage = document.getElementById('no-supports');
    
    if (!noSupportsMessage) return;
    
    supportLevelsContainer.classList.add('hidden');
    supportLoadingIndicator.classList.add('hidden');
    noSupportsMessage.classList.remove('hidden');
  }
  
  // Request support levels update via WebSocket
  function requestSupportUpdate() {
    if (typeof socket !== 'undefined') {
      const currentPair = document.getElementById('pair-selector')?.value || 'BTCUSDT';
      socket.emit('request_support_update', { pair: currentPair });
    }
  }
  
  // Initialize support functionality when DOM is loaded
  document.addEventListener('DOMContentLoaded', initializeSupportLevels);
  
  // Export functions for use in other scripts
  window.updateSupportLevels = updateSupportLevels;
  window.toggleSupportsVisibility = toggleSupportsVisibility;
  window.requestSupportUpdate = requestSupportUpdate;