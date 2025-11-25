import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import RecipeDetails from './pages/RecipeDetails';
import Profile from './pages/Profile';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

function Navigation() {
  const { user, signInWithGoogle, signOut } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <h1>🌱 GreenPlate</h1>
      </Link>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/profile">Profile</Link>
        {user ? (
          <button onClick={signOut} className="auth-button">
            Sign Out
          </button>
        ) : (
          <button onClick={signInWithGoogle} className="auth-button">
            Sign In with Google
          </button>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navigation />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recipe/:id" element={<RecipeDetails />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;