import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ScanFace,
  ShieldCheck,
  Zap,
  Database,
  ArrowRight,
  CheckCircle2,
  Lock,
  Activity,
  Globe,
  Cpu,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

const HomePage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-medical-primary/20">
      {/* Navigation */}
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-medical-primary to-medical-secondary flex items-center justify-center text-white shadow-lg shadow-medical-primary/30">
              <ScanFace className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Smart<span className="text-medical-primary">Glass</span>
            </span>
          </div>

          <div className="max-md:hidden flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 hover:text-medical-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#security"
              className="text-sm font-medium text-slate-600 hover:text-medical-primary transition-colors"
            >
              Security
            </a>
            <a
              href="#api"
              className="text-sm font-medium text-slate-600 hover:text-medical-primary transition-colors"
            >
              API
            </a>
            <div className="h-4 w-px bg-slate-200"></div>
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-medical-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all hover:shadow-lg hover:shadow-slate-900/20 active:scale-95"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl p-6 md:hidden flex flex-col gap-4 animate-fade-in">
            <a
              href="#features"
              className="text-lg font-medium text-slate-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#security"
              className="text-lg font-medium text-slate-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Security
            </a>
            <a
              href="#api"
              className="text-lg font-medium text-slate-600"
              onClick={() => setIsMenuOpen(false)}
            >
              API
            </a>
            <hr className="border-slate-100" />
            <Link
              to="/login"
              className="text-lg font-medium text-slate-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-medical-primary/5 rounded-full blur-[100px] mix-blend-multiply animate-pulse" />
          <div className="absolute top-40 -left-20 w-[500px] h-[500px] bg-medical-secondary/5 rounded-full blur-[100px] mix-blend-multiply animate-pulse delay-700" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 mb-8 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-medical-accent animate-pulse"></span>
                v2.0 is now live
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
                Identity verification <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-medical-primary to-medical-secondary">
                  reimagined.
                </span>
              </h1>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-lg">
                Enterprise-grade facial recognition infrastructure. Secure, scalable, and
                privacy-first authentication for the modern web.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex justify-center items-center gap-2 px-8 py-4 rounded-full bg-medical-primary text-white font-semibold hover:bg-medical-dark transition-all hover:shadow-xl hover:shadow-medical-primary/20 active:scale-95"
                >
                  Start Building
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/recognize"
                  className="inline-flex justify-center items-center gap-2 px-8 py-4 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                >
                  View Demo
                </Link>
              </div>

              <div className="mt-12 flex items-center gap-8 text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-accent" />
                  <span>99.9% Accuracy</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-accent" />
                  <span>SOC2 Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-accent" />
                  <span>Real-time Processing</span>
                </div>
              </div>
            </div>

            {/* Mock UI */}
            <div className="relative lg:h-[600px] flex items-center justify-center mt-12 lg:mt-0">
              <div className="relative w-full max-w-md aspect-[4/5] bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
                {/* Screen Header */}
                <div className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500/80"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/80"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur text-[10px] text-white/70 font-mono border border-white/5">
                    SECURE_CONNECTION
                  </div>
                </div>

                {/* Main Visual */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                  <div className="w-full aspect-square relative mb-8">
                    {/* Scanning Animation */}
                    <div className="absolute inset-0 rounded-2xl border border-medical-primary/30 overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-medical-primary shadow-[0_0_20px_rgba(8,145,178,0.8)] animate-[scan_4s_cubic-bezier(0.4,0,0.2,1)_infinite]" />
                    </div>

                    {/* Face Grid */}
                    <div className="absolute inset-4 grid grid-cols-4 grid-rows-4 gap-4 opacity-20">
                      {[...Array(16)].map((_, i) => (
                        <div
                          key={i}
                          className="border-[0.5px] border-medical-primary/50 rounded-sm"
                        ></div>
                      ))}
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <ScanFace className="w-24 h-24 text-medical-primary animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-4 w-full">
                    <div className="h-2 w-2/3 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-medical-primary animate-progress-load"></div>
                    </div>
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>VERIFYING IDENTITY...</span>
                      <span className="text-medical-primary">PROCESSING</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm mt-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">Match Confirmed</div>
                          <div className="text-xs text-slate-400">ID: 8829-XJ-92</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-medical-primary/10 to-transparent pointer-events-none" />
              </div>

              {/* Floating Cards */}
              <div className="absolute top-20 -right-8 p-4 rounded-2xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100 animate-floating-card md:block z-10">
                <Activity className="w-6 h-6 text-orange-500 mb-2" />
                <div className="text-xs font-semibold text-slate-900">Live Detection</div>
                <div className="text-[10px] text-slate-500">Active Monitoring</div>
              </div>

              <div className="absolute bottom-40 -left-12 p-4 rounded-2xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100 animate-floating-card-delayed md:block z-10">
                <ShieldCheck className="w-6 h-6 text-medical-primary mb-2" />
                <div className="text-xs font-semibold text-slate-900">Enterprise-Grade</div>
                <div className="text-[10px] text-slate-500">AES-256 Encrypted</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-semibold text-slate-500 mb-8 uppercase tracking-wider">
            Trusted by industry leaders
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Simple Text Logos for demo */}
            {['Acme Corp', 'GlobalBank', 'HealthPlus', 'SecureNet', 'FutureID'].map((name) => (
              <span
                key={name}
                className="text-xl font-bold text-slate-400 hover:text-slate-800 cursor-default transition-colors"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Everything you need for secure identity
            </h2>
            <p className="text-slate-600">
              Powerful features built for developers, designed for security teams.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6 text-yellow-500" />,
                title: 'Lightning Fast',
                desc: 'Sub-100ms response times globally. Optimized for high-throughput applications.',
              },
              {
                icon: <Lock className="w-6 h-6 text-medical-primary" />,
                title: 'Privacy First',
                desc: 'Encrypted Biometric Storage. Templates are securely stored with role-based access control.',
              },
              {
                icon: <Database className="w-6 h-6 text-purple-500" />,
                title: 'Easy Integration',
                desc: 'Restful API and SDKs for React, Python, and Node.js. Get up and running in minutes.',
              },
              {
                icon: <Globe className="w-6 h-6 text-blue-500" />,
                title: 'Global Compliance',
                desc: 'GDPR, CCPA, and SOC2 compliant. Built to meet international regulatory standards.',
              },
              {
                icon: <Cpu className="w-6 h-6 text-red-500" />,
                title: 'AI Powered',
                desc: 'Next-gen neural networks that adapt to lighting, aging, and accessories.',
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-green-500" />,
                title: 'Fraud Prevention',
                desc: 'Intelligent Quality Assurance checks image integrity to prevent basic spoofing attempts.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark Section (Developer Focused) */}
      <section id="api" className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Built for Developers</h2>
              <p className="text-slate-400 mb-8 text-lg">
                Simple, intuitive APIs that stay out of your way. Integration takes minutes, not
                weeks.
              </p>

              <div className="space-y-6">
                {[
                  'RESTful API endpoints',
                  'Webhooks for real-time events',
                  'Comprehensive documentation',
                  '99.99% Uptime SLA',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-medical-primary/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-medical-primary" />
                    </div>
                    <span className="font-medium text-slate-200">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Link
                  to="/docs"
                  className="text-medical-primary hover:text-medical-secondary font-semibold flex items-center gap-2"
                >
                  Read Documentation <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-6 font-mono text-sm shadow-2xl">
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              </div>
              <div className="space-y-2 text-slate-300">
                <p>
                  <span className="text-purple-400">const</span>{' '}
                  <span className="text-blue-400">verifyUser</span>{' '}
                  <span className="text-purple-400">=</span>{' '}
                  <span className="text-purple-400">async</span> (image){' '}
                  <span className="text-purple-400">=&gt;</span> {'{'}
                </p>
                <p className="pl-4">
                  <span className="text-purple-400">const</span> response{' '}
                  <span className="text-purple-400">=</span>{' '}
                  <span className="text-purple-400">await</span> api.
                  <span className="text-blue-400">post</span>(
                  <span className="text-green-400">&apos;/verify&apos;</span>, {'{'}
                </p>
                <p className="pl-8">image: image,</p>
                <p className="pl-8">
                  threshold: <span className="text-orange-400">0.95</span>
                </p>
                <p className="pl-4">{'}'});</p>
                <p className="pl-4"></p>
                <p className="pl-4">
                  <span className="text-purple-400">return</span> response.data;
                </p>
                <p>{'}'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">Ready to get started?</h2>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Join thousands of developers building the future of secure identity verification.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-4 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
            >
              Create Free Account
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-medical-primary flex items-center justify-center text-white">
                  <ScanFace className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold text-slate-900">SmartGlass</span>
              </div>
              <p className="text-slate-500 text-sm">
                Next-generation biometric infrastructure for the modern world.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    Security
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-medical-primary transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">© 2024 SmartGlass Inc. All rights reserved.</p>
            <div className="flex gap-4">
              {/* Social icons placeholders */}
              <div className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors cursor-pointer"></div>
              <div className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors cursor-pointer"></div>
              <div className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors cursor-pointer"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
