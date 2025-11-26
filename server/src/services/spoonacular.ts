import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE_URL = 'https://api.spoonacular.com';

export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  usedIngredients: Array<{ name: string }>;
  missedIngredients: Array<{ name: string }>;
}

export interface RecipeDetails {
  id: number;
  title: string;
  image: string;
  extendedIngredients: Array<{ original: string }>;
  instructions: string;
  summary: string;
  nutrition?: {
    nutrients: Array<{ name: string; amount: number }>;
  };
}

// Calculate eco-score based on recipe ingredients and nutrition
function calculateEcoScore(nutrition?: RecipeDetails['nutrition'], ingredients?: Array<{ original: string }>): number {
  let score = 5; // Start neutral

  // Check ingredients for meat/dairy keywords
  const ingredientText = ingredients?.map(i => i.original.toLowerCase()).join(' ') || '';

  // High impact foods (red meat, beef, lamb, pork)
  if (ingredientText.includes('beef') || ingredientText.includes('steak') ||
      ingredientText.includes('lamb') || ingredientText.includes('pork')) {
    score += 4; 
  }
  // Medium-high impact (chicken, turkey, cheese, dairy)
  else if (ingredientText.includes('chicken') || ingredientText.includes('turkey') ||
           ingredientText.includes('cheese') || ingredientText.includes('butter') ||
           ingredientText.includes('cream') || ingredientText.includes('milk')) {
    score += 2; 
  }
  // Medium impact (fish, seafood, eggs)
  else if (ingredientText.includes('fish') || ingredientText.includes('salmon') ||
           ingredientText.includes('tuna') || ingredientText.includes('shrimp') ||
           ingredientText.includes('egg')) {
    score += 1; 
  }
  // Low impact indicators (plant-based)
  else if (ingredientText.includes('lentil') || ingredientText.includes('chickpea') ||
           ingredientText.includes('bean') || ingredientText.includes('tofu') ||
           ingredientText.includes('vegetable') || ingredientText.includes('quinoa')) {
    score -= 3; 
  }

  // Use nutrition as secondary indicator if available
  if (nutrition?.nutrients) {
    const nutrients = nutrition.nutrients;
    const fiber = nutrients.find(n => n.name === 'Fiber')?.amount || 0;
    const saturatedFat = nutrients.find(n => n.name === 'Saturated Fat')?.amount || 0;

    // High fiber = plant-based (reduce score)
    if (fiber > 15) score -= 1;

    // High saturated fat = animal products (increase score)
    if (saturatedFat > 10) score += 1;
  }

  return Math.max(1, Math.min(10, score));
}

export async function searchRecipesByIngredients(ingredients: string, number: number = 10) {
  try {
    const response = await axios.get(`${BASE_URL}/recipes/findByIngredients`, {
      params: {
        apiKey: API_KEY,
        ingredients,
        number,
        ranking: 2, 
        ignorePantry: false
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching recipes from Spoonacular:', error);
    throw error;
  }
}

// Get recipe details with nutrition
export async function getRecipeDetails(id: number) {
  try {
    const response = await axios.get(`${BASE_URL}/recipes/${id}/information`, {
      params: {
        apiKey: API_KEY,
        includeNutrition: true
      }
    });

    const recipe: RecipeDetails = response.data;

    // Transform to our Recipe format
    return {
      id: String(recipe.id),
      name: recipe.title,
      ingredients: recipe.extendedIngredients.map(ing => ing.original),
      instructions: recipe.instructions || recipe.summary.replace(/<[^>]*>/g, ''), 
      ecoScore: calculateEcoScore(recipe.nutrition, recipe.extendedIngredients),
      imageUrl: recipe.image
    };
  } catch (error) {
    console.error('Error fetching recipe details from Spoonacular:', error);
    throw error;
  }
}

// Search recipes with full details
export async function searchRecipesWithDetails(ingredients: string, number: number = 10) {
  try {
    const searchResults: SpoonacularRecipe[] = await searchRecipesByIngredients(ingredients, number);

    const detailedRecipes = await Promise.all(
      searchResults.map(recipe => getRecipeDetails(recipe.id))
    );

    return detailedRecipes;
  } catch (error) {
    console.error('Error searching recipes with details:', error);
    throw error;
  }
}

// Get random recipes (for homepage when no search)
export async function getRandomRecipes(number: number = 10) {
  try {
    const response = await axios.get(`${BASE_URL}/recipes/random`, {
      params: {
        apiKey: API_KEY,
        number,
        tags: 'vegetarian,vegan' 
      }
    });

    const recipes = await Promise.all(
      response.data.recipes.map(async (recipe: RecipeDetails) => ({
        id: String(recipe.id),
        name: recipe.title,
        ingredients: recipe.extendedIngredients.map(ing => ing.original),
        instructions: recipe.instructions || recipe.summary.replace(/<[^>]*>/g, ''),
        ecoScore: calculateEcoScore(recipe.nutrition, recipe.extendedIngredients),
        imageUrl: recipe.image
      }))
    );

    return recipes;
  } catch (error) {
    console.error('Error fetching random recipes:', error);
    throw error;
  }
}
