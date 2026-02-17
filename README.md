# Bet Tracker

A website for couples or friends to track bets and wins in games.

## Features

- Email/password signup & login
- **Google & Facebook** sign-in (optional)
- **Forgot password** – reset via email
- Groups, games, bets, wins tracking

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

### Optional: OAuth (Google, Facebook)

Add these env vars in Render → Environment:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` – from [Google Cloud Console](https://console.cloud.google.com/)
- `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` – from [Meta Developers](https://developers.facebook.com/)
- `API_URL` – your Render URL (e.g. `https://sbuhack2026.onrender.com`) – use just the hostname or full URL
- `FRONTEND_URL` – same (e.g. `https://sbuhack2026.onrender.com`) – **don’t double the protocol** (wrong: `https://https://...`)
- `REACT_APP_RENDER_URL` – same, for client builds (if your Render service has a different URL)

### Optional: Forgot password email

Add one of these:
- **Resend**: `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `noreply@yourdomain.com`)
- **SMTP**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`

---

## GitHub Pages (Optional)

To also deploy to https://marreonline0201.github.io/betwithfriends:

1. **Add secret**: Repo → Settings → Secrets and variables → Actions → New secret  
   - Name: `REACT_APP_API_URL`  
   - Value: `https://sbuhack2026.onrender.com/api`

2. **Enable Pages**: Settings → Pages → Build and deployment → Source: **GitHub Actions**

3. **Trigger deploy**: Actions → Deploy to GitHub Pages → **Run workflow**
