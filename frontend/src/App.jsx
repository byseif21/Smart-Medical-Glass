import { BrowserRouter as Router } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="animated-gradient-bg min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="glass-container max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold neon-gradient-text mb-4">Smart Glass AI</h1>
            <p className="text-gray-300 text-lg">Face Recognition System</p>
            <div className="mt-8 p-6 glass-card">
              <p className="text-white">
                Welcome to Smart Glass AI - Your intelligent face recognition system
              </p>
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
