# Crypto Support Tracker

A real-time cryptocurrency support level detection and visualization application built with Flask and Tailwind CSS.

## Features

- Real-time price tracking for multiple cryptocurrencies (BTC, ETH, BNB, SOL)
- Interactive candlestick charts with volume data
- Automatic support level detection and visualization
- Real-time updates via WebSocket
- Responsive design with Tailwind CSS
- Multiple timeframe options (5m, 15m, 1h, 4h)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/crypto-support-tracker.git
cd crypto-support-tracker
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Install Tailwind CSS:
```bash
npm install -g tailwindcss
```

5. Configure the application:
   - Copy `config.py.example` to `config.py`
   - Update the configuration values in `config.py`
   - (Optional) Set up Binance API credentials if you plan to use authenticated endpoints

## Usage

1. Start the Flask development server:
```bash
python run.py
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

## Development

### Building CSS

Generate the production CSS file:
```bash
tailwindcss -i frontend/static/css/main.css -o frontend/static/css/tailwind.css --minify
```

Watch for changes during development:
```bash
tailwindcss -i frontend/static/css/main.css -o frontend/static/css/tailwind.css --watch
```

### WebSocket Events

The application uses the following WebSocket events:

- `connect`: Initial connection event
- `initial_data`: Sent when client connects
- `price_update`: Real-time price updates
- `support_update`: Support level updates
- `chart_update`: Chart data updates

### File Structure

```
crypto_support_tracker/
├── backend/           # Flask backend
├── frontend/         # Frontend assets
│   ├── static/      # Static files (CSS, JS)
│   └── templates/   # HTML templates
├── config.py        # Configuration
└── run.py           # Application entry point
```

## Support Level Detection

The application uses a sophisticated algorithm to detect support levels based on:
- Price action analysis
- Volume confirmation
- Multiple timeframe validation
- Minimum touch points
- Distance filtering

Support levels are automatically updated every 15 minutes or when significant price movement occurs.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.