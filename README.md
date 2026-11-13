# GreenPlate - Sustainable Recipe Finder

A web application that helps users discover recipes based on ingredients they already have and displays the environmental impact (eco-score) of each recipe.

## Features

- 🔍 Search recipes by ingredient
- 🌱 View eco-scores for environmental impact
- ❤️ Save favorite recipes
- 👤 User profile with saved favorites
- 📱 Responsive design

Live at https://jaredrojas08.github.io/greenplate/

## How it runs

- `client/`: the React app, deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`.
- `worker/`: a Cloudflare Worker that calls Spoonacular so the API key never reaches the browser.
- Favorites live in Firestore and are read and written straight from the client. `firestore.rules` limits each user to their own.
- The Worker saves every recipe it fetches in Cloudflare KV (`RECIPES`), with no expiry. Repeat searches and the daily home picks come from KV, and once the Spoonacular quota runs out, searches match against every saved recipe.
- If KV has nothing that matches, the client falls back to the seeded recipes in Firestore.

## Running locally

```bash
cd client
npm install
npm run dev
```

The dev server on http://localhost:5173 uses the deployed Worker.

## Deploying the Worker

```bash
cd worker
npx wrangler deploy
npx wrangler secret put SPOONACULAR_API_KEY
```

## Author

- Jared Manuel Rojas
