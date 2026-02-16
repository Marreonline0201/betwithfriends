# Bet Tracker

A website for couples or friends to track bets and wins in games.

## Local Development

```bash
npm install
cd client && npm install && cd ..
npm run dev
```

Opens at http://localhost:3000

---

## Deploy to Render (One URL for Everything)

1. Go to [render.com](https://render.com) → your service → **Settings**
2. Set:
   - **Root Directory**: leave empty
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
3. **Manual Deploy** → **Deploy latest commit**

The build is committed to the repo, so Render only needs `npm install`. When you change the frontend, run `npm run build` locally and commit the updated `client/build` folder.

---

## GitHub Pages (Optional)

To also deploy to https://marreonline0201.github.io/SBUhack2026:

1. **Add secret**: Repo → Settings → Secrets → New secret  
   - Name: `REACT_APP_API_URL`  
   - Value: `https://sbuhack2026.onrender.com/api`

2. **Enable Pages**: Settings → Pages → Source: **Deploy from a branch** → Branch: **main** → Folder: **/docs**

3. **Trigger deploy**: Actions → Deploy to GitHub Pages → **Run workflow**
