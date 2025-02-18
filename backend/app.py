from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from threading import Thread
import time
import json
import os

# Avoid circular imports - these will be initialized later
# from backend.utils.binance_client import BinanceClient
# from backend.utils.support_detector import SupportDetector
# from backend.services.price_service import PriceService
# from backend.services.support_service import SupportService

import os
import sys

# Get the absolute path to the project root directory
project_root = os.path.dirname(os.path.abspath(__file__))  # This is the backend directory
base_dir = os.path.dirname(project_root)  # This is the project root
template_dir = os.path.join(base_dir, 'frontend', 'templates')
static_dir = os.path.join(base_dir, 'frontend', 'static')

# Print paths for debugging
print(f"Current file: {__file__}")
print(f"Project root: {project_root}")
print(f"Base directory: {base_dir}")
print(f"Template directory: {template_dir}")
print(f"Template directory exists: {os.path.exists(template_dir)}")
if os.path.exists(template_dir):
    print(f"Files in template directory: {os.listdir(template_dir)}")

app = Flask(__name__, 
    template_folder=template_dir,
    static_folder=static_dir
)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize services - these will be set later via dependency injection
# binance_client = BinanceClient()
# support_detector = SupportDetector()
# price_service = PriceService(binance_client)
# support_service = SupportService(support_detector)

# Global variables for tracking current pair and timeframe
current_pair = "BTCUSDT"
current_timeframe = "1h"

# These will be set later via dependency injection
price_service = None
support_service = None

@app.route('/')
def index():
    # For debugging
    print(f"Template folder: {app.template_folder}")
    print(f"Does index.html exist: {os.path.exists(os.path.join(app.template_folder, 'index.html'))}")
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    # Send initial data
    emit('initial_data', {
        'pair': current_pair,
        'timeframe': current_timeframe,
        'price_data': price_service.get_current_price(current_pair),
        'support_levels': support_service.get_support_levels(current_pair)
    })

@socketio.on('change_pair')
def handle_pair_change(data):
    global current_pair
    current_pair = data['pair']
    # Update data for new pair
    emit('price_update', price_service.get_current_price(current_pair))
    emit('support_update', support_service.get_support_levels(current_pair))

@socketio.on('change_timeframe')
def handle_timeframe_change(data):
    global current_timeframe
    current_timeframe = data['timeframe']
    # Update chart data for new timeframe
    emit('chart_update', price_service.get_historical_data(current_pair, current_timeframe))

def background_price_updates():
    """Background thread for sending real-time price updates"""
    while True:
        try:
            with app.app_context():
                # Get services from app config if available
                services = app.config.get('services', {})
                price_service = services.get('price_service')
                support_service = services.get('support_service')
                
                # Fall back to global variables if services aren't in app config
                if not price_service:
                    price_service = globals().get('price_service')
                if not support_service:
                    support_service = globals().get('support_service')
                
                # Get current price if service is available
                if price_service:
                    price_data = price_service.get_current_price(current_pair)
                    if price_data:
                        socketio.emit('price_update', price_data)
                
                # Update support levels if needed and service is available
                if support_service and support_service.should_update_supports(current_pair):
                    support_data = support_service.get_support_levels(current_pair)
                    if support_data:
                        socketio.emit('support_update', support_data)
        except Exception as e:
            print(f"Error in background thread: {e}")
            
        time.sleep(1)  # Update every second

if __name__ == '__main__':
    # Start background thread for price updates
    Thread(target=background_price_updates, daemon=True).start()
    socketio.run(app, debug=True)