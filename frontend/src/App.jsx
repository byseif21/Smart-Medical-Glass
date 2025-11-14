import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import RecognitionPage from './pages/RecognitionPage';
import './styles/glassmorphism.css';

function App() {
  return (
    <Router>
      <div className="animated-gradient-bg min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/recognize" element={<RecognitionPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
