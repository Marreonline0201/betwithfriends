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
   - **Build Command**: `npm install && bash build.sh`
   - **Start Command**: `npm run server`
3. **Manual Deploy** → **Deploy latest commit**

If you see "Build missing", check the **Build logs** in Render. The client build must complete. Free tier may need 2–3 minutes for `npm run build`.
