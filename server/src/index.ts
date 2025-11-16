import express, { Request, Response } from 'express';
import cors from 'cors';
import recipesRouter from './routes/recipes';
import favoritesRouter from './routes/favorites';

const app = express();
const port = 8080;

// Middleware
app.use(express.json());
app.use(cors());
app.use('/recipes', recipesRouter);
app.use('/favorites', favoritesRouter);

// Test route
app.get('/', (req: Request, res: Response) => {
  res.send('GreenPlate API is running!');
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});