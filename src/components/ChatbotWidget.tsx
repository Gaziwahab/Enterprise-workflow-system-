import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Image as ImageIcon, Loader2, Key } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { useAuth } from '../contexts/AuthContext';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function ChatbotWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string, imageUrl?: string }[]>([
    { role: 'model', text: 'Hi! I am the WorkSync AI Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'image'>('chat');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [hasApiKey, setHasApiKey] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    const checkApiKey = async () => {
      if (mode === 'image' && window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        setHasApiKey(true);
      }
    };
    checkApiKey();
  }, [mode, isOpen]);

  if (!user) return null;

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (mode === 'image' && !hasApiKey) {
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Create a new instance right before making an API call
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });

      if (mode === 'chat') {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: userMessage,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
            systemInstruction: 'You are a helpful AI assistant for WorkSync, a workflow and task management system.',
          }
        });
        setMessages(prev => [...prev, { role: 'model', text: response.text || 'Sorry, I could not generate a response.' }]);
      } else {
        // Image Generation
        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: {
            parts: [{ text: userMessage }]
          },
          config: {
            imageConfig: {
              aspectRatio: '1:1',
              imageSize: imageSize
            }
          }
        });
        
        let imageUrl = '';
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }

        if (imageUrl) {
          setMessages(prev => [...prev, { role: 'model', text: 'Here is your generated image:', imageUrl }]);
        } else {
          setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I could not generate the image.' }]);
        }
      }
    } catch (error: any) {
      console.error('AI Error:', error);
      if (error.message?.includes('Requested entity was not found')) {
        setHasApiKey(false);
        setMessages(prev => [...prev, { role: 'model', text: 'Your API key seems invalid or missing. Please select a valid paid API key.' }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: 'An error occurred while processing your request.' }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 clay-btn-primary rounded-full flex items-center justify-center z-40 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed bottom-6 right-6 w-full max-w-sm h-[600px] max-h-[80vh] clay-card flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-red-600 dark:bg-red-700 text-white flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shadow-inner">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">WorkSync AI</h3>
                  <p className="text-xs text-red-200 dark:text-red-300">Powered by Gemini</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="flex border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => setMode('chat')}
                className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${mode === 'chat' ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <MessageSquare className="w-4 h-4" /> Chat
              </button>
              <button
                onClick={() => setMode('image')}
                className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${mode === 'image' ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <ImageIcon className="w-4 h-4" /> Image Gen
              </button>
            </div>

            {mode === 'image' && (
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Image Size:</span>
                <div className="flex gap-2">
                  {['1K', '2K', '4K'].map(size => (
                    <button
                      key={size}
                      onClick={() => setImageSize(size as any)}
                      className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${imageSize === size ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 ${
                    msg.role === 'user' 
                      ? 'bg-red-600 text-white rounded-tr-sm' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/50 rounded-tl-sm shadow-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="Generated" className="mt-2 rounded-xl w-full object-cover" />
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-3 rounded-tl-sm shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {mode === 'chat' ? 'Thinking...' : 'Generating image...'}
                    </span>
                  </div>
                </div>
              )}
              {mode === 'image' && !hasApiKey && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleSelectKey}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    Select API Key for Image Gen
                  </button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700/50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={mode === 'chat' ? "Ask me anything..." : "Describe an image..."}
                  disabled={mode === 'image' && !hasApiKey}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-red-500 dark:focus:border-red-500 rounded-full pl-4 pr-12 py-3 text-sm text-slate-900 dark:text-white outline-none transition-all disabled:opacity-50 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || (mode === 'image' && !hasApiKey)}
                  className="absolute right-2 p-2 clay-btn-primary rounded-full disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
