// Keeps the Spoonacular key off the client. Only reads recipes; favorites go
// straight to Firestore under its security rules.

interface Env {
  SPOONACULAR_API_KEY: string;
  ALLOWED_ORIGINS: string;
  RECIPES: KVNamespace;
}

type Recipe = {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string;
  ecoScore: number;
  imageUrl?: string;
};

type SpoonacularDetails = {
  id: number;
  title: string;
  image?: string;
  extendedIngredients?: Array<{ original: string }>;
  instructions?: string | null;
  summary?: string;
  nutrition?: { nutrients: Array<{ name: string; amount: number }> };
};

const BASE_URL = 'https://api.spoonacular.com';
// Each search spends quota, so one request can't ask for a huge page.
const MAX_LIMIT = 24;

function calculateEcoScore(recipe: SpoonacularDetails): number {
  let score = 5;
  const text = recipe.extendedIngredients?.map((i) => i.original.toLowerCase()).join(' ') ?? '';
  const has = (...words: string[]) => words.some((w) => text.includes(w));

  if (has('beef', 'steak', 'lamb', 'pork')) score += 4;
  else if (has('chicken', 'turkey', 'cheese', 'butter', 'cream', 'milk')) score += 2;
  else if (has('fish', 'salmon', 'tuna', 'shrimp', 'egg')) score += 1;
  else if (has('lentil', 'chickpea', 'bean', 'tofu', 'vegetable', 'quinoa')) score -= 3;

  const nutrients = recipe.nutrition?.nutrients ?? [];
  const amount = (name: string) => nutrients.find((n) => n.name === name)?.amount ?? 0;
  if (amount('Fiber') > 15) score -= 1;
  if (amount('Saturated Fat') > 10) score += 1;

  return Math.max(1, Math.min(10, score));
}

