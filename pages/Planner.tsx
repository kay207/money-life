import React, { useState, useEffect } from 'react';
import { analyzeFinancialGoal } from '../services/geminiService';
import { GoalType, GoalContext, GoalAnalysisResult } from '../types';

export const Planner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GoalType>(GoalType.PURCHASE);
  
  // Inputs
  const [inputs, setInputs] = useState({
    currentPrincipal: 50000,
    monthlySavings: 3000,
    expectedReturnRate: 3.5, // Conservative default
    // Purchase specific
    targetAmount: 1000000,
    yearsToGoal: 5,
    // Retirement specific
    targetMonthlyExpense: 5000
  });

  // Calculated State
  const [calculation, setCalculation] = useState({
    projectedAmount: 0,
    requiredAmount: 0,
    gap: 0,
    isAchievable: false
  });

  // Analysis State
  const [analysis, setAnalysis] = useState<GoalAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Real-time Math Engine ---
  useEffect(() => {
    const { currentPrincipal, monthlySavings, expectedReturnRate, targetAmount, yearsToGoal, targetMonthlyExpense } = inputs;
    const r = expectedReturnRate / 100;
    
    let proj = 0;
    let req = 0;

    if (activeTab === GoalType.PURCHASE) {
      // Monthly compounding formula
      const months = yearsToGoal * 12;
      const monthlyRate = r / 12;
      
      const fvPrincipal = currentPrincipal * Math.pow(1 + monthlyRate, months);
      const fvSavings = monthlyRate > 0 
        ? monthlySavings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
        : monthlySavings * months;
      
      proj = fvPrincipal + fvSavings;
      req = targetAmount;
    } else {
      // Retirement (FIRE) Logic: 4% Rule
      const annualExpense = targetMonthlyExpense * 12;
      req = annualExpense / 0.04;

      // Projection for 20 years
      const horizonYears = 20; 
      const months = horizonYears * 12;
      const monthlyRate = r / 12;
      const fvPrincipal = currentPrincipal * Math.pow(1 + monthlyRate, months);
      const fvSavings = monthlyRate > 0 
        ? monthlySavings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
        : monthlySavings * months;
      proj = fvPrincipal + fvSavings; 
    }

    setCalculation({
      projectedAmount: proj,
      requiredAmount: req,
      gap: proj - req,
      isAchievable: proj >= req
    });
    
    // Reset analysis when inputs change significantly
    setAnalysis(null);
  }, [inputs, activeTab]);

  const handleAnalyze = async () => {
    setLoading(true);
    const context: GoalContext = {
      type: activeTab,
      ...inputs,
      ...calculation
    };
    const result = await analyzeFinancialGoal(context);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="bg-slate-50 min-h-full">
      <div className="px-4 py-6 pb-24 space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">目标规划</h1>
          <p className="text-slate-500 text-sm">以终为始，科学规划您的财务自由之路</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white p-1 rounded-xl flex shadow-sm border border-slate-200">
          <button
            onClick={() => setActiveTab(GoalType.PURCHASE)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === GoalType.PURCHASE 
              ? 'bg-brand-50 text-brand-600 shadow-sm' 
              : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            存钱置业
          </button>
          <button
            onClick={() => setActiveTab(GoalType.RETIREMENT)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === GoalType.RETIREMENT 
              ? 'bg-brand-50 text-brand-600 shadow-sm' 
              : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            养老/躺平 (FIRE)
          </button>
        </div>

        {/* Calculator Inputs */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-5">
           
           {/* Common Inputs */}
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1 block">当前可投资资产</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
                  <input 
                    type="number"
                    value={inputs.currentPrincipal}
                    onChange={(e) => setInputs({...inputs, currentPrincipal: Number(e.target.value)})}
                    className="w-full pl-6 pr-3 py-2 bg-slate-50 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1 block">每月存钱</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
                  <input 
                    type="number"
                    value={inputs.monthlySavings}
                    onChange={(e) => setInputs({...inputs, monthlySavings: Number(e.target.value)})}
                    className="w-full pl-6 pr-3 py-2 bg-slate-50 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
           </div>

           <div className="pt-4 border-t border-slate-100">
              <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1 block">
                预估平均年化收益率
              </label>
              <div className="flex items-center gap-4">
                 <input 
                    type="range" 
                    min="1" max="15" step="0.5"
                    value={inputs.expectedReturnRate}
                    onChange={(e) => setInputs({...inputs, expectedReturnRate: Number(e.target.value)})}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                 />
                 <div className="w-16 px-2 py-1 bg-brand-50 rounded text-center text-brand-700 font-bold text-sm">
                   {inputs.expectedReturnRate}%
                 </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                 参考: 余额宝~2%, 银行理财~3%, 债券~4%, 宽基指数基金长期~8-10%
              </p>
           </div>

           {/* Specific Inputs */}
           <div className="pt-4 border-t border-slate-100 space-y-4">
              {activeTab === GoalType.PURCHASE ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">您的目标是？</label>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] text-slate-400 mb-1 block">目标金额 (¥)</label>
                          <input 
                            type="number"
                            value={inputs.targetAmount}
                            onChange={(e) => setInputs({...inputs, targetAmount: Number(e.target.value)})}
                            className="w-full p-2 bg-slate-50 rounded-lg font-bold text-slate-700"
                          />
                       </div>
                       <div>
                          <label className="text-[10px] text-slate-400 mb-1 block">计划几年后实现</label>
                          <input 
                            type="number"
                            value={inputs.yearsToGoal}
                            onChange={(e) => setInputs({...inputs, yearsToGoal: Number(e.target.value)})}
                            className="w-full p-2 bg-slate-50 rounded-lg font-bold text-slate-700"
                          />
                       </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">理想的退休生活</label>
                    <label className="text-[10px] text-slate-400 mb-1 block">每月需要多少被动收入 (生活费)？</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
                      <input 
                        type="number"
                        value={inputs.targetMonthlyExpense}
                        onChange={(e) => setInputs({...inputs, targetMonthlyExpense: Number(e.target.value)})}
                        className="w-full pl-6 pr-3 py-3 bg-slate-50 rounded-lg text-lg font-bold text-slate-700 border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 bg-slate-50 p-2 rounded">
                      💡 <strong>4%法则</strong>: 如果你有本金 ¥{(inputs.targetMonthlyExpense * 12 / 0.04).toLocaleString()}，放在年化4%以上的稳健理财中，产生的收益即可覆盖开支，本金永不动用。
                    </p>
                  </div>
                </>
              )}
           </div>
        </div>

        {/* Math Result Card */}
        <div className={`rounded-2xl p-6 text-white shadow-lg transition-colors duration-500 ${
          calculation.isAchievable ? 'bg-gradient-to-br from-money-green to-emerald-600' : 'bg-gradient-to-br from-brand-600 to-indigo-600'
        }`}>
           <div className="flex justify-between items-start mb-4">
              <div>
                 <p className="text-white/80 text-xs font-medium uppercase tracking-wider">
                   {activeTab === GoalType.PURCHASE 
                     ? `${inputs.yearsToGoal}年后预计资产` 
                     : `20年后预计资产`
                   }
                 </p>
                 <h2 className="text-3xl font-bold mt-1">¥ {(calculation.projectedAmount / 10000).toFixed(1)}万</h2>
              </div>
              <div className="text-right">
                 <p className="text-white/80 text-xs font-medium uppercase tracking-wider">目标资金</p>
                 <h2 className="text-xl font-bold mt-1">¥ {(calculation.requiredAmount / 10000).toFixed(1)}万</h2>
              </div>
           </div>

           {/* Progress Bar */}
           <div className="relative h-2 bg-black/20 rounded-full overflow-hidden mb-2">
              <div 
                className="absolute top-0 left-0 h-full bg-white/90 rounded-full transition-all duration-700"
                style={{ width: `${Math.min((calculation.projectedAmount / calculation.requiredAmount) * 100, 100)}%` }}
              />
           </div>
           
           <div className="flex justify-between items-center text-xs font-medium">
              <span>完成度: {((calculation.projectedAmount / calculation.requiredAmount) * 100).toFixed(0)}%</span>
              {calculation.isAchievable ? (
                 <span className="bg-white/20 px-2 py-0.5 rounded text-white flex items-center gap-1">
                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                   目标可达成
                 </span>
              ) : (
                 <span className="text-white/90">
                   缺口: ¥ {Math.abs(calculation.gap / 10000).toFixed(1)}万
                 </span>
              )}
           </div>
        </div>

        {/* Action Button */}
        {!analysis && (
           <button
             onClick={handleAnalyze}
             disabled={loading}
             className="w-full py-4 bg-white border border-slate-200 shadow-sm rounded-xl text-brand-600 font-bold hover:bg-slate-50 active:scale-95 transition-all flex justify-center items-center gap-2"
           >
             {loading ? (
               <>
                 <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                 正在生成分析报告...
               </>
             ) : (
               <>
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                 生成分析报告
               </>
             )}
           </button>
        )}

        {/* Analysis Result */}
        {analysis && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">评估结果</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  calculation.isAchievable ? 'bg-money-green/10 text-money-green' : 'bg-brand-50 text-brand-600'
                }`}>
                  {analysis.evaluation}
                </span>
             </div>
             
             <p className="text-sm text-slate-600 leading-relaxed mb-6">
               {analysis.summary}
             </p>

             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">行动建议</h4>
             <ul className="space-y-3 mb-6">
               {analysis.suggestions.map((sug, i) => (
                 <li key={i} className="flex gap-3 text-sm text-slate-700">
                   <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                     {i+1}
                   </span>
                   {sug}
                 </li>
               ))}
             </ul>

             <div className="bg-orange-50 p-3 rounded-lg flex gap-3">
               <svg className="text-orange-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
               <p className="text-xs text-orange-800 leading-snug">
                 <strong>风险提示：</strong> {analysis.riskWarning}
               </p>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};