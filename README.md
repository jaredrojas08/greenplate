# WILL DEPLOY AT A LATER DATE

# GreenPlate - Sustainable Recipe Finder

A web application that helps users discover recipes based on ingredients they already have and displays the environmental impact (eco-score) of each recipe.

## Features

- 🔍 Search recipes by ingredient
- 🌱 View eco-scores for environmental impact
- ❤️ Save favorite recipes
- 👤 User profile with saved favorites
- 📱 Responsive design

Live at https://jaredrojas08.github.io/GreenPlate/

## How it runs

- `client/`: the React app, deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`.
- `worker/`: a Cloudflare Worker that calls Spoonacular so the API key never reaches the browser.
- Favorites live in Firestore and are read and written straight from the client. `firestore.rules` limits each user to their own.
- When Spoonacular is down or out of quota, the client falls back to the saved recipes in Firestore.

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
