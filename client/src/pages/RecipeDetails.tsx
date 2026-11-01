import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Recipe } from '../types';
import { addFavorite, getFavorites, getRecipe } from '../api';

const RecipeDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        if (!id) return;
        setRecipe(await getRecipe(id));

        if (user) {
          const favorites = await getFavorites(user.uid);
          setIsFavorited(favorites.some((fav) => fav.recipeId === id));
        }

      } catch (error) {
        console.error('Error fetching recipe:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id, user]);

  const handleAddToFavorites = async () => {
    if (!user) {
      signInWithGoogle();
      return;
    }

    if (isFavorited || !recipe) {
      return;
    }

    try {
      await addFavorite(user.uid, recipe);
      setIsFavorited(true);
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  if (loading) return <p>Loading recipe...</p>;
  if (!recipe) return <p>Recipe not found</p>;

  return (
    <div className="recipe-details-page">
      <button onClick={() => navigate(-1)} className="back-button">
        ← Back
      </button>

      <div className="recipe-header">
        <img src={recipe.imageUrl} alt={recipe.name} />
        <div className="recipe-info">
          <h1>{recipe.name}</h1>
          <div className="eco-score-large">
            Eco-Score: {recipe.ecoScore}/10
            <span className="eco-explanation">
              {recipe.ecoScore <= 3 && '🌿 Low environmental impact!'}
              {recipe.ecoScore > 3 && recipe.ecoScore <= 6 && '🌾 Moderate impact'}
              {recipe.ecoScore > 6 && '🥩 Higher impact'}
            </span>
          </div>
          <button
            onClick={handleAddToFavorites}
            className="favorite-button"
            disabled={isFavorited}
          >
            {isFavorited ? '✓ Already Favorited' : user ? '❤️ Add to Favorites' : '🔒 Sign in to Favorite'}
          </button>
        </div>
      </div>

      <div className="recipe-content">
        <div className="ingredients-section">
          <h2>Ingredients</h2>
          <ul>
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>

        <div className="instructions-section">
          <h2>Instructions</h2>
          <p>{recipe.instructions}</p>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetails;