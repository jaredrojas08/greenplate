import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Favorite, Recipe } from '../types';

const Profile = () => {
  const { user, signInWithGoogle } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const favResponse = await fetch(`http://localhost:8080/favorites?userId=${user.uid}`);
        const favData = await favResponse.json();
        setFavorites(favData);

        const recipeResponse = await fetch('http://localhost:8080/recipes');
        const recipeData = await recipeResponse.json();
        setRecipes(recipeData);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/favorites/${favoriteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFavorites(favorites.filter(fav => fav.id !== favoriteId));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const getFavoriteRecipes = () => {
    return favorites.map(favorite => {
      const recipe = recipes.find(r => r.id === favorite.recipeId);
      return { favorite, recipe };
    }).filter(item => item.recipe !== undefined);
  };

  if (loading) return <p>Loading profile...</p>;

  if (!user) {
    return (
      <div className="profile-page">
        <h1>My Profile</h1>
        <div className="user-info">
          <p>Please sign in to view your profile and favorites.</p>
          <button onClick={signInWithGoogle} className="auth-button">
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  const favoriteRecipes = getFavoriteRecipes();

  return (
    <div className="profile-page">
      <h1>My Profile</h1>

      <div className="user-info">
        <h2>Welcome, {user.displayName || 'User'}!</h2>
        <p>Email: {user.email}</p>
      </div>

      <div className="favorites-section">
        <h2>My Favorite Recipes ({favoriteRecipes.length})</h2>

        {favoriteRecipes.length === 0 ? (
          <p>No favorites yet. Start exploring recipes!</p>
        ) : (
          <div className="favorites-grid">
            {favoriteRecipes.map(({ favorite, recipe }) => (
              <div key={favorite.id} className="favorite-card">
                <Link to={`/recipe/${recipe!.id}`}>
                  <img src={recipe!.imageUrl} alt={recipe!.name} />
                  <h3>{recipe!.name}</h3>
                  <p>Eco-Score: {recipe!.ecoScore}/10</p>
                </Link>
                <button
                  onClick={() => handleRemoveFavorite(favorite.id)}
                  className="remove-button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;