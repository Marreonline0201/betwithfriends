# Bet Tracker

A website for couples or friends to track bets and wins in games. Create groups, add members, choose games, record bets, and see who's winning!

## Features

- **User accounts** – Sign up and log in
- **Groups** – Create a group (e.g., "Me & Sarah") and add members by email
- **Games** – Add games you play together (Chess, Mario Kart, etc.)
- **Bets** – Record what you're betting on (e.g., "Loser buys dinner")
- **Wins** – Track who won each game and see leaderboards

## Tech Stack

- **Backend**: Node.js, Express, SQLite
- **Frontend**: React, React Router
- **Auth**: JWT (JSON Web Tokens)

## Setup

1. **Navigate to the project** (the Bet Tracker app is in the `Test` folder):

   ```bash
   cd Test
   ```

2. **Install dependencies**:

   ```bash
   npm install
   cd client
   npm install
   cd ..
   ```

   Or use the shortcut (from inside `Test`):

   ```bash
   npm run setup
   ```

3. **Start the backend** (first terminal):

   ```bash
   npm run server
   ```

   The API runs at http://localhost:5000

4. **Start the frontend** (second terminal):

   ```bash
   npm run client
   ```

   The app opens at http://localhost:3000

5. **Or run both at once**:

   ```bash
   npm run dev
   ```

## How It Works

1. **Sign up** – Create an account with your name, email, and password.
2. **Create a group** – Give it a name (e.g., "Me & Partner").
3. **Add members** – Enter their email. They must sign up first to be added.
4. **Add games** – Add the games you play together.
5. **Add bets** – For each game, specify what you're betting on.
6. **Record wins** – Click "+ [Name] won" when someone wins a game.
7. **View leaderboard** – See who has the most wins per game.

## Project Structure

```
SBUhack2026/Test/
├── server/           # Node.js backend
│   ├── index.js      # Express app setup
│   ├── db.js         # SQLite database
│   ├── middleware/   # Auth middleware
│   └── routes/       # API routes (auth, groups, games, bets, wins)
├── client/           # React frontend
│   └── src/
│       ├── api.js    # API client
│       ├── context/  # Auth context
│       └── pages/    # Login, Signup, Dashboard, GroupDetail
├── data/             # SQLite database (created on first run)
└── package.json
```

## API Endpoints

- `POST /api/auth/signup` – Create account
- `POST /api/auth/login` – Log in
- `GET /api/auth/me` – Get current user

- `GET /api/groups` – List groups
- `POST /api/groups` – Create group
- `GET /api/groups/:id` – Get group with members
- `POST /api/groups/:id/members` – Add member (by email)
- `DELETE /api/groups/:id/members/:userId` – Remove member

- `GET /api/games/group/:groupId` – List games
- `POST /api/games` – Create game
- `DELETE /api/games/:id` – Delete game

- `GET /api/bets/game/:gameId` – List bets
- `POST /api/bets` – Create bet
- `DELETE /api/bets/:id` – Delete bet

- `GET /api/wins/game/:gameId` – List wins
- `GET /api/wins/game/:gameId/leaderboard` – Win counts per user
- `POST /api/wins` – Add win
- `DELETE /api/wins/:id` – Delete win
