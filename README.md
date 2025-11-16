# GreenPlate - Sustainable Recipe Finder

A web application that helps users discover recipes based on ingredients they already have and displays the environmental impact (eco-score) of each recipe.

## Features

- 🔍 Search recipes by ingredient
- 🌱 View eco-scores for environmental impact
- ❤️ Save favorite recipes
- 👤 User profile with saved favorites
- 📱 Responsive design

## Tech Stack

**Frontend:**
- React with TypeScript
- Vite
- React Router
- CSS3

**Backend:**
- Node.js
- Express.js
- TypeScript

**Future (Milestone 3):**
- Firebase Authentication
- Firebase Firestore Database

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jaredrojas08/greenplate.git
cd greenplate
```

2. Install backend dependencies:
```bash
cd server
npm install
```

3. Install frontend dependencies:
```bash
cd ../client
npm install
```

### Running the Application

1. Start the backend server (in `server` folder):
```bash
npm run dev
```
Server will run on http://localhost:8080

2. Start the frontend (in `client` folder, in a new terminal):
```bash
npm run dev
```
Frontend will run on http://localhost:5173

## Project Structure
```
greenplate/
├── client/          # React frontend
│   ├── src/
│   │   ├── pages/   # Page components
│   │   ├── types.ts # TypeScript types
│   │   ├── App.tsx
│   │   └── App.css
│   └── package.json
├── server/          # Express backend
│   ├── src/
│   │   ├── routes/  # API routes
│   │   ├── types.ts
│   │   └── index.ts
│   └── package.json
└── README.md
```

## API Endpoints

- `GET /recipes` - Get all recipes or search by ingredient
- `GET /recipes/:id` - Get single recipe by ID
- `POST /recipes` - Create new recipe
- `GET /favorites` - Get user's favorites
- `POST /favorites` - Add recipe to favorites
- `PUT /favorites/:id` - Update favorite
- `DELETE /favorites/:id` - Remove favorite

## Milestone Progress

- ✅ Milestone 1: Project ideation and roadmap
- ✅ Milestone 2: Frontend UI + Express API skeleton
- ⏳ Milestone 3: Firebase integration + Authentication
- ⏳ Final: Deployment + Presentation

## Authors

- Jared Manuel Rojas
