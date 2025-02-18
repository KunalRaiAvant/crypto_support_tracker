from datetime import datetime, timedelta
from typing import List, Dict, Optional
from backend.utils.support_detector import SupportDetector

class SupportService:
    def __init__(self, support_detector: SupportDetector):
        self.support_detector = support_detector
        self._update_interval = timedelta(minutes=15)
        self._last_update = {}

    def get_support_levels(self, symbol: str, force_update: bool = False) -> List[Dict]:
        """Get support levels for a symbol"""
        now = datetime.now()
        
        # Check if update is needed
        if not force_update and symbol in self._last_update:
            time_since_update = now - self._last_update[symbol]
            if time_since_update < self._update_interval:
                return self.support_detector.get_cached_levels(symbol)

        # Get new support levels - we're not providing a DataFrame here
        # In a real implementation, we would fetch data first
        levels = self.support_detector.detect_support_levels(symbol)
        self._last_update[symbol] = now
        return levels

    def should_update_supports(self, symbol: str) -> bool:
        """Check if support levels should be updated"""
        if symbol not in self._last_update:
            return True

        time_since_update = datetime.now() - self._last_update[symbol]
        return time_since_update >= self._update_interval

    def calculate_distance_to_supports(self, current_price: float, 
                                    support_levels: List[Dict]) -> List[Dict]:
        """Calculate distance from current price to each support level"""
        for level in support_levels:
            distance = ((current_price - level['price']) / current_price) * 100
            level['distance'] = round(distance, 2)
        return support_levels

    def get_active_supports(self, symbol: str, 
                          max_distance: float = 5.0) -> List[Dict]:
        """Get active support levels within specified distance"""
        levels = self.get_support_levels(symbol)
        current_price = self._get_current_price(symbol)
        
        if not levels or not current_price:
            return []

        levels_with_distance = self.calculate_distance_to_supports(
            current_price, levels
        )
        
        return [level for level in levels_with_distance 
                if abs(level['distance']) <= max_distance]

    def invalidate_cache(self, symbol: Optional[str] = None):
        """Invalidate cache for a symbol or all symbols"""
        if symbol:
            self._last_update.pop(symbol, None)
        else:
            self._last_update.clear()