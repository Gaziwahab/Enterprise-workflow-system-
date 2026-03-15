import React from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, CheckCircle2, Zap, Shield, Users } from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-red-500" />,
      title: "Lightning Fast Workflows",
      description: "Create, assign, and track tasks in real-time with our optimized engine."
    },
    {
      icon: <Users className="w-6 h-6 text-emerald-500" />,
      title: "Seamless Collaboration",
      description: "Keep your entire team on the same page with instant updates and notifications."
    },
    {
      icon: <Shield className="w-6 h-6 text-rose-500" />,
      title: "Enterprise Security",
      description: "Bank-grade security and role-based access control out of the box."
    }
  ];

  return (
    <div className="min-h-screen bg-mesh overflow-hidden flex flex-col">
      {/* Navigation */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400">
            WorkSync
          </span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <button onClick={handleGetStarted} className="clay-btn-primary px-6 py-2.5">
              Go to Dashboard
            </button>
          ) : (
            <Link to="/login" className="clay-btn-primary px-6 py-2.5">
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-24 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-white/20 dark:border-slate-700/50 shadow-sm text-sm font-medium text-red-600 dark:text-red-400 mb-4"
          >
            <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
            Introducing WorkSync 2.0
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Manage your team's work <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 dark:from-red-500 dark:via-rose-500 dark:to-orange-500">
              like never before.
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            The ultimate workflow and task handover management system designed for high-performing teams. Experience the future of collaboration.
          </p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button 
              onClick={handleGetStarted}
              className="clay-btn-primary px-8 py-4 text-lg w-full sm:w-auto flex items-center justify-center gap-2 group"
            >
              {user ? 'Open Dashboard' : 'Get Started Free'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="clay-btn-secondary px-8 py-4 text-lg w-full sm:w-auto">
              View Demo
            </button>
          </motion.div>
        </motion.div>

        {/* Floating Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 100, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.5, duration: 1, type: "spring", bounce: 0.4 }}
          className="w-full max-w-5xl mx-auto mt-20 relative perspective-1000 z-20"
        >
          <div className="clay-card p-2 sm:p-4 rounded-[2.5rem] bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 shadow-2xl transform-gpu hover:rotate-x-2 hover:rotate-y-2 transition-transform duration-500">
            <div className="bg-slate-100 dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-700/50">
              {/* Mockup Header */}
              <div className="h-12 bg-white/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="mx-auto h-6 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              </div>
              {/* Mockup Body */}
              <div className="p-6 grid grid-cols-4 gap-6 h-[400px]">
                {/* Sidebar */}
                <div className="col-span-1 space-y-4 hidden sm:block">
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4"></div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-5/6"></div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div>
                </div>
                {/* Main Content */}
                <div className="col-span-4 sm:col-span-3 space-y-6">
                  <div className="flex gap-4">
                    <div className="h-24 bg-red-100 dark:bg-red-900/30 rounded-2xl flex-1 border border-red-200 dark:border-red-800/50"></div>
                    <div className="h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex-1 border border-emerald-200 dark:border-emerald-800/50"></div>
                    <div className="h-24 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex-1 border border-amber-200 dark:border-amber-800/50"></div>
                  </div>
                  <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating elements around mockup */}
          <motion.div 
            animate={{ y: [0, -20, 0] }} 
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -top-10 -right-10 w-24 h-24 clay-card rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur flex items-center justify-center shadow-xl hidden md:flex"
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-500" />
          </motion.div>
          <motion.div 
            animate={{ y: [0, 20, 0] }} 
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-10 -left-10 w-20 h-20 clay-card rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur flex items-center justify-center shadow-xl hidden md:flex"
          >
            <Zap className="w-8 h-8 text-amber-600 dark:text-amber-500" />
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-32 w-full z-10"
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              whileHover={{ y: -10 }}
              className="clay-card p-8 flex flex-col items-center text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-inner mb-2">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{feature.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-red-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-rose-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-80 h-80 bg-orange-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );
}
