import { Link } from 'react-router-dom';
import '../styles/glassmorphism.css';

const HomePage = () => {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="glass-container text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            <span className="neon-gradient-text">Smart Glass AI</span>
          </h1>
          <p className="text-white/90 text-xl md:text-2xl mb-4">
            Next-Generation Face Recognition System
          </p>
          <p className="text-white/70 text-lg max-w-3xl mx-auto mb-8">
            Experience the future of identity verification with our AI-powered smart glass
            technology. Register your face once and get recognized instantly.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Link to="/register" className="neon-button text-lg px-8 py-4 inline-block">
              Register Your Face
            </Link>
            <Link to="/recognize" className="glass-button text-lg px-8 py-4 inline-block">
              Test Recognition
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Feature 1 */}
          <div className="glass-card p-6 hover-lift">
            <div className="text-4xl mb-4 text-center">🎯</div>
            <h3 className="text-xl font-semibold text-white mb-3 text-center">
              Accurate Recognition
            </h3>
            <p className="text-white/70 text-center">
              Advanced AI algorithms ensure high accuracy in face detection and matching with
              confidence scoring.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card p-6 hover-lift">
            <div className="text-4xl mb-4 text-center">⚡</div>
            <h3 className="text-xl font-semibold text-white mb-3 text-center">
              Lightning Fast
            </h3>
            <p className="text-white/70 text-center">
              Real-time face recognition processing delivers instant results in milliseconds.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card p-6 hover-lift">
            <div className="text-4xl mb-4 text-center">🔒</div>
            <h3 className="text-xl font-semibold text-white mb-3 text-center">
              Secure & Private
            </h3>
            <p className="text-white/70 text-center">
              Your facial data is encrypted and securely stored with enterprise-grade security.
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="glass-container mb-12">
          <h2 className="text-4xl font-bold text-center mb-8">
            <span className="neon-gradient-text">How It Works</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 flex items-center justify-center text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Register</h3>
              <p className="text-white/70">
                Upload a clear photo of your face along with your personal information.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 flex items-center justify-center text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Process</h3>
              <p className="text-white/70">
                Our AI extracts unique facial features and securely stores your profile.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 flex items-center justify-center text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Recognize</h3>
              <p className="text-white/70">
                Test the system by uploading any photo and get instant recognition results.
              </p>
            </div>
          </div>
        </div>

        {/* Tech Stack Section */}
        <div className="glass-card p-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            <span className="neon-gradient-text">Powered By Advanced Technology</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-4 text-white/80">
            <span className="px-4 py-2 glass-card text-sm">React</span>
            <span className="px-4 py-2 glass-card text-sm">FastAPI</span>
            <span className="px-4 py-2 glass-card text-sm">OpenCV</span>
            <span className="px-4 py-2 glass-card text-sm">Face Recognition AI</span>
            <span className="px-4 py-2 glass-card text-sm">Supabase</span>
            <span className="px-4 py-2 glass-card text-sm">TailwindCSS</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
