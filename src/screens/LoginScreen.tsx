import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Mail, Lock, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorProps, setErrorProps] = useState<{ message: string; code?: string } | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorProps(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/home');
    } catch (err: any) {
      setErrorProps({ message: err.message, code: err.code });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorProps(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/home');
    } catch (err: any) {
      setErrorProps({ message: err.message, code: err.code });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen px-6 py-12 flex flex-col justify-center">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md mx-auto w-full"
      >
        <h2 className="font-display font-bold text-4xl mb-2">Welcome Back</h2>
        <p className="text-text-secondary mb-8">Sign in to continue your journey</p>

        {errorProps && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6 text-sm">
            {errorProps.code === 'auth/operation-not-allowed' ? (
              <div className="space-y-2">
                <p className="font-bold">Login Method Disabled</p>
                <p>Email/Password or Google login is not enabled in your Firebase project.</p>
                <a 
                  href="https://console.firebase.google.com/project/gen-lang-client-0322053334/authentication/providers" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline mt-2"
                >
                  Enable in Console <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              errorProps.message
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
            <input
              type="email"
              placeholder="Email Address"
              className="nox-input w-full pl-12"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
            <input
              type="password"
              placeholder="Password"
              className="nox-input w-full pl-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="nox-button w-full flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-text-secondary">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-black font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <img src="https://www.gstatic.com/firebase/anonymous-app/png/google.png" className="w-5 h-5" alt="Google" />
          Continue with Google
        </button>

        <p className="text-center mt-8 text-text-secondary">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary font-semibold">
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
