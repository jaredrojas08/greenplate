import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Favorite, Recipe } from './types';

// The Worker in worker/, which holds the Spoonacular key.
const API_URL = 'https://greenplate-api.jaredrojas08.workers.dev';

async function fromWorker<T>(path: string): Promise<T> {
  const response = await fetch(API_URL + path);
  if (!response.ok) throw new Error(`Recipe API answered ${response.status}`);
  return response.json();
}

// When Spoonacular is down or out of quota, the saved recipes in Firestore keep searches working.
async function savedRecipes(ingredient?: string): Promise<Recipe[]> {
  const snapshot = await getDocs(collection(db, 'recipes'));
  const recipes = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as Recipe);
  const terms = (ingredient ?? '')
    .split(',')
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);
  return recipes.filter((recipe) =>
    terms.every((term) => recipe.ingredients.some((ing) => ing.toLowerCase().includes(term)))
  );
}

export async function getRecipes(ingredient: string, limit: number): Promise<Recipe[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (ingredient) params.set('ingredient', ingredient);
  try {
    return await fromWorker<Recipe[]>(`/recipes?${params}`);
  } catch (error) {
    console.warn('Falling back to saved recipes:', error);
    return savedRecipes(ingredient);
  }
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  try {
    return await fromWorker<Recipe>(`/recipes/${encodeURIComponent(id)}`);
  } catch (error) {
    console.warn('Falling back to saved recipe:', error);
    const snapshot = await getDoc(doc(db, 'recipes', id));
    return snapshot.exists() ? ({ ...snapshot.data(), id: snapshot.id } as Recipe) : null;
  }
}

// Firestore's rules only let a user read, add, and remove favorites with their own uid.
export async function getFavorites(userId: string): Promise<Favorite[]> {
  const snapshot = await getDocs(query(collection(db, 'favorites'), where('userId', '==', userId)));
  return snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as Favorite);
}

export async function addFavorite(userId: string, recipe: Recipe): Promise<void> {
  await addDoc(collection(db, 'favorites'), {
    userId,
    recipeId: recipe.id,
    recipe,
    addedAt: new Date().toISOString()
  });
}

export async function removeFavorite(favoriteId: string): Promise<void> {
  await deleteDoc(doc(db, 'favorites', favoriteId));
}
