import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Recipe, Favorite } from '../types';

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
        const response = await fetch(`http://localhost:8080/recipes/${id}`);
        if (response.ok) {
          const data = await response.json();
          setRecipe(data);
        }

        if (user) {
          const favResponse = await fetch(`http://localhost:8080/favorites?userId=${user.uid}`);
          const favorites = await favResponse.json();
          const alreadyFavorited = favorites.some((fav: Favorite) => fav.recipeId === id);
          setIsFavorited(alreadyFavorited);
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

    if (isFavorited) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          recipeId: id,
        }),
      });

      if (response.ok) {
        setIsFavorited(true);
      }
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
          <p dangerouslySetInnerHTML={{ __html: recipe.instructions }}></p>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetails;