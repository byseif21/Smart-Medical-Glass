import RegisterForm from '../components/RegisterForm';
import '../styles/glassmorphism.css';

const RegisterPage = () => {
  return (
    <div className="min-h-screen animated-gradient-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="neon-gradient-text">Face Registration</span>
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Register your face with the Smart Glass AI system. Upload a clear photo of your face and
            provide your information to get started.
          </p>
        </div>

        {/* Registration Form */}
        <RegisterForm />

        {/* Instructions */}
        <div className="glass-card mt-8 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Registration Tips:</h3>
          <ul className="text-white/80 space-y-2">
            <li className="flex items-start">
              <span className="text-pink-500 mr-2">•</span>
              <span>Use a clear, well-lit photo of your face</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Make sure your face is clearly visible and centered</span>
            </li>
            <li className="flex items-start">
              <span className="text-pink-500 mr-2">•</span>
              <span>Avoid wearing sunglasses or face coverings</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Supported formats: JPEG, PNG (max 5MB)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
