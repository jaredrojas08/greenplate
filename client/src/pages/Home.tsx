import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Recipe } from '../types';
import { getRecipes } from '../api';

const Home = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [searchIngredient, setSearchIngredient] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ecoFilter, setEcoFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [currentLimit, setCurrentLimit] = useState(6);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
  setSearchIngredient('');
  fetchRecipes();
}, []);

  const fetchRecipes = async (ingredient?: string, limit: number = 6) => {
    setLoading(true);
    setCurrentLimit(6);
    try {
      const data = await getRecipes(ingredient ?? '', limit);
      setAllRecipes(data);
      setRecipes(data);
      setEcoFilter('all'); 
      setHasMore(data.length >= limit); 
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreRecipes = async () => {
    setLoadingMore(true);
    const newLimit = currentLimit + 6;
    try {
      const data = await getRecipes(searchIngredient, newLimit);
      setAllRecipes(data);
      setRecipes(data);
      setCurrentLimit(newLimit);
      setHasMore(data.length >= newLimit);
    } catch (error) {
      console.error('Error loading more recipes:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const filterByEcoScore = (filter: 'all' | 'low' | 'medium' | 'high') => {
    setEcoFilter(filter);

    if (filter === 'all') {
      setRecipes(allRecipes);
    } else if (filter === 'low') {
      setRecipes(allRecipes.filter(r => r.ecoScore <= 3));
    } else if (filter === 'medium') {
      setRecipes(allRecipes.filter(r => r.ecoScore > 3 && r.ecoScore <= 6));
    } else if (filter === 'high') {
      setRecipes(allRecipes.filter(r => r.ecoScore > 6));
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

      <div className="filter-section">
        <p>Filter by Environmental Impact:</p>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${ecoFilter === 'all' ? 'active' : ''}`}
            onClick={() => filterByEcoScore('all')}
          >
            All Recipes
          </button>
          <button
            className={`filter-btn low ${ecoFilter === 'low' ? 'active' : ''}`}
            onClick={() => filterByEcoScore('low')}
          >
            🌿 Low Impact (1-3)
          </button>
          <button
            className={`filter-btn medium ${ecoFilter === 'medium' ? 'active' : ''}`}
            onClick={() => filterByEcoScore('medium')}
          >
            🌾 Medium Impact (4-6)
          </button>
          <button
            className={`filter-btn high ${ecoFilter === 'high' ? 'active' : ''}`}
            onClick={() => filterByEcoScore('high')}
          >
            🥩 High Impact (7-10)
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading recipes...</p>
      ) : recipes.length === 0 ? (
        <p className="no-results">No recipes found with the selected filter. Try a different one!</p>
      ) : (
        <>
          <div className="recipes-grid">
            {recipes.map((recipe) => (
              <Link to={`/recipe/${recipe.id}`} key={recipe.id} className="recipe-card">
                <img src={recipe.imageUrl} alt={recipe.name} />
                <h3>{recipe.name}</h3>
                <div className="eco-score" style={{ backgroundColor: getEcoScoreColor(recipe.ecoScore), color: 'white' }}>
                  Eco-Score: {recipe.ecoScore}/10
                </div>
                <p className="ingredients">
                  {recipe.ingredients.slice(0, 3).join(', ')}
                  {recipe.ingredients.length > 3 && '...'}
                </p>
              </Link>
            ))}
          </div>

          {hasMore && ecoFilter === 'all' && (
            <div className="load-more-section">
              <button
                onClick={loadMoreRecipes}
                disabled={loadingMore}
                className="load-more-button"
              >
                {loadingMore ? 'Loading...' : 'Load More Recipes'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;