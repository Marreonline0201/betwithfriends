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

## Deploy to GitHub Pages (Public)

The frontend deploys to GitHub Pages automatically when you push to `main`. The backend must be hosted separately (GitHub Pages only serves static files).

### Step 1: Deploy the backend to Render (free)

1. Go to [render.com](https://render.com) and sign up.
2. **New** → **Web Service**
3. Connect your GitHub repo `Marreonline0201/SBUhack2026`
4. Configure:
   - **Root Directory**: `Test`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
   - **Instance Type**: Free
5. Click **Create Web Service**. Wait for deployment.
6. Copy your backend URL (e.g. `https://bettracker-xxx.onrender.com`)

### Step 2: Add the backend URL to GitHub

1. On GitHub: repo → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. Name: `REACT_APP_API_URL`
4. Value: `https://your-app-name.onrender.com/api` (your Render URL + `/api`)

### Step 3: Enable GitHub Pages

1. Repo → **Settings** → **Pages**
2. **Source**: Deploy from a branch
3. **Branch**: main
4. **Folder**: **/docs**
5. Save

### Step 4: Push to deploy

Push to `main`. The workflow will build and deploy. Your site will be at:

**https://marreonline0201.github.io/SBUhack2026**

### Troubleshooting "Not Working"

| Problem | Fix |
|--------|-----|
| **Blank page** | 1. Add `REACT_APP_API_URL` secret (repo → Settings → Secrets → Actions). Value: `https://your-render-url.onrender.com/api`<br>2. Deploy the backend to Render first |
| **Login/Signup fails** | Backend not reachable. Deploy to Render and add the URL as `REACT_APP_API_URL` secret |
| **404 when refreshing** | Should be fixed. If not, ensure the workflow ran and deployed successfully |
| **Workflow fails** | Repo → Settings → Pages → Source: **Deploy from a branch**, Branch: **main**, Folder: **/docs** |

**Check workflow status:** Repo → Actions tab → click the latest "Deploy to GitHub Pages" run to see any errors.

---

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
