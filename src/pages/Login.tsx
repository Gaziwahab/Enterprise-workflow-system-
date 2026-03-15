import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, Briefcase, ArrowLeft } from 'lucide-react';
import { signInWithGoogle } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  React.useEffect(() => {
    if (user && profile && !loading) {
      navigate('/dashboard');
    }
  }, [user, profile, loading, navigate]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      // Navigation is handled by the useEffect above
    } catch (error) {
      console.error('Failed to log in', error);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden">
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium z-10"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Home
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="clay-card p-8 sm:p-10 text-center">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Briefcase className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">WorkSync</h1>
            <p className="text-slate-500 dark:text-slate-400 text-center font-medium">
              Modern Workflow & Task Handover Management
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full clay-btn-secondary py-4 flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
            Continue with Google
          </button>

          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
            <p>For college teams & small organizations</p>
          </div>
        </div>
      </motion.div>

      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-red-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-rose-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      </div>
    </div>
  );
}
