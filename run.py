#!/usr/bin/env python
"""
Crypto Support Tracker
Run script - Application entry point
"""
import argparse
from backend.app import app, socketio
from backend.utils.binance_client import BinanceClient
from backend.utils.support_detector import SupportDetector
from backend.services.price_service import PriceService
from backend.services.support_service import SupportService
from backend.config import Config

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Crypto Support Tracker')
    parser.add_argument('--host', type=str, default='0.0.0.0',
                        help='Host to run the server on')
    parser.add_argument('--port', type=int, default=5000,
                        help='Port to run the server on')
    parser.add_argument('--debug', action='store_true',
                        help='Run in debug mode')
    return parser.parse_args()

def init_services():
    """Initialize application services"""
    # Load configuration
    config = Config()
    
    # Initialize services
    binance_client = BinanceClient()
    support_detector = SupportDetector(
        min_touches=config.MIN_TOUCHES,
        min_distance_percent=config.MIN_DISTANCE_PERCENT
    )
    
    price_service = PriceService(binance_client)
    support_service = SupportService(support_detector)
    
    return {
        'binance_client': binance_client,
        'support_detector': support_detector,
        'price_service': price_service,
        'support_service': support_service
    }

def main():
    """Main entry point for the application"""
    args = parse_args()
    
    # Initialize services
    services = init_services()
    
    # Register services with app context
    with app.app_context():
        app.config['services'] = services
        
        # Make services available as globals in app.py
        from backend.app import socketio
        import backend.app as app_module
        app_module.price_service = services['price_service']
        app_module.support_service = services['support_service']
        app_module.current_pair = "BTCUSDT"
        app_module.current_timeframe = "1h"
    
    # Configure Socket.IO settings in the initialization
    # These should be set before running
    socketio.ping_interval = Config.SOCKET_PING_INTERVAL
    socketio.ping_timeout = Config.SOCKET_PING_TIMEOUT
    
    # Run the application
    print(f"Starting Crypto Support Tracker on {args.host}:{args.port}")
    socketio.run(
        app,
        host=args.host,
        port=args.port,
        debug=args.debug,
        allow_unsafe_werkzeug=True  # For development only
    )

if __name__ == '__main__':
    main()