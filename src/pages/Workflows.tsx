import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, GitMerge, ChevronRight } from 'lucide-react';

export default function Workflows() {
  const { profile } = useAuth();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '', steps: [''] });

  useEffect(() => {
    const q = query(collection(db, 'workflows'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const wfs: any[] = [];
      snapshot.forEach((doc) => wfs.push({ id: doc.id, ...doc.data() }));
      setWorkflows(wfs);
    });
    return () => unsubscribe();
  }, []);

  const handleAddStep = () => {
    setNewWorkflow({ ...newWorkflow, steps: [...newWorkflow.steps, ''] });
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...newWorkflow.steps];
    newSteps[index] = value;
    setNewWorkflow({ ...newWorkflow, steps: newSteps });
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = newWorkflow.steps.filter((_, i) => i !== index);
    setNewWorkflow({ ...newWorkflow, steps: newSteps });
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflow.name || newWorkflow.steps.some(s => !s.trim())) return;

    try {
      await addDoc(collection(db, 'workflows'), {
        name: newWorkflow.name,
        description: newWorkflow.description,
        steps: newWorkflow.steps.filter(s => s.trim() !== ''),
        createdBy: profile?.uid,
        createdAt: serverTimestamp(),
      });
      setIsModalOpen(false);
      setNewWorkflow({ name: '', description: '', steps: [''] });
    } catch (error) {
      console.error("Error creating workflow", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      await deleteDoc(doc(db, 'workflows', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Workflows</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage and view standard operating procedures.</p>
        </div>
        {profile?.role === 'admin' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="clay-btn-primary flex items-center gap-2 px-4 py-2"
          >
            <Plus className="w-5 h-5" />
            Create Workflow
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow, index) => (
          <motion.div
            key={workflow.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="clay-card p-6 group hover:-translate-y-1 transition-transform"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400">
                <GitMerge className="w-6 h-6" />
              </div>
              {profile?.role === 'admin' && (
                <button
                  onClick={() => handleDelete(workflow.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{workflow.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
              {workflow.description || 'No description provided.'}
            </p>
            
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Steps ({workflow.steps.length})</h4>
              <div className="flex flex-wrap gap-2">
                {workflow.steps.map((step: string, i: number) => (
                  <div key={i} className="flex items-center text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                    <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-bold mr-2">
                      {i + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Modal */}
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
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create Workflow</h2>
              <form onSubmit={handleCreateWorkflow} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Workflow Name</label>
                  <input
                    type="text"
                    required
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g., Employee Onboarding"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Briefly describe this workflow..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Workflow Steps</label>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {newWorkflow.steps.map((step, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          required
                          value={step}
                          onChange={(e) => handleStepChange(index, e.target.value)}
                          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                          placeholder={`Step ${index + 1} description`}
                        />
                        {newWorkflow.steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(index)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg shrink-0"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="mt-3 flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <Plus className="w-4 h-4" /> Add Step
                  </button>
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
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
