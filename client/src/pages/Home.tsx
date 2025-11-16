import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Recipe } from '../types';

const Home = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchIngredient, setSearchIngredient] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  setSearchIngredient('');
  fetchRecipes();
}, []);

  const fetchRecipes = async (ingredient?: string) => {
    setLoading(true);
    try {
      const url = ingredient 
        ? `http://localhost:8080/recipes?ingredient=${ingredient}`
        : 'http://localhost:8080/recipes';
      
      const response = await fetch(url);
      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecipes(searchIngredient);
  };

  const getEcoScoreColor = (score: number) => {
    if (score <= 3) return '#2d5016';
    if (score <= 6) return '#ff9800';
    return '#d32f2f';
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1 className="hero-title">
            <span className="plant-emoji">🌿</span>
                Find Sustainable Recipes
            <span className="plant-emoji">🌿</span>
        </h1>
        <p>Discover delicious recipes and their environmental impact</p>
        <form onSubmit={handleSearch} className="search-form">
            <input
                type="text"
                placeholder="Search by ingredients (e.g., pasta, tomatoes, basil)"
                value={searchIngredient}
                onChange={(e) => setSearchIngredient(e.target.value)}
            />
            <button type="submit">Search</button>
                {searchIngredient && (
            <button 
                type="button" 
                onClick={() => {
                setSearchIngredient('');
                fetchRecipes();
            }}
        className="clear-button"
            >
            Clear
            </button>
        )}
        </form>
      </div>

      {loading ? (
        <p>Loading recipes...</p>
      ) : (
        <div className="recipes-grid">
          {recipes.map((recipe) => (
            <Link to={`/recipe/${recipe.id}`} key={recipe.id} className="recipe-card">
              <img src={recipe.imageUrl} alt={recipe.name} />
              <h3>{recipe.name}</h3>
              <div className="eco-score" style={{ color: getEcoScoreColor(recipe.ecoScore) }}>
                Eco-Score: {recipe.ecoScore}/10
              </div>
              <p className="ingredients">
                {recipe.ingredients.slice(0, 3).join(', ')}
                {recipe.ingredients.length > 3 && '...'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;