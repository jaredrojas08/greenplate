import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Favorite } from '../types';
import { getFavorites, removeFavorite } from '../api';

const Profile = () => {
  const { user, signInWithGoogle } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setFavorites(await getFavorites(user.uid));
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
      await removeFavorite(favoriteId);
      setFavorites(favorites.filter(fav => fav.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
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

  // Filter out favorites that don't have recipe data 
  const validFavorites = favorites.filter(fav => fav.recipe !== undefined);

  return (
    <div className="profile-page">
      <h1>My Profile</h1>

      <div className="user-info">
        <h2>Welcome, {user.displayName || 'User'}!</h2>
        <p>Email: {user.email}</p>
      </div>

      <div className="favorites-section">
        <h2>My Favorite Recipes ({validFavorites.length})</h2>

        {validFavorites.length === 0 ? (
          <p>No favorites yet. Start exploring recipes!</p>
        ) : (
          <div className="favorites-grid">
            {validFavorites.map((favorite) => (
              <div key={favorite.id} className="favorite-card">
                <Link to={`/recipe/${favorite.recipe!.id}`}>
                  <img src={favorite.recipe!.imageUrl} alt={favorite.recipe!.name} />
                  <h3>{favorite.recipe!.name}</h3>
                  <p>Eco-Score: {favorite.recipe!.ecoScore}/10</p>
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