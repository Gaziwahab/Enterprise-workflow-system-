import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;

    let q = query(collection(db, 'tasks'));
    
    if (profile.role === 'employee') {
      q = query(collection(db, 'tasks'), where('assignedTo', 'array-contains', profile.uid));
    } else if (profile.role === 'manager') {
      // Managers see tasks they created or all tasks depending on business logic. 
      // Let's show all tasks for simplicity in this demo, or tasks they created.
      // We'll just fetch all tasks for admin/manager for the dashboard overview.
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      let completed = 0;
      let pending = 0;
      let inProgress = 0;
      const tasks: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        total++;
        if (data.status === 'Completed') completed++;
        else if (data.status === 'Pending') pending++;
        else if (data.status === 'In Progress') inProgress++;
        
        tasks.push({ id: doc.id, ...data });
      });

      setStats({ total, completed, pending, inProgress });
      
      // Sort by updatedAt descending
      tasks.sort((a, b) => b.updatedAt?.toMillis() - a.updatedAt?.toMillis());
      setRecentTasks(tasks.slice(0, 5));
    });

    return () => unsubscribe();
  }, [profile]);

  const chartData = [
    { name: 'Pending', count: stats.pending },
    { name: 'In Progress', count: stats.inProgress },
    { name: 'Completed', count: stats.completed },
  ];

  const statCards = [
    { title: 'Total Tasks', value: stats.total, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { title: 'Pending', value: stats.pending, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, {profile?.displayName || 'User'}!</h1>
          <p className="text-slate-500 dark:text-slate-400">Here's what's happening with your projects today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="clay-card p-6 flex items-center gap-4"
          >
            <div className={`p-4 rounded-xl ${stat.bg} shadow-inner`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 clay-card p-6"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Task Overview</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(220, 38, 38, 0.1)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="count" fill="#dc2626" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="clay-card p-6 flex flex-col"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {recentTasks.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-center py-8">No recent tasks found.</p>
            ) : (
              recentTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                    task.status === 'Completed' ? 'bg-emerald-500' :
                    task.status === 'In Progress' ? 'bg-amber-500' :
                    task.status === 'Pending' ? 'bg-rose-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{task.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {task.status} • {task.updatedAt?.toDate().toLocaleDateString() || 'Just now'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
