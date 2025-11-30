import React, { useState, useMemo, useEffect } from 'react';
import { AssetChart } from '../components/AssetChart';
import { AssetTrendChart } from '../components/AssetTrendChart';
import { Confetti } from '../components/Confetti';
import { AppRoute, UserAssets, AssetAllocation, AssetItem, AssetHistoryItem, UserProfile } from '../types';
import { storageService } from '../services/storageService';

interface DashboardProps {
  onNavigate: (route: AppRoute) => void;
  user: UserProfile;
}

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Pre-defined suggestions
const SUGGESTIONS: Record<keyof UserAssets, string[]> = {
  income: ['税后工资(年薪)', '年终奖', '房租收入', '副业/兼职', '投资分红'],
  liquid: ['微信/支付宝', '余额宝/零钱通', '银行活期', '大额存单'],
  financial: ['股票账户', '国债/逆回购', '黄金ETF', '宽基指数基金', '银行理财(R2)'],
  realEstate: ['自住房产', '投资性商铺', '实物黄金/金条', '私家车'],
  protection: ['公积金余额', '社保账户', '增额终身寿', '年金险', '重疾险现金价值'],
  alternative: ['私企股权', '加密货币', '借出款项', '艺术品收藏'],
  liabilities: ['房贷', '车贷', '信用卡账单', '消费贷/白条']
};

// Configuration for Categories with Emojis
const ASSET_CATEGORIES: { 
  key: keyof UserAssets; 
  name: string; 
  icon: string; 
  color: string; 
  desc: string; 
  type: 'income' | 'asset' | 'liability' 
}[] = [
  { key: 'income', name: '年度收入', icon: '💰', color: '#8b5cf6', desc: '工资/奖金/副业', type: 'income' },
  { key: 'liquid', name: '流动资产', icon: '💧', color: '#10b981', desc: '随时可用的钱', type: 'asset' },
  { key: 'financial', name: '金融投资', icon: '📈', color: '#3b82f6', desc: '钱生钱(含国债/黄金)', type: 'asset' },
  { key: 'realEstate', name: '房产实物', icon: '🏠', color: '#6366f1', desc: '固定资产/自用', type: 'asset' },
  { key: 'protection', name: '保障社保', icon: '🛡️', color: '#f43f5e', desc: '保命钱/养老钱', type: 'asset' },
  { key: 'alternative', name: '另类经营', icon: '💎', color: '#f59e0b', desc: '高风险/其他', type: 'asset' },
  { key: 'liabilities', name: '负债管理', icon: '💳', color: '#64748b', desc: '房贷/车贷', type: 'liability' },
];

