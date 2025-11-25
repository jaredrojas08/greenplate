import express, { Request, Response } from 'express';
import { db } from '../firebase';
import { Recipe } from '../types';

const router = express.Router();

// GET all recipes or search by ingredient
router.get('/', async (req: Request, res: Response) => {
  try {
    const { ingredient } = req.query;
    const recipesRef = db.collection('recipes');
    const snapshot = await recipesRef.get();

    const recipes: Recipe[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Recipe));

    if (ingredient) {
      const searchTerms = (ingredient as string)
        .split(',')
        .map(term => term.trim().toLowerCase())
        .filter(term => term.length > 0);

      const filtered = recipes.filter(recipe =>
        searchTerms.every(searchTerm =>
          recipe.ingredients.some(ing =>
            ing.toLowerCase().includes(searchTerm)
          )
        )
      );

      res.json(filtered);
    } else {
      res.json(recipes);
    }
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// GET single recipe by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recipeDoc = await db.collection('recipes').doc(id).get();

    if (!recipeDoc.exists) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    const recipe: Recipe = {
      id: recipeDoc.id,
      ...recipeDoc.data()
    } as Recipe;

    res.json(recipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

// POST new recipe (admin only - for future use)
router.post('/', async (req: Request, res: Response) => {
  try {
    const newRecipe: Omit<Recipe, 'id'> = req.body;
    const docRef = await db.collection('recipes').add(newRecipe);

    res.status(201).json({
      message: 'Recipe created successfully',
      id: docRef.id,
      recipe: { id: docRef.id, ...newRecipe }
    });
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

export default router;