import React from 'react';
import { FunnelStage, CalculatedMetrics } from '../types';

// --- Comparative Funnel (Meta vs Realized) ---

interface FunnelChartProps {
  meta: FunnelStage;
  realized: FunnelStage;
  metrics: CalculatedMetrics;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({ meta, realized, metrics }) => {
  
  const renderStep = (
    label: string, 
    metaVal: number, 
    realVal: number, 
    color: string, 
    rateReal?: number, 
    rateMeta?: number,
    zIndex: number = 0
  ) => {
    // Calculate simple comparison for coloring
    const isMeetingMeta = realVal >= metaVal;

    return (
      <div className="flex flex-col relative" style={{ zIndex }}>
         {/* Rate Bubble between steps */}
         {rateReal !== undefined && rateMeta !== undefined && (
             <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-50 w-max pointer-events-none">
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 shadow-xl px-3 py-1 rounded-full text-xs font-bold text-zinc-400">
                    <span className="text-zinc-600 font-mono">{rateMeta.toFixed(0)}%</span>
                    <span className="text-zinc-700">→</span>
                    <span className={rateReal >= rateMeta ? 'text-emerald-400' : 'text-rose-400'}>
                        {rateReal.toFixed(1)}%
                    </span>
                </div>
             </div>
         )}

        <div className="flex items-stretch h-16 sm:h-20">
            {/* Meta Column */}
            <div className="flex-1 bg-zinc-900/50 flex items-center justify-end px-4 border-r-2 border-dashed border-zinc-800 rounded-l-lg relative overflow-hidden group">
                <div className="relative z-10 text-right">
                    <span className="block text-xl sm:text-2xl font-bold text-zinc-600 group-hover:text-zinc-500 transition-colors">{metaVal}</span>
                    <span className="block text-[10px] uppercase tracking-wider text-zinc-700">Meta</span>
                </div>
            </div>

            {/* Label Center */}
            <div className={`w-32 sm:w-40 flex items-center justify-center ${color} text-white font-bold text-sm sm:text-base shadow-lg shadow-black/50 z-40 rounded-sm relative border border-white/10`}>
               {label.toUpperCase()}
            </div>

            {/* Realized Column */}
            <div className="flex-1 bg-zinc-900 border border-zinc-800 flex items-center justify-start px-4 rounded-r-lg relative overflow-hidden group shadow-sm">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isMeetingMeta ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></div>
                <div className="relative z-10 text-left">
                    <span className={`block text-xl sm:text-2xl font-bold ${isMeetingMeta ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {realVal}
                    </span>
                    <span className="block text-[10px] uppercase tracking-wider text-zinc-500">Realizado</span>
                </div>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full py-6">
      {renderStep(
          'Leads', 
          meta.leads, 
          realized.leads, 
          'bg-gradient-to-r from-blue-900 to-blue-800',
          undefined,
          undefined,
          10
      )}
      
      <div className="h-10 w-full flex justify-center items-center relative z-0">
         <div className="w-px h-full bg-zinc-800"></div>
      </div>

      {renderStep(
          'Contatos Feitos', 
          meta.appointments, 
          realized.appointments, 
          'bg-gradient-to-r from-indigo-900 to-indigo-800',
          metrics.conversion.leadToAppt.realized,
          metrics.conversion.leadToAppt.meta,
          20
      )}

      <div className="h-10 w-full flex justify-center items-center relative z-0">
         <div className="w-px h-full bg-zinc-800"></div>
      </div>

      {renderStep(
          'Cotações', 
          meta.visits, 
          realized.visits, 
          'bg-gradient-to-r from-purple-900 to-purple-800',
          metrics.conversion.apptToVisit.realized,
          metrics.conversion.apptToVisit.meta,
          30
      )}

      <div className="h-10 w-full flex justify-center items-center relative z-0">
         <div className="w-px h-full bg-zinc-800"></div>
      </div>

      {renderStep(
          'Adesões', 
          meta.sales, 
          realized.sales, 
          'bg-gradient-to-r from-emerald-900 to-emerald-800',
          metrics.conversion.visitToSale.realized,
          metrics.conversion.visitToSale.meta,
          40
      )}
    </div>
  );
};

// --- Single Funnel Component (Tapered) ---

interface SingleFunnelProps {
  data: FunnelStage;
  title: string;
  type: 'projected' | 'realized';
  comparisonData?: FunnelStage;
  costs?: {
    cpl?: number;
    cpa?: number;
    cpv?: number;
    cac?: number;
  };
}

export const SingleFunnel: React.FC<SingleFunnelProps> = ({ data, title, type, comparisonData, costs }) => {
  // Helper to get display rate. 
  const getDisplayRate = (part: number, whole: number, projectedFixedRate?: string) => {
    if (type === 'projected' && projectedFixedRate) {
        return projectedFixedRate;
    }
    return whole > 0 ? ((part / whole) * 100).toFixed(1) + '%' : '0%';
  };

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Logic for Step Color
  const getStepColor = (currentVal: number, targetVal?: number) => {
    if (type === 'projected') {
        // Neon Brand Colors for Projected
        return 'bg-gradient-to-r from-cyan-900/80 to-blue-900/80 border border-cyan-500/30';
    }
    
    // Realized Logic (Traffic Light - Dark Mode)
    if (targetVal === undefined || targetVal === 0) return 'bg-zinc-800';
    
    const percentage = currentVal / targetVal;
    
    if (percentage >= 1.0) return 'bg-emerald-900/80 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]'; // Met Target
    if (percentage >= 0.8) return 'bg-amber-900/80 border border-amber-500/30';   // Close
    return 'bg-rose-900/80 border border-rose-500/30';                            // Far
  };

  const Step = ({ label, value, color, rate, icon, widthClass, cost, costLabel }: any) => (
    <div className={`relative group mx-auto ${widthClass} transition-all duration-500`}>
      {/* Funnel Shape CSS */}
      <div className={`${color} text-white p-3 rounded-lg shadow-lg flex justify-between items-center relative z-10 transition-colors duration-300 backdrop-blur-sm`}>
        <div className="flex items-center gap-3">
          <span className="opacity-80 text-cyan-200">{icon}</span>
          <span className="font-bold text-xs sm:text-sm uppercase tracking-wide">{label}</span>
        </div>
        <span className="font-black text-xl tracking-tight">{value}</span>
      </div>
      
      {/* Conversion Badge (if rate exists) */}
      {rate && (
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-20">
             <span className="bg-zinc-950 text-cyan-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-zinc-700 shadow-md whitespace-nowrap">
               {rate}
             </span>
        </div>
      )}

      {/* Cost Badge (Right Side) */}
      {cost !== undefined && (
        <div className="absolute left-[100%] top-1/2 -translate-y-1/2 ml-3 w-max hidden sm:block z-0 animate-fade-in">
           <div className="flex flex-col justify-center bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-md shadow-lg">
             <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight">{costLabel}</span>
             <span className="text-sm font-bold text-zinc-200">{formatMoney(cost)}</span>
           </div>
        </div>
      )}
    </div>
  );

  const Connector = () => (
    <div className="h-6 w-full flex justify-center items-center">
       <div className="w-px h-full bg-zinc-800"></div>
    </div>
  );

  return (
    <div className={`p-6 rounded-2xl border h-full ${type === 'projected' ? 'bg-[#121215] border-zinc-800' : 'bg-[#121215] border-zinc-800 shadow-lg'}`}>
      <div className="flex items-center justify-between mb-8">
         <h3 className="font-bold text-white text-lg tracking-tight">{title}</h3>
         <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-widest ${type === 'projected' ? 'bg-zinc-800 text-zinc-400' : 'bg-cyan-950 text-cyan-400'}`}>
            {type === 'projected' ? 'META' : 'REAL'}
         </span>
      </div>

      <div className="flex flex-col items-center">
        <Step 
          label="Leads" 
          value={data.leads} 
          widthClass="w-full"
          color={getStepColor(data.leads, comparisonData?.leads)} 
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          cost={costs?.cpl}
          costLabel="CPL"
        />
        <Connector />
        <Step 
          label="Contatos Feitos" 
          value={data.appointments} 
          widthClass="w-[85%]"
          color={getStepColor(data.appointments, comparisonData?.appointments)}
          rate={getDisplayRate(data.appointments, data.leads, '70%')}
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          cost={costs?.cpa}
          costLabel="Custo p/ Contato"
        />
        <Connector />
        <Step 
          label="Cotações" 
          value={data.visits} 
          widthClass="w-[70%]"
          color={getStepColor(data.visits, comparisonData?.visits)}
          rate={getDisplayRate(data.visits, data.appointments, '60%')}
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          cost={costs?.cpv}
          costLabel="Custo p/ Cotação"
        />
        <Connector />
        <Step 
          label="Adesões" 
          value={data.sales} 
          widthClass="w-[55%]"
          color={getStepColor(data.sales, comparisonData?.sales)}
          rate={getDisplayRate(data.sales, data.visits, '20%')}
          icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          cost={costs?.cac}
          costLabel="Custo p/ Adesão"
        />
      </div>
    </div>
  );
};