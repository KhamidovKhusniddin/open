#!/bin/bash
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
./venv/bin/pip install -r requirements.txt
echo "Bot ishga tushmoqda..."
./venv/bin/python3 bot.py
