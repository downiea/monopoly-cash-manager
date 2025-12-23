# Monopoly Cash Manager

A comprehensive cash manager for the Monopoly board game with a React frontend and FastAPI backend.

## Features

- **Player Management**: Up to 8 players, each starting with £1500
- **All UK Monopoly Properties**: 22 properties with authentic costs, mortgage values, house costs, and rent structures
- **Train Stations**: 4 stations with tiered rent (£25/£50/£100/£200 based on ownership)
- **Utilities**: 2 utilities with dice-roll-based rent (4x or 10x the dice roll)
- **Property Transactions**: Buy, mortgage, unmortgage properties
- **Building**: Build houses and hotels, sell buildings
- **Rent Calculation**: Automatic rent calculation including color group bonuses (doubled rent when owning all properties in a color)
- **Money Transfers**: Player-to-player, player-to-bank, bank-to-player
- **Free Parking**: Fines accrue in the Free Parking pot until collected
- **Game Reset**: Start a new game at any time

## Prerequisites

- Python 3.12+
- Node.js 18+
- Poetry (Python package manager)

## Running Locally

### Backend

1. Navigate to the backend directory:
   ```bash
   cd monopoly-backend
   ```

2. Install dependencies:
   ```bash
   poetry install
   ```

3. Start the development server:
   ```bash
   poetry run fastapi dev app/main.py
   ```

   The backend will be available at http://localhost:8000

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd monopoly-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at http://localhost:5173

### Running as Combined App

To serve the frontend from the backend (single server):

1. Build the frontend:
   ```bash
   cd monopoly-frontend
   npm run build
   ```

2. Copy the build to the backend static directory:
   ```bash
   mkdir -p ../monopoly-backend/static
   cp -r dist/* ../monopoly-backend/static/
   ```

3. Start the backend:
   ```bash
   cd ../monopoly-backend
   poetry run fastapi dev app/main.py
   ```

4. Access the app at http://localhost:8000

## API Endpoints

- `GET /healthz` - Health check
- `GET /game/state` - Get current game state
- `POST /game/reset` - Reset the game
- `POST /players` - Add a player
- `DELETE /players/{player_id}` - Remove a player
- `POST /properties/buy` - Buy a property
- `POST /properties/mortgage` - Mortgage a property
- `POST /properties/unmortgage` - Unmortgage a property
- `POST /properties/build` - Build a house or hotel
- `POST /properties/sell-building` - Sell a house or hotel
- `POST /transfer` - Transfer money between players/bank
- `POST /rent/pay` - Pay rent to property owner
- `POST /free-parking/collect` - Collect Free Parking pot

## Tech Stack

- **Backend**: FastAPI, Python 3.12, Poetry
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Database**: In-memory (data resets on server restart)

## Note

This is a proof-of-concept application using an in-memory database. Game data will be lost when the server restarts.