const SIDEBAR_GROUPS = [
  { type: 'income', label: '收入来源' },
  { type: 'asset', label: '资产分布' },
  { type: 'liability', label: '负债管理' }
];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<keyof UserAssets>('liquid'); 
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Initialize state from storage
  const [assets, setAssets] = useState<UserAssets>(() => storageService.getAssets());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => storageService.getLastUpdated());

  // --- Calculations ---

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    (Object.keys(assets) as Array<keyof UserAssets>).forEach(key => {
      totals[key] = (assets[key] as AssetItem[]).reduce((sum, item) => sum + item.amount, 0);
    });
    return totals;
  }, [assets]);

  const totalAssets = useMemo(() => {
    return ASSET_CATEGORIES
      .filter(c => c.type === 'asset')
      .reduce((sum, cat) => sum + (categoryTotals[cat.key] || 0), 0);
  }, [categoryTotals]);

  const totalLiabilities = categoryTotals['liabilities'] || 0;
  const totalIncome = categoryTotals['income'] || 0;
  const netWorth = totalAssets - totalLiabilities;

  // Load History Data (Trend Chart) from Storage
  // We use useMemo but also rely on lastUpdated to trigger refresh when new data is saved
  const historyData: AssetHistoryItem[] = useMemo(() => {
    return storageService.getHistory();
  }, [lastUpdated, netWorth]); // Recalculate if netWorth changes (which happens when assets change)

  // Generate Chart Data (Assets Only)
  const chartData: AssetAllocation[] = useMemo(() => {
    if (totalAssets === 0) return [];
    return ASSET_CATEGORIES
      .filter(c => c.type === 'asset')
      .map(cat => ({
        name: cat.name,
        percentage: Number(((categoryTotals[cat.key] / totalAssets) * 100).toFixed(1)),
        value: categoryTotals[cat.key],
        color: cat.color,
        description: cat.desc
      }))
      .filter(item => item.percentage > 0);
  }, [categoryTotals, totalAssets]);

  // --- Handlers ---

  const handleAddItem = (category: keyof UserAssets, name: string = '') => {
    const newItem: AssetItem = {
      id: generateId(),
      name: name,
      amount: 0,
      interestRate: 0,
      principal: 0
    };
    setAssets(prev => ({
      ...prev,
      [category]: [...prev[category], newItem]
    }));
  };

  const handleDeleteItem = (category: keyof UserAssets, id: string) => {
    setAssets(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item.id !== id)
    }));
  };

  const handleUpdateItem = (category: keyof UserAssets, id: string, field: keyof AssetItem, value: string | number) => {
    setAssets(prev => ({
      ...prev,
      [category]: prev[category].map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  const handleFinishEditing = () => {
    // 1. Save current state
    storageService.saveAssets(assets);
    
    // 2. Create historical snapshot
    storageService.createSnapshot(assets);
    
    // 3. Update UI state
    setIsEditing(false);
    setShowConfetti(true);
    setLastUpdated(new Date());
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleLogout = () => {
    if (confirm('确定要重置所有数据并退出吗？\n您的资产记录将被清空且无法恢复。')) {
      storageService.clearData();
      window.location.reload();
    }
  };

  return (
    <div className="px-4 pt-14 pb-24 space-y-6 relative">
      <Confetti isActive={showConfetti} />

      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">资产全景</h1>
          <p className="text-slate-500 text-sm">Hi, {user.name}！今天也是变富的一天 ✨</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleLogout}
            className="w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 active:scale-95 transition-all"
            title="重置数据/退出"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
          </button>
          <div className="w-10 h-10 rounded-full bg-yellow-100 border-2 border-white shadow-sm flex items-center justify-center text-xl">
            🦁
          </div>
        </div>
      </div>

      {/* Action Card: Start Check-in */}
      <div 
        onClick={() => setIsEditing(true)}
        className="group relative overflow-hidden bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-brand-200/50 cursor-pointer active:scale-95 transition-all"
      >
        <div className="relative z-10 flex justify-between items-center">
            <div>
                <div className="bg-white/20 inline-block px-2 py-1 rounded-lg text-[10px] font-bold mb-2 backdrop-blur-sm">
                   每月一次
                </div>
                <h3 className="text-xl font-bold">开始本月资产盘点</h3>
                <div className="mt-2">
                   {lastUpdated ? (
                     <p className="text-[10px] text-brand-100/90 font-mono bg-black/10 inline-block px-2 py-0.5 rounded">
                       上次存档: {lastUpdated.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                     </p>
                   ) : (
                     <p className="text-brand-100 text-xs mt-1 opacity-90">梳理越清晰，财富越自由 👉</p>
                   )}
                </div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                📝
            </div>
        </div>
        {/* Decor */}
        <div className="absolute -bottom-10 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* Net Worth Card (Simple) */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <span className="text-slate-400 text-xs font-medium mb-1">净资产 (Net Worth)</span>
            <div className="text-2xl font-black text-slate-800 tracking-tight">
               ¥{(netWorth/10000).toFixed(1)}<span className="text-sm font-normal text-slate-500">万</span>
            </div>
         </div>
         <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <span className="text-slate-400 text-xs font-medium mb-1">年度收入 (Income)</span>
            <div className="text-2xl font-black text-purple-600 tracking-tight">
               ¥{(totalIncome/10000).toFixed(1)}<span className="text-sm font-normal text-slate-500">万</span>
            </div>
         </div>
      </div>

      {/* Time Machine (Trend Chart) */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
               <span className="text-lg">⏳</span> 财富时光机
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">近半年趋势</span>
         </div>
         <AssetTrendChart data={historyData} />
      </div>

      {/* Asset Structure Chart */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-lg">🍰</span> 资产分布
        </h3>
        <AssetChart data={chartData} />
        {/* Simplified list */}
        <div className="mt-4 space-y-3">
             {chartData.map((item, idx) => (
               <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{backgroundColor: item.color}}></div>
                    <span className="font-medium text-sm text-slate-700">{item.name}</span>
                 </div>
                 <div className="text-right">
                    <span className="font-bold text-sm text-slate-900 block">¥ {item.value?.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 block">{item.percentage}%</span>
                 </div>
               </div>
             ))}
        </div>
      </div>

      {/* Full Screen Asset Studio (Modal) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-bottom-5 duration-300 h-[100dvh]">
            {/* Header */}
            <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-slate-100 shrink-0">
                <div>
                   <h3 className="text-xl font-extrabold text-slate-900">资产工作室</h3>
                   <p className="text-xs text-slate-400 mt-0.5">一点一滴，记录美好生活</p>
                </div>
                <button 
                  onClick={handleFinishEditing} 
                  className="bg-brand-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 active:scale-95 transition-all"
                >
                    完成盘点
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden bg-slate-50 min-h-0">
                {/* Left Sidebar with Groups */}
                <div className="w-24 bg-slate-100/50 flex-shrink-0 overflow-y-auto border-r border-slate-100 no-scrollbar pt-2 pb-24">
                    {SIDEBAR_GROUPS.map((group, index) => (
                      <div key={group.type} className={`${index === 0 ? 'mt-4' : 'mt-8'} mb-2`}>
                        <div className="px-1 text-sm font-extrabold text-slate-700 text-center mb-3 cursor-default select-none">
                          {group.label}
                        </div>
                        {ASSET_CATEGORIES.filter(c => c.type === group.type).map((cat) => {
                          const isActive = activeTab === cat.key;
                          return (
                            <button
                                key={cat.key}
                                onClick={() => setActiveTab(cat.key)}
                                className={`w-[84px] mx-auto mb-2 py-3 px-1 flex flex-col items-center gap-1.5 rounded-xl transition-all duration-200 ${
                                    isActive 
                                    ? 'bg-white shadow-sm ring-1 ring-black/5 scale-100 z-10' 
                                    : 'text-slate-500 hover:bg-slate-200/50 scale-95 opacity-70 grayscale-[0.3]'
                                }`}
                            >
                                <div className="text-2xl">{cat.icon}</div>
                                <span className={`text-xs font-bold text-center leading-tight ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                                    {cat.name.replace('管理', '').replace('年度', '')}
                                </span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                </div>

                {/* Right Content */}
                <div className="flex-1 overflow-y-auto p-5 pb-32">
                    {/* Category Header */}
                    <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <div>
                             <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                {ASSET_CATEGORIES.find(c => c.key === activeTab)?.icon}
                                {ASSET_CATEGORIES.find(c => c.key === activeTab)?.name}
                             </h4>
                             <p className="text-xs text-slate-400 mt-1">
                                {ASSET_CATEGORIES.find(c => c.key === activeTab)?.desc}
                             </p>
                        </div>
                        <div className="text-right">
                             <div className={`font-black text-xl ${
                                 ASSET_CATEGORIES.find(c => c.key === activeTab)?.type === 'income' ? 'text-purple-600' :
                                 activeTab === 'liabilities' ? 'text-slate-600' : 'text-brand-600'
                             }`}>
                                ¥ {categoryTotals[activeTab].toLocaleString()}
                             </div>
                             <span className="text-[10px] text-slate-400">
                               {activeTab === 'income' ? '年度总计' : activeTab === 'liabilities' ? '负债总额' : '资产总额'}
                             </span>
                        </div>
                    </div>

                    {/* Income Guideline Banner */}
                    {activeTab === 'income' && (
                      <div className="bg-orange-50 text-orange-800 px-4 py-3 rounded-xl text-xs font-medium mb-4 flex items-start gap-2 border border-orange-100">
                        <span className="text-base">💡</span>
                        <div className="flex-1">
                           请统一录入 <strong>年收入</strong> 以便准确计算。<br/>
                           <span className="opacity-80 font-normal">例如：月薪 1万，年终奖 2万 → 工资填 12万，年终奖填 2万。</span>
                        </div>
                      </div>
                    )}

                    {/* Quick Add Chips */}
                    <div className="mb-6 overflow-x-auto no-scrollbar pb-2">
                        <div className="flex gap-2">
                            {SUGGESTIONS[activeTab].map(sug => (
                                <button
                                    key={sug}
                                    onClick={() => handleAddItem(activeTab, sug)}
                                    className="flex-shrink-0 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50 transition-all shadow-sm"
                                >
                                    + {sug}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Item List */}
                    <div className="space-y-4">
                        {assets[activeTab].map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                                {/* Name & Amount */}
                                <div className="flex items-start gap-4 mb-1">
                                    <div className="flex-1 pt-1">
                                        <input 
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => handleUpdateItem(activeTab, item.id, 'name', e.target.value)}
                                            placeholder="项目名称..."
                                            className="w-full bg-transparent font-bold text-slate-800 text-base focus:outline-none placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="flex-1 text-right">
                                        <div className="flex items-center justify-end gap-1 text-slate-900">
                                            <span className="text-base font-bold">{activeTab === 'income' ? '¥/年' : '¥'}</span>
                                            <input 
                                                type="number"
                                                value={item.amount === 0 ? '' : item.amount}
                                                onChange={(e) => handleUpdateItem(activeTab, item.id, 'amount', parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                className="w-32 bg-transparent font-black text-2xl text-right focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* Input Helper Text */}
                                <div className="flex justify-end mb-3">
                                  <span className="text-[10px] text-slate-400">
                                    {activeTab === 'income' 
                                      ? '建议填年收入 (月薪x12)' 
                                      : activeTab === 'liabilities' 
                                        ? '当前剩余欠款' 
                                        : '当前持有总市值'}
                                  </span>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-slate-100 my-3"></div>

                                {/* Details Row */}
                                <div className="flex items-center justify-between">
                                    {activeTab !== 'income' ? (
                                        <div className="flex gap-4">
                                            <div className="bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                <span className="text-[10px] text-slate-400">收益率</span>
                                                <div className="flex items-center">
                                                    <input 
                                                        type="number" 
                                                        value={item.interestRate === 0 ? '' : item.interestRate}
                                                        onChange={(e) => handleUpdateItem(activeTab, item.id, 'interestRate', parseFloat(e.target.value) || 0)}
                                                        placeholder="0.0"
                                                        className={`w-8 text-xs font-bold bg-transparent text-center focus:outline-none ${
                                                            (item.interestRate || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'
                                                        }`}
                                                    />
                                                    <span className="text-[10px] text-slate-400">%</span>
                                                </div>
                                            </div>
                                            {activeTab !== 'liabilities' && (
                                                <div className="bg-slate-50 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-400">本金</span>
                                                    <div className="flex items-center">
                                                        <span className="text-[10px] text-slate-400 mr-1">¥</span>
                                                        <input 
                                                            type="number" 
                                                            value={item.principal === 0 ? '' : item.principal}
                                                            onChange={(e) => handleUpdateItem(activeTab, item.id, 'principal', parseFloat(e.target.value) || 0)}
                                                            placeholder="0"
                                                            className="w-16 text-xs font-bold text-slate-600 bg-transparent focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-slate-400">记录每一笔收入，积少成多</div>
                                    )}

                                    <button 
                                        onClick={() => handleDeleteItem(activeTab, item.id)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button 
                        onClick={() => handleAddItem(activeTab)}
                        className="mt-6 w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">+</span> 添加{ASSET_CATEGORIES.find(c => c.key === activeTab)?.name}项目
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};