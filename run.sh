#!/bin/bash
# Script to setup environment and run the Academic Standardizer App

# 1. Create Virtual Environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# 2. Install dependencies
echo "Installing dependencies..."
./venv/bin/pip install -r requirements.txt

# 3. Run the application
echo "Starting Application..."
echo "Please open http://127.0.0.1:5000 in your browser"
./venv/bin/python3 app.py
