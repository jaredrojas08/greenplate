export type Recipe = {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string;
  ecoScore: number;
  imageUrl?: string;
};

export type Favorite = {
  id: string;
  userId: string;
  recipeId: string;
  addedAt: string;
  recipe?: Recipe;
};