// Spoonacular's instructions are HTML from third parties. Flattened to text so
// the client never renders their markup.
function toPlainText(html: string): string {
  return html
    .replace(/<\/(li|p)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function toRecipe(details: SpoonacularDetails): Recipe {
  return {
    id: String(details.id),
    name: details.title,
    ingredients: details.extendedIngredients?.map((i) => i.original) ?? [],
    instructions: toPlainText(details.instructions || details.summary || ''),
    ecoScore: calculateEcoScore(details),
    imageUrl: details.image
  };
}

async function spoonacular<T>(env: Env, path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(BASE_URL + path);
  url.search = new URLSearchParams({ ...params, apiKey: env.SPOONACULAR_API_KEY }).toString();
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Spoonacular ${path} answered ${response.status}`);
  return response.json() as Promise<T>;
}

// KV keys: recipe:<id> holds a full recipe forever, search:<terms>:<limit> holds the
// ids a search returned, random:<date> holds one day's random picks.
type SavedMeta = { ingredients: string };

async function saveRecipes(env: Env, recipes: Recipe[]): Promise<void> {
  await Promise.all(
    recipes.map((recipe) =>
      env.RECIPES.put(`recipe:${recipe.id}`, JSON.stringify(recipe), {
        // KV caps metadata at 1 KB, which is enough to match ingredient terms without a read.
        metadata: { ingredients: recipe.ingredients.join(' | ').toLowerCase().slice(0, 900) } satisfies SavedMeta
      })
    )
  );
}

async function loadRecipes(env: Env, ids: string[]): Promise<Recipe[]> {
  const found = await Promise.all(ids.map((id) => env.RECIPES.get<Recipe>(`recipe:${id}`, 'json')));
  return found.filter((recipe): recipe is Recipe => recipe !== null);
}

async function savedIds(env: Env, terms: string[]): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.RECIPES.list<SavedMeta>({ prefix: 'recipe:', cursor });
    for (const key of page.keys) {
      const text = key.metadata?.ingredients ?? '';
      if (terms.every((term) => text.includes(term))) ids.push(key.name.slice('recipe:'.length));
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return ids;
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Repeat searches cost no quota, and when the quota runs out every saved recipe can still match.
async function findRecipes(env: Env, ingredient: string, limit: number): Promise<Recipe[]> {
  const terms = [...new Set(ingredient.toLowerCase().split(',').map((t) => t.trim()).filter(Boolean))].sort();
  const searchKey = `search:${terms.join(',')}:${limit}`;
  const cachedIds = await env.RECIPES.get<string[]>(searchKey, 'json');
  if (cachedIds) {
    const cached = await loadRecipes(env, cachedIds);
    if (cached.length === cachedIds.length) return cached;
  }
  try {
    const recipes = await searchRecipes(env, terms.join(','), limit);
    await saveRecipes(env, recipes);
    await env.RECIPES.put(searchKey, JSON.stringify(recipes.map((r) => r.id)));
    return recipes;
  } catch (error) {
    const saved = await loadRecipes(env, (await savedIds(env, terms)).slice(0, limit));
    if (saved.length === 0) throw error;
    return saved;
  }
}

async function homeRecipes(env: Env, limit: number): Promise<Recipe[]> {
  // One random draw per day, so page loads don't spend quota.
  const dayKey = `random:${new Date().toISOString().slice(0, 10)}:${limit}`;
  const todaysIds = await env.RECIPES.get<string[]>(dayKey, 'json');
  if (todaysIds) {
    const today = await loadRecipes(env, todaysIds);
    if (today.length === todaysIds.length) return today;
  }
  try {
    const recipes = await randomRecipes(env, limit);
    await saveRecipes(env, recipes);
    await env.RECIPES.put(dayKey, JSON.stringify(recipes.map((r) => r.id)), { expirationTtl: 2 * 86400 });
    return recipes;
  } catch (error) {
    const saved = await loadRecipes(env, shuffled(await savedIds(env, [])).slice(0, limit));
    if (saved.length === 0) throw error;
    return saved;
  }
}

async function oneRecipe(env: Env, id: string): Promise<Recipe> {
  const saved = await env.RECIPES.get<Recipe>(`recipe:${id}`, 'json');
  if (saved) return saved;
  const details = await spoonacular<SpoonacularDetails>(env, `/recipes/${id}/information`, {
    includeNutrition: 'true'
  });
  const recipe = toRecipe(details);
  await saveRecipes(env, [recipe]);
  return recipe;
}

async function searchRecipes(env: Env, ingredients: string, limit: number): Promise<Recipe[]> {
  const matches = await spoonacular<Array<{ id: number }>>(env, '/recipes/findByIngredients', {
    ingredients,
    number: String(limit),
    ranking: '2',
    ignorePantry: 'false'
  });
  if (matches.length === 0) return [];
  // One bulk call instead of one call per recipe.
  const details = await spoonacular<SpoonacularDetails[]>(env, '/recipes/informationBulk', {
    ids: matches.map((m) => m.id).join(','),
    includeNutrition: 'true'
  });
  return details.map(toRecipe);
}

async function randomRecipes(env: Env, limit: number): Promise<Recipe[]> {
  const data = await spoonacular<{ recipes: SpoonacularDetails[] }>(env, '/recipes/random', {
    number: String(limit),
    tags: 'vegetarian,vegan',
    includeNutrition: 'true'
  });
  return data.recipes.map(toRecipe);
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);

  if (url.pathname === '/recipes') {
    const ingredient = url.searchParams.get('ingredient')?.trim().slice(0, 200) ?? '';
    const requested = Number.parseInt(url.searchParams.get('limit') ?? '6', 10);
    const limit = Number.isNaN(requested) ? 6 : Math.max(1, Math.min(MAX_LIMIT, requested));
    const recipes = ingredient ? await findRecipes(env, ingredient, limit) : await homeRecipes(env, limit);
    return json(recipes);
  }

  const match = url.pathname.match(/^\/recipes\/(\d+)$/);
  if (match) return json(await oneRecipe(env, match[1]));

  return json({ error: 'Not found' }, 404);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const allowed = env.ALLOWED_ORIGINS.split(',').includes(origin);
    const cors: Record<string, string> = allowed
      ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
      : {};

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET' } });
    }

    let response: Response;
    try {
      response = await route(request, env);
    } catch (error) {
      // The client falls back to Firestore on any failure, quota included.
      console.error(error);
      response = json({ error: 'Recipe service unavailable' }, 502);
    }
    for (const [key, value] of Object.entries(cors)) response.headers.set(key, value);
    return response;
  }
};
