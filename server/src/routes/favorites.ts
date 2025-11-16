import express, { Request, Response } from 'express';
import { Favorite } from '../types';

const router = express.Router();

// Mock favorites data
let mockFavorites: Favorite[] = [
  {
    id: 'fav1',
    userId: 'user1',
    recipeId: '1',
    addedAt: new Date().toISOString(),
  },
];

// GET - Get all favorites for a user
router.get('/', (req: Request, res: Response) => {
  const { userId } = req.query;
  
  if (userId) {
    const userFavorites = mockFavorites.filter(fav => fav.userId === userId);
    res.json(userFavorites);
  } else {
    res.json(mockFavorites);
  }
});

// POST - Add a favorite
router.post('/', (req: Request, res: Response) => {
  const { userId, recipeId } = req.body;
  
  const newFavorite: Favorite = {
    id: `fav${Date.now()}`,
    userId,
    recipeId,
    addedAt: new Date().toISOString(),
  };
  
  mockFavorites.push(newFavorite);
  res.status(201).json(newFavorite);
});

// PUT - Update a favorite
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ 
    message: `Favorite ${id} updated (mock)`,
    ...req.body 
  });
});

// DELETE - Remove a favorite
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  mockFavorites = mockFavorites.filter(fav => fav.id !== id);
  res.json({ message: `Favorite ${id} deleted` });
});

export default router;