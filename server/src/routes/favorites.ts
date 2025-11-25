import express, { Request, Response } from 'express';
import { db } from '../firebase';
import { Favorite } from '../types';

const router = express.Router();

// GET favorites, optionally filtered by userId
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    let favoritesRef = db.collection('favorites');

    if (userId) {
      const snapshot = await favoritesRef.where('userId', '==', userId).get();
      const favorites: Favorite[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Favorite));
      res.json(favorites);
    } else {
      const snapshot = await favoritesRef.get();
      const favorites: Favorite[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Favorite));
      res.json(favorites);
    }
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// POST new favorite
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, recipeId } = req.body;

    if (!userId || !recipeId) {
      res.status(400).json({ error: 'userId and recipeId are required' });
      return;
    }

    const newFavorite = {
      userId,
      recipeId,
      addedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('favorites').add(newFavorite);

    res.status(201).json({
      id: docRef.id,
      ...newFavorite
    });
  } catch (error) {
    console.error('Error creating favorite:', error);
    res.status(500).json({ error: 'Failed to create favorite' });
  }
});

// PUT update favorite (for future use)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.collection('favorites').doc(id).update(req.body);
    res.json({
      message: 'Favorite updated successfully',
      id,
      ...req.body
    });
  } catch (error) {
    console.error('Error updating favorite:', error);
    res.status(500).json({ error: 'Failed to update favorite' });
  }
});

// DELETE favorite
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.collection('favorites').doc(id).delete();
    res.json({ message: 'Favorite deleted successfully' });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    res.status(500).json({ error: 'Failed to delete favorite' });
  }
});

export default router;