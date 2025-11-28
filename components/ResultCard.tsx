import React from 'react';
import { LeaveEntitlement } from '../types';
import { Calendar, Calculator, Clock } from 'lucide-react';

interface ResultCardProps {
  entitlements: LeaveEntitlement[];
}

const ResultCard: React.FC<ResultCardProps> = ({ entitlements }) => {
  return (
    <div className="space-y-4">
      {entitlements.map((item, idx) => (
        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          {item.source.includes('滿半年') && (
            <div className="absolute top-0 right-0 bg-brand-500 text-white text-xs px-2 py-1 rounded-bl-lg font-bold">
              法定里程碑
            </div>
          )}
          
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-500" />
                {item.source}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                使用期間: {item.periodStart.toLocaleDateString()} ~ {item.periodEnd.toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <span className="block text-3xl font-extrabold text-brand-600">
                {item.days} <span className="text-sm font-normal text-slate-500">天</span>
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 border border-slate-100 flex items-start gap-2">
            <Calculator className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
            <span>計算公式: {item.calculationDetails}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResultCard;