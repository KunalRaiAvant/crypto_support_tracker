import requests
import pandas as pd
from datetime import datetime
import time
from typing import Dict, List, Optional

class BinanceClient:
    def __init__(self):
        self.base_url = "https://api.binance.com/api/v3"
        self.ws_url = "wss://stream.binance.com:9443/ws"
        self._price_cache = {}
        self._last_update = {}

    def get_current_price(self, symbol: str) -> Dict:
        """Get current price and 24h stats for a symbol"""
        now = time.time()
        
        # Return cached data if it's less than 1 second old
        if symbol in self._last_update:
            if now - self._last_update[symbol] < 1:
                return self._price_cache[symbol]

        try:
            # Get ticker price
            ticker_response = requests.get(
                f"{self.base_url}/ticker/24hr",
                params={"symbol": symbol}
            )
            ticker_data = ticker_response.json()

            # Format response
            price_data = {
                "symbol": symbol,
                "price": float(ticker_data["lastPrice"]),
                "change_24h": float(ticker_data["priceChangePercent"]),
                "volume_24h": float(ticker_data["volume"]),
                "high_24h": float(ticker_data["highPrice"]),
                "low_24h": float(ticker_data["lowPrice"]),
                "timestamp": int(ticker_data["closeTime"])
            }

            # Update cache
            self._price_cache[symbol] = price_data
            self._last_update[symbol] = now

            return price_data
        except Exception as e:
            print(f"Error fetching price for {symbol}: {str(e)}")
            return None

    def get_historical_data(self, symbol: str, interval: str, limit: int = 500) -> Optional[pd.DataFrame]:
        """Get historical kline data"""
        try:
            response = requests.get(
                f"{self.base_url}/klines",
                params={
                    "symbol": symbol,
                    "interval": interval,
                    "limit": limit
                }
            )
            data = response.json()

            # Convert to DataFrame
            df = pd.DataFrame(data, columns=[
                'timestamp', 'open', 'high', 'low', 'close', 'volume',
                'close_time', 'quote_volume', 'trades', 'taker_buy_volume',
                'taker_buy_quote_volume', 'ignore'
            ])

            # Convert timestamp to datetime
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            
            # Convert price columns to float
            for col in ['open', 'high', 'low', 'close', 'volume']:
                df[col] = df[col].astype(float)

            return df
        except Exception as e:
            print(f"Error fetching historical data for {symbol}: {str(e)}")
            return None

    def get_depth(self, symbol: str, limit: int = 100) -> Optional[Dict]:
        """Get order book depth"""
        try:
            response = requests.get(
                f"{self.base_url}/depth",
                params={
                    "symbol": symbol,
                    "limit": limit
                }
            )
            return response.json()
        except Exception as e:
            print(f"Error fetching depth for {symbol}: {str(e)}")
            return None