import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Optional
from backend.utils.binance_client import BinanceClient

class PriceService:
    def __init__(self, binance_client: BinanceClient):
        self.binance_client = binance_client
        self._price_cache = {}
        self._historical_cache = {}
        self._cache_timeout = timedelta(minutes=5)
        self._last_update = {}

    def get_current_price(self, symbol: str) -> Optional[Dict]:
        """Get current price data for a symbol"""
        return self.binance_client.get_current_price(symbol)

    def get_historical_data(self, symbol: str, interval: str, 
                          limit: int = 500) -> Optional[Dict]:
        """Get historical price data with caching"""
        cache_key = f"{symbol}_{interval}"
        now = datetime.now()

        # Check cache
        if cache_key in self._historical_cache:
            last_update = self._last_update.get(cache_key)
            if last_update and (now - last_update) < self._cache_timeout:
                return self._historical_cache[cache_key]

        # Fetch new data
        df = self.binance_client.get_historical_data(symbol, interval, limit)
        if df is None:
            return None

        # Process data for chart
        processed_data = self._process_historical_data(df)
        
        # Update cache
        self._historical_cache[cache_key] = processed_data
        self._last_update[cache_key] = now

        return processed_data

    def _process_historical_data(self, df: pd.DataFrame) -> Dict:
        """Process historical data for chart display"""
        return {
            'price': [{
                'timestamp': row['timestamp'].isoformat(),
                'open': float(row['open']),
                'high': float(row['high']),
                'low': float(row['low']),
                'close': float(row['close']),
                'volume': float(row['volume'])
            } for _, row in df.iterrows()],
            'volume_profile': self._calculate_volume_profile(df)
        }

    def _calculate_volume_profile(self, df: pd.DataFrame, 
                                num_bins: int = 50) -> Dict:
        """Calculate volume profile for price levels"""
        price_range = df['high'].max() - df['low'].min()
        bin_size = price_range / num_bins
        
        volume_profile = []
        current_price = df['low'].min()
        
        for _ in range(num_bins):
            mask = (df['low'] <= current_price + bin_size) & \
                  (df['high'] >= current_price)
            volume = df.loc[mask, 'volume'].sum()
            
            if volume > 0:
                volume_profile.append({
                    'price_level': float(current_price),
                    'volume': float(volume)
                })
            
            current_price += bin_size

        return volume_profile

    def invalidate_cache(self, symbol: str = None):
        """Invalidate cache for a symbol or all symbols"""
        if symbol:
            keys_to_remove = [k for k in self._historical_cache.keys() 
                            if k.startswith(symbol)]
            for key in keys_to_remove:
                self._historical_cache.pop(key, None)
                self._last_update.pop(key, None)
        else:
            self._historical_cache.clear()
            self._last_update.clear()