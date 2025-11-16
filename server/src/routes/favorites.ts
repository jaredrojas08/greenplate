import express, { Request, Response } from 'express';
import { Favorite } from '../types';

const router = express.Router();

let mockFavorites: Favorite[] = [
  {
    id: 'fav1',
    userId: 'user1',
    recipeId: '1',
    addedAt: new Date().toISOString(),
  },
];

router.get('/', (req: Request, res: Response) => {
  const { userId } = req.query;
  
  if (userId) {
    const userFavorites = mockFavorites.filter(fav => fav.userId === userId);
    res.json(userFavorites);
  } else {
    res.json(mockFavorites);
  }
});

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

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ 
    message: `Favorite ${id} updated (mock)`,
    ...req.body 
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  mockFavorites = mockFavorites.filter(fav => fav.id !== id);
  res.json({ message: `Favorite ${id} deleted` });
});

export default router;