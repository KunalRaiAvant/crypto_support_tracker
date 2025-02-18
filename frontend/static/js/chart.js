/**
 * chart.js - Price chart handling and visualization
 * Crypto Support Tracker
 */

// Chart state
const chartState = {
    chart: null,
    data: {
      price: [],
      volume: [],
      supports: []
    },
    config: {
      showVolume: true,
      showSupports: true,
      timeframe: '1h',
      chartType: 'candlestick'
    }
  };
  
  // Initialize the chart
  function initializeChart(initialData) {
    const chartElement = document.getElementById('price-chart');
    if (!chartElement) {
      console.error('Chart element not found');
      return;
    }
    
    // Initialize with empty data if none provided
    if (!initialData || !initialData.price) {
      initialData = { price: [] };
    }
    
    // Store initial data
    updateChartData(initialData);
    
    // Create price candlestick trace
    const priceTrace = {
      type: 'candlestick',
      x: chartState.data.price.map(d => new Date(d.timestamp)),
      open: chartState.data.price.map(d => d.open),
      high: chartState.data.price.map(d => d.high),
      low: chartState.data.price.map(d => d.low),
      close: chartState.data.price.map(d => d.close),
      yaxis: 'y',
      name: 'Price',
      decreasing: {line: {color: '#ff4976'}},
      increasing: {line: {color: '#00c853'}}
    };
  
    // Create volume bar trace
    const volumeTrace = {
      type: 'bar',
      x: chartState.data.price.map(d => new Date(d.timestamp)),
      y: chartState.data.price.map(d => d.volume),
      yaxis: 'y2',
      name: 'Volume',
      marker: {
        color: chartState.data.price.map(d => 
          d.close >= d.open ? 'rgba(0,200,83,0.3)' : 'rgba(255,73,118,0.3)'
        )
      }
    };
  
    // Create support level traces
    const supportTraces = chartState.data.supports.map(level => ({
      type: 'scatter',
      x: [
        chartState.data.price.length > 0 ? new Date(chartState.data.price[0].timestamp) : new Date(),
        chartState.data.price.length > 0 ? new Date(chartState.data.price[chartState.data.price.length - 1].timestamp) : new Date()
      ],
      y: [level.price, level.price],
      mode: 'lines',
      line: {
        color: 'rgba(30, 144, 255, 0.5)',
        width: 2,
        dash: 'dot'
      },
      name: `Support $${level.price.toFixed(2)}`
    }));
  
    // Combine all traces
    const traces = [priceTrace, volumeTrace, ...supportTraces];
  
    // Chart layout
    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      xaxis: {
        type: 'date',
        rangeslider: { visible: false },
        gridcolor: 'rgba(128,128,128,0.2)',
        title: 'Time',
        color: '#ffffff'
      },
      yaxis: {
        title: 'Price',
        gridcolor: 'rgba(128,128,128,0.2)',
        side: 'right',
        color: '#ffffff'
      },
      yaxis2: {
        title: 'Volume',
        overlaying: 'y',
        side: 'left',
        showgrid: false,
        color: '#ffffff'
      },
      showlegend: false,
      margin: { t: 20, b: 40, l: 60, r: 60 },
      height: 600,
      font: { color: '#ffffff' }
    };
  
    // Chart configuration
    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToAdd: [{
        name: 'Toggle Volume',
        icon: Plotly.Icons.pencil,
        click: function(gd) {
          toggleChartVolume(!chartState.config.showVolume);
        }
      }]
    };
  
    // Create the chart
    Plotly.newPlot(chartElement, traces, layout, config);
    chartState.chart = chartElement;
    
    // Update chart statistics
    updateChartStatistics();
  }
  
  // Update chart with new price data
  function updateChart(data) {
    if (!chartState.chart || !data) return;
    
    // Convert timestamp to Date object if it's not already
    let timestamp = data.timestamp;
    if (typeof timestamp === 'string') {
      timestamp = new Date(timestamp);
    }
  
    // Update with new point
    const update = {
      x: [[timestamp]],
      open: [[data.open]],
      high: [[data.high]],
      low: [[data.low]],
      close: [[data.close]]
    };
  
    try {
      Plotly.extendTraces(chartState.chart, update, [0]);
  
      // Update volume if shown
      if (chartState.config.showVolume) {
        Plotly.extendTraces(chartState.chart, {
          x: [[timestamp]],
          y: [[data.volume]]
        }, [1]);
      }
  
      // Update chart statistics
      updateChartStatistics(data);
  
      // Remove old data points if there are too many
      const maxPoints = 500;
      if (chartState.chart.data[0].x.length > maxPoints) {
        const numToRemove = chartState.chart.data[0].x.length - maxPoints;
        Plotly.relayout(chartState.chart, {
          xaxis: {
            range: [
              chartState.chart.data[0].x[numToRemove],
              chartState.chart.data[0].x[chartState.chart.data[0].x.length - 1]
            ]
          }
        });
      }
    } catch (e) {
      console.error('Error updating chart:', e);
    }
  }
  
  // Update support levels on the chart
  function updateChartSupports(supportLevels) {
    if (!chartState.chart || !supportLevels || !chartState.config.showSupports) return;
  
    try {
      // Remove existing support traces
      const newData = chartState.chart.data.filter(trace => 
        trace.name === 'Price' || trace.name === 'Volume'
      );
      
      // Store the support levels
      chartState.data.supports = supportLevels;
  
      // Add new support traces if they should be visible
      if (chartState.config.showSupports) {
        // Get start and end dates for horizontal lines
        const startDate = chartState.chart.data[0].x[0];
        const endDate = chartState.chart.data[0].x[chartState.chart.data[0].x.length - 1];
  
        supportLevels.forEach(level => {
          newData.push({
            type: 'scatter',
            x: [startDate, endDate],
            y: [level.price, level.price],
            mode: 'lines',
            line: {
              color: level.isActive ? 'rgba(72, 187, 120, 0.7)' : 'rgba(66, 153, 225, 0.5)',
              width: level.isActive ? 3 : 2,
              dash: 'dot'
            },
            name: `Support $${level.price.toFixed(2)}`
          });
        });
      }
  
      Plotly.react(chartState.chart, newData, chartState.chart.layout);
    } catch (e) {
      console.error('Error updating chart supports:', e);
    }
  }
  
  // Update full chart with new timeframe data
  function updateFullChart(data) {
    if (!chartState.chart || !data) return;
    
    // Update chart data
    updateChartData(data);
    
    try {
      // Update price trace
      Plotly.update(chartState.chart, {
        x: [chartState.data.price.map(d => new Date(d.timestamp))],
        open: [chartState.data.price.map(d => d.open)],
        high: [chartState.data.price.map(d => d.high)],
        low: [chartState.data.price.map(d => d.low)],
        close: [chartState.data.price.map(d => d.close)]
      }, {}, [0]);
  
      // Update volume trace if visible
      if (chartState.config.showVolume) {
        Plotly.update(chartState.chart, {
          x: [chartState.data.price.map(d => new Date(d.timestamp))],
          y: [chartState.data.price.map(d => d.volume)],
          marker: {
            color: chartState.data.price.map(d => 
              d.close >= d.open ? 'rgba(0,200,83,0.3)' : 'rgba(255,73,118,0.3)'
            )
          }
        }, {}, [1]);
      }
  
      // Update support levels if they exist and should be visible
      if (data.supports && chartState.config.showSupports) {
        updateChartSupports(data.supports);
      }
      
      // Update chart statistics
      updateChartStatistics();
    } catch (e) {
      console.error('Error updating full chart:', e);
    }
  }
  
  // Update chart data store
  function updateChartData(data) {
    if (!data) return;
    
    if (data.price && Array.isArray(data.price)) {
      chartState.data.price = data.price;
    }
    
    if (data.supports && Array.isArray(data.supports)) {
      chartState.data.supports = data.supports;
    }
  }
  
  // Update chart statistics display
  function updateChartStatistics(latestData) {
    // Get elements
    const openElement = document.getElementById('stat-open');
    const highElement = document.getElementById('stat-high');
    const lowElement = document.getElementById('stat-low');
    const closeElement = document.getElementById('stat-close');
    
    if (!openElement || !highElement || !lowElement || !closeElement) {
      return;
    }
    
    // Determine data to use (latest point or last in series)
    let data;
    if (latestData && latestData.open) {
      data = latestData;
    } else if (chartState.data.price.length > 0) {
      data = chartState.data.price[chartState.data.price.length - 1];
    } else {
      return;
    }
    
    // Update stats
    openElement.textContent = `$${formatPrice(data.open)}`;
    highElement.textContent = `$${formatPrice(data.high)}`;
    lowElement.textContent = `$${formatPrice(data.low)}`;
    closeElement.textContent = `$${formatPrice(data.close)}`;
    
    // Colorize close based on change
    if (data.close > data.open) {
      closeElement.classList.remove('text-red-500');
      closeElement.classList.add('text-green-500');
    } else if (data.close < data.open) {
      closeElement.classList.remove('text-green-500');
      closeElement.classList.add('text-red-500');
    } else {
      closeElement.classList.remove('text-green-500', 'text-red-500');
    }
  }
  
  // Toggle volume visibility
  function toggleChartVolume(show) {
    if (!chartState.chart) return;
    
    chartState.config.showVolume = show;
    
    // Find volume trace (should be index 1)
    const volumeTraceIndex = 1;
    
    try {
      // Toggle visibility
      Plotly.restyle(chartState.chart, {
        visible: show
      }, [volumeTraceIndex]);
      
      // Update toggle button visually if it exists
      const volumeToggleButton = document.getElementById('toggle-volume');
      if (volumeToggleButton) {
        const indicatorDot = volumeToggleButton.querySelector('.indicator-dot');
        if (indicatorDot) {
          if (show) {
            indicatorDot.classList.remove('opacity-50');
          } else {
            indicatorDot.classList.add('opacity-50');
          }
        }
      }
    } catch (e) {
      console.error('Error toggling volume:', e);
    }
  }
  
  // Toggle support levels visibility
  function toggleChartSupports(show) {
    chartState.config.showSupports = show;
    
    if (show) {
      // Re-add support lines
      updateChartSupports(chartState.data.supports);
    } else {
      // Remove all support traces
      try {
        if (chartState.chart) {
          const filteredTraces = chartState.chart.data.filter(trace => 
            trace.name === 'Price' || trace.name === 'Volume'
          );
          Plotly.react(chartState.chart, filteredTraces, chartState.chart.layout);
        }
      } catch (e) {
        console.error('Error hiding supports:', e);
      }
    }
    
    // Update toggle button visually if it exists
    const supportsToggleButton = document.getElementById('toggle-supports');
    if (supportsToggleButton) {
      const indicatorDot = supportsToggleButton.querySelector('.indicator-dot');
      if (indicatorDot) {
        if (show) {
          indicatorDot.classList.remove('opacity-50');
        } else {
          indicatorDot.classList.add('opacity-50');
        }
      }
    }
  }
  
  // Change chart timeframe
  function changeTimeframe(timeframe) {
    chartState.config.timeframe = timeframe;
    
    // Update timeframe buttons UI if they exist
    const timeframeButtons = document.querySelectorAll('.tf-button');
    if (timeframeButtons.length > 0) {
      timeframeButtons.forEach(button => {
        // Extract timeframe from button id (tf-1h, tf-4h, etc.)
        const buttonTimeframe = button.id.split('-')[1];
        
        // Update button styles
        if (buttonTimeframe === timeframe) {
          button.classList.add('bg-blue-600');
          button.classList.remove('bg-gray-700');
        } else {
          button.classList.remove('bg-blue-600');
          button.classList.add('bg-gray-700');
        }
      });
    }
  }
  
  // Format price with appropriate decimals
  function formatPrice(price) {
    if (price === undefined || price === null) return '0.00';
    
    if (price >= 1000) {
      return parseFloat(price).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } else if (price >= 1) {
      return parseFloat(price).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
      });
    } else {
      return parseFloat(price).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
      });
    }
  }
  
  // Hide all chart supports
  function hideChartSupports() {
    toggleChartSupports(false);
  }
  
  // Export functions for use in other scripts
  window.initializeChart = initializeChart;
  window.updateChart = updateChart;
  window.updateChartSupports = updateChartSupports;
  window.updateFullChart = updateFullChart;
  window.toggleChartVolume = toggleChartVolume;
  window.toggleChartSupports = toggleChartSupports;
  window.changeTimeframe = changeTimeframe;
  window.hideChartSupports = hideChartSupports;