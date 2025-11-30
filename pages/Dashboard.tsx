import React, { useState, useMemo } from 'react';
import { AssetChart } from '../components/AssetChart';
import { AppRoute, UserAssets, AssetAllocation, AssetItem } from '../types';

interface DashboardProps {
  onNavigate: (route: AppRoute) => void;
}

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Pre-defined suggestions for quick adding
const SUGGESTIONS: Record<keyof UserAssets, string[]> = {
  liquid: ['微信/支付宝', '余额宝/零钱通', '银行活期', '大额存单'],
  financial: ['股票账户', '国债/逆回购', '黄金ETF', '宽基指数基金', '银行理财(R2)'],
  realEstate: ['自住房产', '投资性商铺', '实物黄金/金条', '私家车'],
  protection: ['公积金余额', '社保账户', '增额终身寿', '年金险', '重疾险现金价值'],
  alternative: ['私企股权', '加密货币', '借出款项', '艺术品收藏'],
  liabilities: ['房贷', '车贷', '信用卡账单', '消费贷/白条']
};

const ASSET_CATEGORIES: { key: keyof UserAssets; name: string; color: string; desc: string; isLiability?: boolean }[] = [
  { key: 'liquid', name: '流动资产', color: '#10b981', desc: '随时可用的钱' },
  { key: 'financial', name: '金融投资', color: '#3b82f6', desc: '钱生钱(含国债/黄金)' },
  { key: 'realEstate', name: '房产实物', color: '#6366f1', desc: '固定资产/自用' },
  { key: 'protection', name: '保障社保', color: '#f43f5e', desc: '保命钱/养老钱' },
  { key: 'alternative', name: '另类经营', color: '#f59e0b', desc: '高风险/其他' },
  { key: 'liabilities', name: '负债管理', color: '#64748b', desc: '房贷/车贷/信用卡', isLiability: true },
];

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<keyof UserAssets>('liquid');

  // Initial State with generic data
  const [assets, setAssets] = useState<UserAssets>({
    liquid: [
      { id: '1', name: '余额宝', amount: 35000, interestRate: 1.8, principal: 35000 },
    ],
    financial: [
      { id: '3', name: '沪深300指数', amount: 18000, interestRate: 8.0, principal: 20000 },
      { id: '31', name: '三年期国债', amount: 50000, interestRate: 2.3, principal: 50000 }
    ],
    realEstate: [
      { id: '4', name: '自住房(估值)', amount: 2500000, interestRate: 1.5, principal: 2000000 }
    ],
    protection: [],
    alternative: [],
    liabilities: [
      { id: '5', name: '房贷剩余本金', amount: 800000, interestRate: 3.1 }
    ]
  });

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
      .filter(c => !c.isLiability)
      .reduce((sum, cat) => sum + (categoryTotals[cat.key] || 0), 0);
  }, [categoryTotals]);

  const totalLiabilities = categoryTotals['liabilities'] || 0;
  const netWorth = totalAssets - totalLiabilities;

  // Calculate Weighted Average Return (Investable Assets only roughly)
  const projectionData = useMemo(() => {
    let totalWeightedAmount = 0;
    let weightedReturnSum = 0;

    // We consider assets for growth
    [...assets.liquid, ...assets.financial, ...assets.realEstate, ...assets.alternative].forEach(item => {
      const rate = item.interestRate || 0;
      weightedReturnSum += item.amount * rate;
      totalWeightedAmount += item.amount;
    });

    const avgReturnRate = totalWeightedAmount > 0 ? weightedReturnSum / totalWeightedAmount : 0;
    
    // Simple projection
    const project = (years: number) => netWorth * Math.pow(1 + avgReturnRate / 100, years);

    return {
      rate: avgReturnRate,
      y5: project(5),
      y10: project(10)
    };
  }, [assets, netWorth]);


  // Generate Chart Data (Assets Only)
  const chartData: AssetAllocation[] = useMemo(() => {
    if (totalAssets === 0) return [];
    
    return ASSET_CATEGORIES
      .filter(c => !c.isLiability)
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

  return (
    <div className="px-4 py-6 space-y-6 relative pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">资产全景</h1>
          <p className="text-slate-500 text-sm">净资产 = 总资产 - 总负债</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
          我
        </div>
      </div>

      {/* Net Worth Card */}
      <div className="bg-gradient-to-br from-brand-700 to-brand-600 rounded-2xl p-6 text-white shadow-xl shadow-brand-200/50">
        <div className="flex justify-between items-start mb-2">
          <p className="text-brand-100 text-sm font-medium">净资产 (Net Worth)</p>
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg backdrop-blur-sm transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
        </div>
        
        <h2 className="text-4xl font-bold tracking-tight mb-4">
          ¥ {netWorth.toLocaleString()}
        </h2>
        
        <div className="grid grid-cols-2 gap-4 text-sm border-t border-brand-500/50 pt-4">
            <div>
                <span className="text-brand-200 block text-xs">总资产</span>
                <span className="font-semibold">¥ {totalAssets.toLocaleString()}</span>
            </div>
            <div>
                <span className="text-brand-200 block text-xs">总负债</span>
                <span className="font-semibold">¥ {totalLiabilities.toLocaleString()}</span>
            </div>
        </div>
      </div>

      {/* Wealth Projection */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h3 className="text-lg font-bold text-slate-800">财富推演</h3>
                <p className="text-xs text-slate-400">基于加权<span className="text-slate-600 font-medium">预估年化</span>: <span className={projectionData.rate >= 0 ? 'text-money-green font-bold' : 'text-money-red font-bold'}>{projectionData.rate.toFixed(2)}%</span></p>
            </div>
        </div>
        
        <div className="flex items-end justify-between h-32 gap-4 mt-2">
            {/* Current */}
            <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="text-xs text-slate-500 font-medium">现在</div>
                <div className="w-full bg-brand-200 rounded-t-lg relative transition-all group-hover:bg-brand-300" style={{height: '30%'}}>
                </div>
                <div className="text-xs font-bold text-slate-700">{(netWorth/10000).toFixed(0)}万</div>
            </div>

            {/* 5 Years */}
            <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="text-xs text-slate-500 font-medium">5年后</div>
                <div className="w-full bg-brand-400 rounded-t-lg relative transition-all group-hover:bg-brand-500" style={{height: '60%'}}>
                     <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-100">
                        +{(projectionData.y5 - netWorth).toLocaleString('zh-CN', {maximumFractionDigits: 0})}
                     </div>
                </div>
                <div className="text-xs font-bold text-slate-700">{(projectionData.y5/10000).toFixed(0)}万</div>
            </div>

            {/* 10 Years */}
            <div className="flex-1 flex flex-col items-center gap-2 group">
                <div className="text-xs text-slate-500 font-medium">10年后</div>
                <div className="w-full bg-brand-600 rounded-t-lg relative transition-all group-hover:bg-brand-700" style={{height: '100%'}}>
                     <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-100">
                        +{(projectionData.y10 - netWorth).toLocaleString('zh-CN', {maximumFractionDigits: 0})}
                     </div>
                </div>
                <div className="text-xs font-bold text-slate-700">{(projectionData.y10/10000).toFixed(0)}万</div>
            </div>
        </div>
        <p className="text-[10px] text-slate-300 mt-4 text-center">推演仅假设收益复利增长，不代表实际投资回报</p>
      </div>

      {/* Asset Structure Chart */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">资产分布 (不含负债)</h3>
        <AssetChart data={chartData} />
        {/* Simplified list for dashboard view */}
        <div className="mt-4 space-y-3">
             {chartData.map((item, idx) => (
               <div key={idx} className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{backgroundColor: item.color}}></div>
                    <span className="font-medium text-sm text-slate-800">{item.name}</span>
                 </div>
                 <span className="font-bold text-sm text-slate-900">¥ {item.value?.toLocaleString()}</span>
               </div>
             ))}
        </div>
      </div>

      {/* Detailed Entry Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 animate-in slide-in-from-bottom-10 duration-200">
            {/* Modal Header */}
            <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-slate-200 shadow-sm z-10">
                <div>
                   <h3 className="text-lg font-bold text-slate-900">资产详细盘点</h3>
                   <p className="text-xs text-slate-500">请如实填写各项资产的当前价值</p>
                </div>
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-brand-200"
                >
                    完成
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-24 bg-slate-100 flex-shrink-0 overflow-y-auto border-r border-slate-200">
                    {ASSET_CATEGORIES.map((cat) => (
                        <button
                            key={cat.key}
                            onClick={() => setActiveTab(cat.key)}
                            className={`w-full py-4 px-2 flex flex-col items-center gap-1 transition-colors border-l-4 ${
                                activeTab === cat.key 
                                ? 'bg-white border-brand-500 text-brand-600' 
                                : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-200'
                            }`}
                        >
                            <div className={`w-3 h-3 rounded-full ${cat.key === 'liabilities' ? 'border-2 border-slate-400' : ''}`} style={{backgroundColor: cat.color}}></div>
                            <span className="text-xs font-bold text-center leading-tight">{cat.name}</span>
                        </button>
                    ))}
                </div>

                {/* Right Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-white pb-32">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                             <h4 className="font-bold text-slate-800 text-lg">
                                {ASSET_CATEGORIES.find(c => c.key === activeTab)?.name}
                             </h4>
                             <p className="text-xs text-slate-500">
                                {ASSET_CATEGORIES.find(c => c.key === activeTab)?.desc}
                             </p>
                        </div>
                        <div className="text-right">
                             <span className="text-xs text-slate-400">小计</span>
                             <div className={`font-bold text-lg ${activeTab === 'liabilities' ? 'text-slate-600' : 'text-brand-600'}`}>
                                ¥ {categoryTotals[activeTab].toLocaleString()}
                             </div>
                        </div>
                    </div>

                    {/* Quick Add */}
                    <div className="mb-6">
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTIONS[activeTab].map(sug => (
                                <button
                                    key={sug}
                                    onClick={() => handleAddItem(activeTab, sug)}
                                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 hover:border-brand-500 hover:text-brand-600 transition-colors"
                                >
                                    + {sug}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Item List */}
                    <div className="space-y-4">
                        {assets[activeTab].map((item) => (
                            <div key={item.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Row 1: Name and Total Amount (Big & Bold) */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex-1">
                                        <input 
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => handleUpdateItem(activeTab, item.id, 'name', e.target.value)}
                                            placeholder="输入名称"
                                            className="bg-transparent font-bold text-slate-800 text-base w-full focus:outline-none placeholder:text-slate-300 placeholder:font-normal"
                                        />
                                        <div className="text-[10px] text-slate-400 mt-1">项目名称</div>
                                    </div>
                                    <div className="flex-1 border-b-2 border-slate-200 focus-within:border-brand-500 transition-colors pb-0.5 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <span className="text-slate-400 text-sm font-medium">¥</span>
                                            <input 
                                                type="number"
                                                value={item.amount === 0 ? '' : item.amount}
                                                onChange={(e) => handleUpdateItem(activeTab, item.id, 'amount', parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                className="bg-transparent font-bold text-slate-900 text-lg text-right w-full focus:outline-none"
                                            />
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-1">当前市值/余额</div>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteItem(activeTab, item.id)}
                                        className="p-1 text-slate-300 hover:text-red-500 ml-1 self-center"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>

                                {/* Row 2: Secondary Fields (Rate & Principal) */}
                                <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded-lg border border-slate-100">
                                    {/* Interest Rate */}
                                    <div>
                                        <label className="text-[10px] text-slate-400 block mb-1">
                                            {activeTab === 'liabilities' ? '借款年利率' : '预估年化收益率'}
                                        </label>
                                        <div className="flex items-center">
                                            <input 
                                                type="number" 
                                                value={item.interestRate === 0 ? '' : item.interestRate}
                                                onChange={(e) => handleUpdateItem(activeTab, item.id, 'interestRate', parseFloat(e.target.value) || 0)}
                                                placeholder="0.0"
                                                className={`w-full text-sm font-medium bg-transparent focus:outline-none ${(item.interestRate || 0) >= 0 ? 'text-money-green' : 'text-money-red'}`}
                                            />
                                            <span className="text-xs text-slate-300 font-medium">%</span>
                                        </div>
                                        <p className="text-[9px] text-slate-300 mt-1 transform scale-95 origin-left">
                                            {activeTab === 'liabilities' ? '用于计算利息支出' : '仅用于推演未来财富'}
                                        </p>
                                    </div>
                                    
                                    {/* Principal (Hidden for Liabilities) */}
                                    {activeTab !== 'liabilities' ? (
                                        <div className="pl-4 border-l border-slate-100">
                                            <label className="text-[10px] text-slate-400 block mb-1">
                                                当初投入本金
                                            </label>
                                            <div className="flex items-center">
                                                <span className="text-xs text-slate-300 mr-1">¥</span>
                                                <input 
                                                    type="number" 
                                                    value={item.principal === 0 ? '' : item.principal}
                                                    onChange={(e) => handleUpdateItem(activeTab, item.id, 'principal', parseFloat(e.target.value) || 0)}
                                                    placeholder="0"
                                                    className="w-full text-sm font-medium text-slate-600 bg-transparent focus:outline-none"
                                                />
                                            </div>
                                            <p className="text-[9px] text-slate-300 mt-1 transform scale-95 origin-left">
                                                不填则默认等于当前市值
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center text-center">
                                            <span className="text-[10px] text-slate-300">负债项无需本金</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button 
                        onClick={() => handleAddItem(activeTab)}
                        className="mt-4 w-full py-3 border border-dashed border-slate-300 rounded-xl text-slate-500 text-sm font-medium hover:border-brand-500 hover:text-brand-600 transition-colors"
                    >
                        添加自定义项目
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};