#!/usr/bin/env bash
# Exit on error
set -o errexit

pip install -r requirements.txt

cd frontend/frontend
npm install
npm run build
cd ../..
