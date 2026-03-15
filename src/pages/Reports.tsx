import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { FileText, Clock, User, CheckCircle2, XCircle, PlayCircle, Send, AlertCircle } from 'lucide-react';

interface HistoryItem {
  id: string;
  taskId: string;
  taskTitle: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: any;
  details?: string;
}

export default function Reports() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [userFilter, setUserFilter] = useState('All');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'history'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribeHistory = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HistoryItem[];
      setHistory(historyData);
      setLoading(false);
    });

    const unsubscribeUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      const us: any[] = [];
      snapshot.forEach((doc) => us.push({ id: doc.id, ...doc.data() }));
      setUsers(us);
    });

    return () => {
      unsubscribeHistory();
      unsubscribeUsers();
    };
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Created': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'Assigned': return <User className="w-5 h-5 text-indigo-500" />;
      case 'In Progress': return <PlayCircle className="w-5 h-5 text-amber-500" />;
      case 'Submitted': return <Send className="w-5 h-5 text-purple-500" />;
      case 'Approved': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'Rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'Completed': return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      default: return <AlertCircle className="w-5 h-5 text-slate-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Created': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Assigned': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'In Progress': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Submitted': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const filteredHistory = history.filter(item => {
    if (filter !== 'All' && item.action !== filter) return false;
    if (userFilter !== 'All' && item.userId !== userFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">History Reports</h1>
          <p className="text-slate-500 dark:text-slate-400">View recent activity across all workflows and tasks.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-red-500 outline-none"
          >
            <option value="All">All Users</option>
            {users.map(u => (
              <option key={u.uid} value={u.uid}>{u.displayName || u.email}</option>
            ))}
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-red-500 outline-none"
          >
            <option value="All">All Actions</option>
            <option value="Created">Created</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Completed">Completed</option>
            <option value="Document Uploaded">Document Uploaded</option>
            <option value="Comment Added">Comment Added</option>
          </select>
        </div>
      </div>

      <div className="clay-card p-6">
        <div className="space-y-6">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No activity history found.</p>
            </div>
          ) : (
            <div className="relative border-l border-slate-200 dark:border-slate-700 ml-4 space-y-8">
              {filteredHistory.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative pl-8"
                >
                  <div className="absolute -left-3.5 top-1 w-7 h-7 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                    {getActionIcon(item.action)}
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.userName}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-sm">
                          updated task
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {item.taskTitle}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getActionColor(item.action)}`}>
                        {item.action}
                      </span>
                      {item.details && (
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {item.details}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
