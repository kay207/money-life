import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { UserProfile } from '../types';

interface WelcomeProps {
  onLogin: (user: UserProfile) => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onLogin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const user = storageService.createUser(name.trim());
      onLogin(user);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Shapes */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-brand-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 translate-x-1/2 translate-y-1/2 animate-pulse"></div>

      <div className="z-10 w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-3xl mx-auto shadow-xl shadow-brand-200 flex items-center justify-center text-4xl mb-6 transform rotate-6">
            🦁
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
            WealthWisdom
          </h1>
          <p className="text-slate-500 text-sm">
            普通人的科学理财助手
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            👋 欢迎！给自己起个代号
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：未来的巴菲特"
                className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 font-bold text-center placeholder:text-slate-300 focus:border-brand-500 focus:outline-none focus:bg-white transition-all"
                autoFocus
                maxLength={12}
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-200 transform transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
            >
              开启财富之旅
            </button>
          </form>
          
          <p className="mt-6 text-xs text-center text-slate-400">
            数据将存储在您的本地设备中，<br/>我们尊重并保护您的隐私。
          </p>
        </div>
      </div>
    </div>
  );
};