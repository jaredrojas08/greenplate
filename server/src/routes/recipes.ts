import express, { Request, Response } from 'express';
import { Recipe } from '../types';

const router = express.Router();

const mockRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Vegetarian Pasta',
    ingredients: ['pasta', 'tomatoes', 'basil', 'olive oil'],
    instructions: '1. Boil pasta. 2. Make sauce. 3. Mix together.',
    ecoScore: 3,
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=300',
  },
  {
    id: '2',
    name: 'Chickpea Curry',
    ingredients: ['chickpeas', 'coconut milk', 'curry powder', 'onion'],
    instructions: '1. Sauté onions. 2. Add curry powder. 3. Add chickpeas and coconut milk.',
    ecoScore: 2,
    imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300',
  },
  {
    id: '3',
    name: 'Lentil Soup',
    ingredients: ['lentils', 'carrots', 'celery', 'vegetable broth'],
    instructions: '1. Chop vegetables. 2. Simmer with lentils. 3. Season to taste.',
    ecoScore: 2,
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300',
  },
];

router.get('/', (req: Request, res: Response) => {
  const { ingredient } = req.query;
  
  if (ingredient) {
    const searchTerms = (ingredient as string)
      .split(',')
      .map(term => term.trim().toLowerCase())
      .filter(term => term.length > 0);
    
    const filtered = mockRecipes.filter(recipe =>
      searchTerms.every(searchTerm =>
        recipe.ingredients.some(ing => 
          ing.toLowerCase().includes(searchTerm)
        )
      )
    );
    
    res.json(filtered);
  } else {
    res.json(mockRecipes);
  }
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const recipe = mockRecipes.find(r => r.id === id);
  
  if (recipe) {
    res.json(recipe);
  } else {
    res.status(404).json({ error: 'Recipe not found' });
  }
});

router.post('/', (req: Request, res: Response) => {
  const newRecipe: Recipe = req.body;
  res.status(201).json({ 
    message: 'Recipe created (mock)', 
    recipe: newRecipe 
  });
});

export default router;