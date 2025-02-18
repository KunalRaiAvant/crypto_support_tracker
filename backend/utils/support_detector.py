import pandas as pd
import numpy as np
from typing import List, Dict
from datetime import datetime, timedelta

class SupportDetector:
    def __init__(self, min_touches: int = 3, min_distance_percent: float = 0.5):
        self.min_touches = min_touches
        self.min_distance_percent = min_distance_percent
        self._support_levels = {}
        self._last_update = {}

    def detect_support_levels(self, symbol: str, df: pd.DataFrame = None) -> List[Dict]:
        """
        Detect support levels using price action and volume analysis
        """
        # If no DataFrame is provided, use cached levels or return empty list
        if df is None:
            # Return cached levels if available
            if symbol in self._support_levels:
                return self._support_levels[symbol]
            # Mock data for demonstration purposes
            # In a real implementation, you would fetch data from a price service
            return [
                {
                    'price': 20000.0,
                    'strength': 85.5,
                    'touches': 7,
                    'last_test': datetime.now().isoformat()
                },
                {
                    'price': 19500.0,
                    'strength': 75.2,
                    'touches': 5,
                    'last_test': (datetime.now() - timedelta(days=2)).isoformat()
                },
                {
                    'price': 19000.0, 
                    'strength': 65.8,
                    'touches': 4,
                    'last_test': (datetime.now() - timedelta(days=5)).isoformat()
                }
            ]
            
        # If DataFrame is provided, process it
        # Convert price columns to numpy arrays for faster processing
        lows = df['low'].values
        volumes = df['volume'].values
        timestamps = df['timestamp'].values

        potential_supports = []
        window_size = 20  # Look for local minimums in 20-candle windows

        # Find local minimums
        for i in range(window_size, len(lows) - window_size):
            if self._is_local_minimum(lows, i, window_size):
                price_level = lows[i]
                touches = self._count_touches(lows, price_level)
                if touches >= self.min_touches:
                    strength = self._calculate_strength(lows, volumes, price_level, i)
                    last_test = self._find_last_test(lows, timestamps, price_level)
                    
                    potential_supports.append({
                        'price': float(price_level),
                        'strength': strength,
                        'touches': touches,
                        'last_test': last_test.isoformat() if last_test else None
                    })

        # Filter out supports that are too close to each other
        filtered_supports = self._filter_close_levels(potential_supports)
        
        # Sort by strength
        filtered_supports.sort(key=lambda x: x['strength'], reverse=True)
        
        # Update cache
        self._support_levels[symbol] = filtered_supports
        self._last_update[symbol] = datetime.now()
        
        return filtered_supports

    def _is_local_minimum(self, prices: np.ndarray, index: int, window: int) -> bool:
        """Check if price is a local minimum in the given window"""
        left_min = np.min(prices[index - window:index])
        right_min = np.min(prices[index:index + window])
        return prices[index] <= left_min and prices[index] <= right_min

    def _count_touches(self, prices: np.ndarray, level: float, tolerance: float = 0.001) -> int:
        """Count how many times price has touched this level"""
        lower_bound = level * (1 - tolerance)
        upper_bound = level * (1 + tolerance)
        touches = np.sum((prices >= lower_bound) & (prices <= upper_bound))
        return int(touches)

    def _calculate_strength(self, prices: np.ndarray, volumes: np.ndarray, 
                          level: float, index: int) -> float:
        """Calculate support level strength based on multiple factors"""
        # Factor 1: Number of touches
        touches = self._count_touches(prices, level)
        
        # Factor 2: Volume confirmation
        volume_score = self._calculate_volume_score(volumes, index)
        
        # Factor 3: Recent relevance
        recency_score = self._calculate_recency_score(prices, level, index)
        
        # Combine factors with weights
        strength = (
            0.4 * min(touches / self.min_touches, 1.0) +
            0.3 * volume_score +
            0.3 * recency_score
        )
        
        return round(strength * 100, 2)

    def _calculate_volume_score(self, volumes: np.ndarray, index: int) -> float:
        """Calculate volume significance score"""
        local_volume = volumes[index]
        avg_volume = np.mean(volumes)
        return min(local_volume / avg_volume, 2.0) / 2.0

    def _calculate_recency_score(self, prices: np.ndarray, level: float, index: int) -> float:
        """Calculate how relevant the support level is based on recent price action"""
        recent_prices = prices[index:]
        distance_to_level = np.abs(recent_prices - level)
        min_distance = np.min(distance_to_level)
        return 1.0 - (min_distance / level)

    def _filter_close_levels(self, supports: List[Dict]) -> List[Dict]:
        """Filter out support levels that are too close to each other"""
        if not supports:
            return []

        filtered = [supports[0]]
        min_price = min([s['price'] for s in supports])
        max_price = max([s['price'] for s in supports])
        min_distance = (max_price - min_price) * (self.min_distance_percent / 100)

        for support in supports[1:]:
            if all(abs(support['price'] - f['price']) >= min_distance for f in filtered):
                filtered.append(support)

        return filtered

    def _find_last_test(self, prices: np.ndarray, timestamps: np.ndarray, 
                        level: float, tolerance: float = 0.001) -> datetime:
        """Find the last time price tested this level"""
        lower_bound = level * (1 - tolerance)
        upper_bound = level * (1 + tolerance)
        touches = (prices >= lower_bound) & (prices <= upper_bound)
        if np.any(touches):
            last_touch_idx = np.where(touches)[0][-1]
            return timestamps[last_touch_idx]
        return None

    def get_cached_levels(self, symbol: str) -> List[Dict]:
        """Get cached support levels for a symbol"""
        return self._support_levels.get(symbol, [])