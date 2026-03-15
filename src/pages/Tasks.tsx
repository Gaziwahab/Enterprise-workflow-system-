import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, CheckCircle2, Clock, AlertCircle, MoreVertical, X, FileText, MessageSquare, Upload } from 'lucide-react';

export default function Tasks() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [newComment, setNewComment] = useState('');
  const [filter, setFilter] = useState('All');
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    workflowId: '',
    assignedTo: [] as string[],
    deadline: '',
    priority: 'Medium',
  });

  useEffect(() => {
    if (!profile) return;

    let q = query(collection(db, 'tasks'));
    if (profile.role === 'employee') {
      q = query(collection(db, 'tasks'), where('assignedTo', 'array-contains', profile.uid));
    }

    const unsubscribeTasks = onSnapshot(q, (snapshot) => {
      const ts: any[] = [];
      snapshot.forEach((doc) => ts.push({ id: doc.id, ...doc.data() }));
      setTasks(ts);
    });

    const unsubscribeWorkflows = onSnapshot(query(collection(db, 'workflows')), (snapshot) => {
      const wfs: any[] = [];
      snapshot.forEach((doc) => wfs.push({ id: doc.id, ...doc.data() }));
      setWorkflows(wfs);
    });

    const unsubscribeUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      const us: any[] = [];
      snapshot.forEach((doc) => us.push({ id: doc.id, ...doc.data() }));
      setUsers(us);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeWorkflows();
      unsubscribeUsers();
    };
  }, [profile]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.workflowId || newTask.assignedTo.length === 0) return;

    try {
      const taskRef = await addDoc(collection(db, 'tasks'), {
        title: newTask.title,
        description: newTask.description,
        workflowId: newTask.workflowId,
        currentStepIndex: 0,
        status: 'Pending',
        priority: newTask.priority,
        assignedTo: newTask.assignedTo,
        deadline: newTask.deadline ? new Date(newTask.deadline) : null,
        createdBy: profile?.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        documents: [],
        comments: [],
      });

      // Also add to history
      await addDoc(collection(db, 'history'), {
        taskId: taskRef.id,
        taskTitle: newTask.title,
        action: 'Created',
        userId: profile?.uid,
        userName: profile?.displayName || profile?.email || 'Unknown User',
        timestamp: serverTimestamp(),
      });

      // Create notifications for assigned users
      for (const userId of newTask.assignedTo) {
        await addDoc(collection(db, 'notifications'), {
          userId,
          title: 'New Task Assigned',
          message: `You have been assigned to a new task: ${newTask.title}`,
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      setIsModalOpen(false);
      setNewTask({ title: '', description: '', workflowId: '', assignedTo: [], deadline: '', priority: 'Medium' });
    } catch (error) {
      console.error("Error creating task", error);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      
      // Also add to history
      await addDoc(collection(db, 'history'), {
        taskId,
        taskTitle: task?.title || 'Unknown Task',
        action: newStatus,
        userId: profile?.uid,
        userName: profile?.displayName || profile?.email || 'Unknown User',
        timestamp: serverTimestamp(),
      });

      // Notify task creator or assigned users depending on who updated
      if (task) {
        const notifyUserId = profile?.role === 'employee' ? task.createdBy : task.assignedTo[0];
        if (notifyUserId && notifyUserId !== profile?.uid) {
          await addDoc(collection(db, 'notifications'), {
            userId: notifyUserId,
            title: 'Task Status Updated',
            message: `Task "${task.title}" status changed to ${newStatus}`,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTask) return;

    if (file.size > 500 * 1024) {
      alert("File size must be less than 500KB for this demo.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const newDoc = {
        name: file.name,
        type: file.type,
        data: base64String,
        uploadedAt: new Date().toISOString(),
        uploadedBy: profile?.displayName || profile?.email || 'Unknown User'
      };

      try {
        await updateDoc(doc(db, 'tasks', selectedTask.id), {
          documents: [...(selectedTask.documents || []), newDoc],
          updatedAt: serverTimestamp(),
        });
        
        // Add to history
        await addDoc(collection(db, 'history'), {
          taskId: selectedTask.id,
          taskTitle: selectedTask.title,
          action: 'Document Uploaded',
          details: file.name,
          userId: profile?.uid,
          userName: profile?.displayName || profile?.email || 'Unknown User',
          timestamp: serverTimestamp(),
        });
        
        // Update local state to reflect immediately
        setSelectedTask({
          ...selectedTask,
          documents: [...(selectedTask.documents || []), newDoc]
        });
      } catch (error) {
        console.error("Error uploading document:", error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    try {
      const comment = {
        id: Date.now().toString(),
        text: newComment,
        userId: profile?.uid,
        userName: profile?.displayName || profile?.email || 'Unknown User',
        timestamp: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'tasks', selectedTask.id), {
        comments: [...(selectedTask.comments || []), comment],
        updatedAt: serverTimestamp(),
      });
      
      // Add to history
      await addDoc(collection(db, 'history'), {
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        action: 'Comment Added',
        details: newComment.substring(0, 50) + (newComment.length > 50 ? '...' : ''),
        userId: profile?.uid,
        userName: profile?.displayName || profile?.email || 'Unknown User',
        timestamp: serverTimestamp(),
      });
      
      // Update local state
      setSelectedTask({
        ...selectedTask,
        comments: [...(selectedTask.comments || []), comment]
      });
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      setSelectedTask(null);
    } catch (error) {
      console.error("Error deleting task", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'In Progress': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Pending': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      case 'Submitted': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Approved': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Low': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'All') return true;
    if (filter === 'Overdue') return task.deadline && task.deadline.seconds * 1000 < Date.now() && task.status !== 'Completed';
    return task.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage and track task progress.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-red-500 outline-none"
          >
            <option value="All">All Tasks</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>
          {(profile?.role === 'admin' || profile?.role === 'manager') && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="clay-btn-primary flex items-center gap-2 px-4 py-2"
            >
              <Plus className="w-5 h-5" />
              Assign Task
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No tasks found</h3>
            <p className="text-slate-500 dark:text-slate-400">Try adjusting your filters or create a new task.</p>
          </div>
        ) : (
          filteredTasks.map((task, index) => {
            const workflow = workflows.find(w => w.id === task.workflowId);
            const assignedUsers = users.filter(u => task.assignedTo.includes(u.uid));

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="clay-card p-6 flex flex-col cursor-pointer hover:-translate-y-1 transition-transform"
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    {task.priority && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">{task.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">
                  {task.description || 'No description provided.'}
                </p>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex -space-x-2">
                    {assignedUsers.slice(0, 3).map((u, i) => (
                      <img key={i} src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName || u.email}`} alt={u.displayName} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800" title={u.displayName} />
                    ))}
                    {assignedUsers.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300">
                        +{assignedUsers.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                    {workflow?.name || 'Unknown Workflow'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-4 text-slate-400">
                    <div className="flex items-center gap-1 text-xs">
                      <FileText className="w-4 h-4" />
                      {task.documents?.length || 0}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <MessageSquare className="w-4 h-4" />
                      {task.comments?.length || 0}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {task.deadline ? (
                      <span className={task.deadline.seconds * 1000 < Date.now() && task.status !== 'Completed' ? 'text-red-500 font-bold' : ''}>
                        {new Date(task.deadline.seconds * 1000).toLocaleDateString()}
                      </span>
                    ) : 'No deadline'}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Create Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg clay-card p-6 sm:p-8 overflow-hidden"
            >
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Assign Task</h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="e.g., Design Homepage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none resize-none"
                    placeholder="Task details..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Workflow</label>
                    <select
                      required
                      value={newTask.workflowId}
                      onChange={(e) => setNewTask({ ...newTask, workflowId: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                    >
                      <option value="" disabled>Select Workflow</option>
                      {workflows.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deadline</label>
                    <input
                      type="date"
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <select
                    required
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assign To (Employees)</label>
                  <select
                    multiple
                    required
                    value={newTask.assignedTo}
                    onChange={(e) => {
                      const options = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                      setNewTask({ ...newTask, assignedTo: options });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none h-32"
                  >
                    {users.filter(u => u.role === 'employee').map(u => (
                      <option key={u.uid} value={u.uid}>{u.displayName || u.email}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>

                <div className="flex gap-3 pt-4 mt-6 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 text-white bg-red-600 hover:bg-red-700 rounded-xl font-medium transition-colors shadow-lg shadow-red-500/30"
                  >
                    Assign Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Details Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl clay-card p-6 sm:p-8 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${getStatusColor(selectedTask.status)}`}>
                      {selectedTask.status}
                    </span>
                    {selectedTask.priority && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${getPriorityColor(selectedTask.priority)}`}>
                        {selectedTask.priority}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedTask.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {(profile?.role === 'admin' || profile?.role === 'manager') && (
                    <button
                      onClick={() => handleDeleteTask(selectedTask.id)}
                      className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                      title="Delete Task"
                    >
                      <AlertCircle className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Description</h4>
                  <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{selectedTask.description || 'No description provided.'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Workflow</h4>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {workflows.find(w => w.id === selectedTask.workflowId)?.name || 'Unknown'}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Deadline</h4>
                    <p className={`text-sm font-medium ${selectedTask.deadline && selectedTask.deadline.seconds * 1000 < Date.now() && selectedTask.status !== 'Completed' ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                      {selectedTask.deadline ? new Date(selectedTask.deadline.seconds * 1000).toLocaleDateString() : 'None'}
                      {selectedTask.deadline && selectedTask.deadline.seconds * 1000 < Date.now() && selectedTask.status !== 'Completed' && ' (Overdue)'}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Assigned To</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.assignedTo.map((uid: string) => {
                      const u = users.find(user => user.uid === uid);
                      if (!u) return null;
                      return (
                        <div key={uid} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl">
                          <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName || u.email}`} alt={u.displayName} className="w-6 h-6 rounded-full" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{u.displayName || u.email}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Update Actions */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Update Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile?.role === 'employee' && (
                      <>
                        <button onClick={() => handleUpdateStatus(selectedTask.id, 'In Progress')} className="px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-xl text-sm font-medium transition-colors">Mark In Progress</button>
                        <button onClick={() => handleUpdateStatus(selectedTask.id, 'Submitted')} className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl text-sm font-medium transition-colors">Submit for Review</button>
                      </>
                    )}
                    {(profile?.role === 'manager' || profile?.role === 'admin') && (
                      <>
                        <button onClick={() => handleUpdateStatus(selectedTask.id, 'Approved')} className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl text-sm font-medium transition-colors">Approve</button>
                        <button onClick={() => handleUpdateStatus(selectedTask.id, 'Rejected')} className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl text-sm font-medium transition-colors">Reject</button>
                        <button onClick={() => handleUpdateStatus(selectedTask.id, 'Completed')} className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-xl text-sm font-medium transition-colors">Mark Completed</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Documents Section */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Documents</h4>
                    <label className="cursor-pointer flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                      <Upload className="w-4 h-4" />
                      Upload File
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                  {selectedTask.documents && selectedTask.documents.length > 0 ? (
                    <div className="space-y-2">
                      {selectedTask.documents.map((doc: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-slate-400" />
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{doc.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Uploaded by {doc.uploadedBy}</p>
                            </div>
                          </div>
                          <a href={doc.data} download={doc.name} className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">No documents uploaded yet.</p>
                  )}
                </div>

                {/* Comments Section */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Comments</h4>
                  
                  <div className="space-y-4 mb-4">
                    {selectedTask.comments && selectedTask.comments.length > 0 ? (
                      selectedTask.comments.map((comment: any) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                              {comment.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{comment.userName}</span>
                              <span className="text-[10px] text-slate-500">{new Date(comment.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{comment.text}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic">No comments yet.</p>
                    )}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:hover:bg-red-600"
                    >
                      Post
                    </button>
                  </form>
                </div>

                {/* History Section */}
                <TaskHistory taskId={selectedTask.id} users={users} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskHistory({ taskId, users }: { taskId: string, users: any[] }) {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'history'), where('taskId', '==', taskId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const hist: any[] = [];
      snapshot.forEach((doc) => hist.push({ id: doc.id, ...doc.data() }));
      // Sort by timestamp descending
      hist.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
      setHistory(hist);
    });
    return () => unsubscribe();
  }, [taskId]);

  if (history.length === 0) return null;

  return (
    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Activity History</h4>
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
        {history.map((item, index) => {
          const user = users.find(u => u.uid === item.userId);
          return (
            <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Clock className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] clay-card p-3 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">{user?.displayName || 'Unknown User'}</span>
                  <span className="text-[10px] text-slate-500">{item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleString() : ''}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{item.action}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
