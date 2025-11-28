import React, { useState } from 'react';
import { Calendar as CalendarIcon, Calculator, User, Info, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { calculateCalendarSystem } from './utils/calculator';
import { CalculationResult } from './types';
import ResultCard from './components/ResultCard';
import { generateLeaveExplanation } from './services/geminiService';
import { addMonths } from 'date-fns';

const App: React.FC = () => {
  const [name, setName] = useState('員工A');
  const [onboardDate, setOnboardDate] = useState('2024-04-01');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  const handleCalculate = () => {
    const date = new Date(onboardDate);
    if (isNaN(date.getTime())) return;

    // Calculate for next 5 years to show progression
    const entitlements = calculateCalendarSystem(date, 5);
    const sixMonth = addMonths(date, 6);
    
    // Find the 6 month entitlement for summary
    const sixMonthEnt = entitlements.find(e => e.source.includes('滿半年'));

    const calcResult: CalculationResult = {
      employeeName: name,
      onboardDate: date,
      sixMonthDate: sixMonth,
      sixMonthEntitlement: sixMonthEnt ? sixMonthEnt.days : 3,
      calendarYearEntitlements: entitlements
    };

    setResult(calcResult);
    setAiExplanation(''); // Reset AI explanation on new calc
  };

  const handleAskAI = async () => {
    if (!result) return;
    setLoadingAi(true);
    const text = await generateLeaveExplanation(result);
    setAiExplanation(text);
    setLoadingAi(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white">
              <CalendarIcon size={20} />
            </div>
            <h1 className="font-bold text-xl text-slate-800 tracking-tight">LeaveWise TW</h1>
          </div>
          <a href="https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=N0030001" target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">
            參考勞基法第38條
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Input Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-brand-500" />
            員工資料輸入
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">員工姓名</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                placeholder="例如：王小明"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">入職日期 (YYYY/MM/DD)</label>
              <input 
                type="date" 
                value={onboardDate}
                onChange={(e) => setOnboardDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
              />
            </div>
          </div>

          <button 
            onClick={handleCalculate}
            className="mt-6 w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Calculator className="w-5 h-5" />
            開始試算特休 (曆年制結算)
          </button>
        </section>

        {/* Results Section */}
        {result && (
          <div className="animate-fade-in space-y-8">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h2 className="text-xl font-bold text-slate-800">計算結果 (曆年制 - 期初基準)</h2>
                   <p className="text-sm text-slate-500 mt-1">結算「前一年度」年資。除第一年外，特休計算區間統一自 1/1 起算。</p>
                </div>
             </div>

             <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-4 items-start">
               <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
               <div className="text-sm text-blue-800">
                 <p className="font-bold mb-1">計算邏輯說明</p>
                 <p className="mb-2">1. <span className="font-bold">滿半年特休 (3天)</span>：滿6個月時獨立發放。</p>
                 <p className="mb-2">2. <span className="font-bold">年度結算</span>：於每年 1/1 發放「前一年度」特休。</p>
                 <p className="mb-2">3. <span className="font-bold">級距認定</span>：依「結算年度 1/1」當下的年資決定該年度之特休天數。</p>
                 <p className="text-xs text-blue-600 mt-2 p-2 bg-blue-100/50 rounded">
                   註：第一年未滿一年依 7 天比例計算 (ex: 5.25天)。後續完整年度依期初年資級距給予完整天數 (ex: 2026年期初滿1年，給予7天)。
                 </p>
               </div>
             </div>

            <ResultCard entitlements={result.calendarYearEntitlements} />

            {/* AI Assistant Section */}
            <div className="border-t border-slate-200 pt-8">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-indigo-900">AI 人資助理</h3>
                </div>
                
                <p className="text-sm text-slate-600 mb-4">
                  需要發送通知給員工嗎？我可以協助您生成一份專業、溫暖的特休通知信草稿，解釋上述的計算邏輯。
                </p>

                {!aiExplanation ? (
                  <button 
                    onClick={handleAskAI}
                    disabled={loadingAi}
                    className="bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm shadow-sm"
                  >
                    {loadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {loadingAi ? '正在撰寫...' : '生成通知信草稿'}
                  </button>
                ) : (
                  <div className="bg-white rounded-xl p-4 border border-indigo-100 shadow-sm">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                      {aiExplanation}
                    </pre>
                    <div className="mt-4 flex justify-end">
                       <button 
                         onClick={() => {navigator.clipboard.writeText(aiExplanation)}}
                         className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                       >
                         複製內容
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;