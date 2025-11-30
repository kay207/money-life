import React from 'react';

const COURSES = [
  {
    title: "理财第一课：什么是财富自由？",
    desc: "财富自由不是拥有花不完的钱，而是被动收入覆盖日常支出。",
    level: "入门",
    time: "3分钟"
  },
  {
    title: "神奇的复利",
    desc: "爱因斯坦称之为世界第八大奇迹。理解时间带来的指数级增长。",
    level: "基础",
    time: "5分钟"
  },
  {
    title: "4%法则：到底需要存多少钱？",
    desc: "一个简单的公式，帮你算出退休需要的资金总额。",
    level: "进阶",
    time: "4分钟"
  },
  {
    title: "不要把鸡蛋放在一个篮子里",
    desc: "通过资产配置降低风险，实现资产的稳健增值。",
    level: "核心",
    time: "6分钟"
  }
];

export const Learn: React.FC = () => {
  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="bg-brand-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">理财学堂</h1>
        <p className="text-brand-100">每天几分钟，建立科学的金钱观</p>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">精选课程</h2>
        <div className="space-y-4">
          {COURSES.map((course, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 active:scale-95 transition-transform cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-brand-50 text-brand-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">{course.level}</span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  {course.time}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 mb-1">{course.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2">{course.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-slate-100 rounded-xl text-center">
        <p className="text-slate-500 text-sm">更多深度课程正在制作中...</p>
      </div>
    </div>
  );
};
