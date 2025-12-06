import express, { Request, Response } from 'express';
import { db } from '../firebase';
import { Recipe } from '../types';
import { searchRecipesWithDetails, getRandomRecipes } from '../services/spoonacular';

const router = express.Router();

// GET all recipes or search by ingredient
router.get('/', async (req: Request, res: Response) => {
  try {
    const { ingredient, limit } = req.query;
    const recipeLimit = limit ? parseInt(limit as string) : 6;

    // Try Spoonacular API first, fallback to Firestore if quota exceeded
    try {
      if (ingredient) {
        const ingredients = (ingredient as string).trim();
        const recipes = await searchRecipesWithDetails(ingredients, recipeLimit);
        res.json(recipes);
      } else {
        const recipes = await getRandomRecipes(recipeLimit);
        res.json(recipes);
      }
    } catch (apiError: any) {
      // If API quota exceeded, fallback to Firestore
      console.log('Spoonacular API error, falling back to Firestore:', apiError.message);

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

    // Try Spoonacular API first, fallback to Firestore if quota exceeded
    try {
      const { getRecipeDetails } = await import('../services/spoonacular');
      const recipe = await getRecipeDetails(Number(id));
      res.json(recipe);
    } catch (apiError: any) {
      // If API quota exceeded, try Firestore
      console.log('Spoonacular API error, trying Firestore:', apiError.message);

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
    }
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

// POST new recipe
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