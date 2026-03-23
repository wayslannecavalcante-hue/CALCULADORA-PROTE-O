import React, { useState, useMemo } from 'react';
import { FunnelData, CalculatedMetrics, FunnelStage } from '../types';
import { generateActionPlan } from '../services/geminiService';
import { generatePDF } from '../services/pdfService';
import { FunnelChart, SingleFunnel } from './FunnelChart';
import { ComparisonChart } from './ComparisonChart';
import ReactMarkdown from 'react-markdown';

const FunnelTracker: React.FC = () => {
  // Config state for inputs
  const [metaConfig, setMetaConfig] = useState({
    investment: 5000,
    targetCpl: 15.00, // CPL Meta
  });

  const [realizedInputs, setRealizedInputs] = useState({
    investment: 5000,
    ticketAvg: 350, // Ticket médio ajustado para adesão/mensalidade comum em PV
    leads: 0,
    appointments: 0, // Agora representa Contatos Feitos
    visits: 0,       // Agora representa Cotações
    sales: 0,        // Adesões
  });

  const [loading, setLoading] = useState(false);
  const [importingReportei, setImportingReportei] = useState(false);
  const [actionPlan, setActionPlan] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(true);

  // --- Automatic Calculations ---
  
  // 1. Calculate Projected Funnel (Meta) based on fixed conversion rates
  // Logic: Leads -> Contato (70%) -> Cotação (60%) -> Adesão (20%) = 8.4% Overall
  const metaFunnel: FunnelStage = useMemo(() => {
    // Avoid division by zero
    const leads = metaConfig.targetCpl > 0 ? Math.floor(metaConfig.investment / metaConfig.targetCpl) : 0;
    
    const appointments = Math.floor(leads * 0.70); // 70% Contato Feito
    const visits = Math.floor(appointments * 0.60); // 60% Cotação
    const sales = Math.floor(visits * 0.20);      // 20% Adesão

    return { leads, appointments, visits, sales };
  }, [metaConfig]);

  // 2. Realized Funnel (Direct from inputs)
  const realizedFunnel: FunnelStage = {
    leads: realizedInputs.leads,
    appointments: realizedInputs.appointments,
    visits: realizedInputs.visits,
    sales: realizedInputs.sales,
  };

  // 3. Consolidated Data Object
  const fullData: FunnelData = {
    metaConfig,
    realizedInputs,
    meta: metaFunnel,
    realized: realizedFunnel
  };

  // 4. Calculate Unit Economics & Rates
  const metrics = useMemo((): CalculatedMetrics => {
    const calcSafe = (num: number, den: number) => (den > 0 ? num / den : 0);
    const calcPerc = (num: number, den: number) => calcSafe(num, den) * 100;

    const revenueMeta = metaFunnel.sales * realizedInputs.ticketAvg;
    const revenueRealized = realizedInputs.sales * realizedInputs.ticketAvg;

    return {
      cpl: {
        meta: metaConfig.targetCpl,
        realized: calcSafe(realizedInputs.investment, realizedInputs.leads)
      },
      cpa: {
        meta: calcSafe(metaConfig.investment, metaFunnel.appointments),
        realized: calcSafe(realizedInputs.investment, realizedInputs.appointments)
      },
      cpv: {
        meta: calcSafe(metaConfig.investment, metaFunnel.visits),
        realized: calcSafe(realizedInputs.investment, realizedInputs.visits)
      },
      cac: {
        meta: calcSafe(metaConfig.investment, metaFunnel.sales),
        realized: calcSafe(realizedInputs.investment, realizedInputs.sales)
      },
      roas: {
        meta: calcSafe(revenueMeta, metaConfig.investment),
        realized: calcSafe(revenueRealized, realizedInputs.investment)
      },
      revenue: {
        meta: revenueMeta,
        realized: revenueRealized
      },
      conversion: {
        leadToAppt: {
          meta: 70.0, // Benchmark Contato
          realized: calcPerc(realizedInputs.appointments, realizedInputs.leads)
        },
        apptToVisit: {
          meta: 60.0, // Benchmark Cotação
          realized: calcPerc(realizedInputs.visits, realizedInputs.appointments)
        },
        visitToSale: {
          meta: 20.0, // Benchmark Adesão
          realized: calcPerc(realizedInputs.sales, realizedInputs.visits)
        },
        overall: {
          meta: calcPerc(metaFunnel.sales, metaFunnel.leads),
          realized: calcPerc(realizedInputs.sales, realizedInputs.leads)
        }
      }
    };
  }, [metaConfig, realizedInputs, metaFunnel]);

  // --- Handlers ---

  const handleMetaChange = (field: string, value: string) => {
    setMetaConfig(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleRealizedChange = (field: string, value: string) => {
    setRealizedInputs(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleSimulateReportei = () => {
    setImportingReportei(true);
    // Simulate API delay
    setTimeout(() => {
      // Set a random realistic number relative to investment to simulate "Fetch"
      const simulatedLeads = Math.floor(realizedInputs.investment / (Math.random() * (20 - 10) + 10)); 
      setRealizedInputs(prev => ({ ...prev, leads: simulatedLeads }));
      setImportingReportei(false);
    }, 1000);
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    setActionPlan(null);
    setIsEditing(false);
    const plan = await generateActionPlan(fullData, metrics);
    setActionPlan(plan);
    setLoading(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-10 animate-fade-in" id="tracker-content">
       {/* Actions Bar */}
       <div className="flex flex-wrap justify-end items-center gap-4">
            <button 
              onClick={() => generatePDF('tracker-content', 'Relatorio_Acompanhamento_PV')}
              className="text-sm font-semibold px-5 py-2.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all duration-300 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              BAIXAR PDF
            </button>

            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-300 ${
                isEditing 
                ? 'bg-zinc-800 text-zinc-400 hover:text-white' 
                : 'text-cyan-400 hover:bg-cyan-950/30 border border-transparent hover:border-cyan-500/50'
              }`}
            >
              {isEditing ? 'Ocultar Entradas' : 'Editar Dados'}
            </button>
            <button
              onClick={handleGeneratePlan}
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  PROCESSANDO
                </>
              ) : (
                'GERAR PLANO AI'
              )}
            </button>
       </div>

        {/* --- Input Section (Collapsible) --- */}
        {isEditing && (
          <div className="bg-[#18181b] rounded-2xl border border-zinc-800 p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-white">
              <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
              Configuração & Dados - Proteção Veicular
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Projection Config */}
              <div className="space-y-6 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-cyan-500/10 transition-colors duration-500"></div>
                
                <div>
                  <h3 className="font-bold text-zinc-200 mb-2 flex items-center gap-2">
                    1. Planejamento (Meta)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Benchmarks PV: 
                    <span className="text-cyan-400 mx-1">70% Contato</span> •
                    <span className="text-cyan-400 mx-1">60% Cotação</span> •
                    <span className="text-cyan-400 mx-1">20% Adesão</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Investimento Previsto</label>
                    <div className="relative group">
                       <span className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-cyan-400 transition-colors">R$</span>
                       <input 
                         type="number" 
                         value={metaConfig.investment} 
                         onChange={(e) => handleMetaChange('investment', e.target.value)} 
                         className="w-full pl-10 p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all font-mono" 
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">CPL Alvo (Meta)</label>
                    <div className="relative group">
                       <span className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-cyan-400 transition-colors">R$</span>
                       <input 
                         type="number" 
                         value={metaConfig.targetCpl} 
                         onChange={(e) => handleMetaChange('targetCpl', e.target.value)} 
                         className="w-full pl-10 p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all font-mono" 
                       />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 mt-2">
                   <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Leads Projetados:</span>
                      <span className="font-bold text-cyan-400 text-lg">{metaFunnel.leads}</span>
                   </div>
                </div>
              </div>

              {/* Right Column: Realized Inputs */}
              <div className="space-y-6 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-500"></div>
                
                <h3 className="font-bold text-zinc-200 mb-2 flex items-center gap-2">
                    2. Resultados (Realizado)
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Investimento Realizado</label>
                        <div className="relative group">
                          <span className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-purple-400 transition-colors">R$</span>
                          <input 
                            type="number" 
                            value={realizedInputs.investment} 
                            onChange={(e) => handleRealizedChange('investment', e.target.value)}
                            className="w-full pl-10 p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all font-mono" 
                          />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Adesão Média (R$)</label>
                        <div className="relative group">
                          <span className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-purple-400 transition-colors">R$</span>
                          <input 
                            type="number" 
                            value={realizedInputs.ticketAvg} 
                            onChange={(e) => handleRealizedChange('ticketAvg', e.target.value)}
                            className="w-full pl-10 p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all font-mono" 
                          />
                        </div>
                    </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                       <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Leads</label>
                       <button 
                        onClick={handleSimulateReportei}
                        disabled={importingReportei}
                        className="text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1 rounded border border-zinc-700 hover:border-zinc-500 transition-all"
                       >
                         {importingReportei ? 'Sincronizando...' : '↻ REPORTEI'}
                       </button>
                    </div>
                    <input 
                      type="number" 
                      value={realizedInputs.leads} 
                      onChange={(e) => handleRealizedChange('leads', e.target.value)} 
                      className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all" 
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Contatos Feitos</label>
                      <input type="number" value={realizedInputs.appointments} onChange={(e) => handleRealizedChange('appointments', e.target.value)} className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Cotações</label>
                      <input type="number" value={realizedInputs.visits} onChange={(e) => handleRealizedChange('visits', e.target.value)} className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Adesões</label>
                      <input type="number" value={realizedInputs.sales} onChange={(e) => handleRealizedChange('sales', e.target.value)} className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Top KPIs Cards --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard 
            label="INVESTIMENTO" 
            value={formatCurrency(realizedInputs.investment)} 
            icon={<span className="text-zinc-600">💰</span>}
            subValue={`Meta: ${formatCurrency(metaConfig.investment)}`}
            className="bg-[#18181b] border-zinc-800"
          />
          <KPICard 
            label="CPL REALIZADO" 
            value={formatCurrency(metrics.cpl.realized)}
            subValue={`Meta: ${formatCurrency(metrics.cpl.meta)}`}
            status={metrics.cpl.realized <= metrics.cpl.meta ? 'good' : 'bad'}
            icon={<span className="text-cyan-500">🎯</span>}
            className="bg-[#18181b] border-zinc-800"
          />
          <KPICard 
            label="CAC REALIZADO" 
            value={formatCurrency(metrics.cac.realized)}
            subValue={`Meta: ${formatCurrency(metrics.cac.meta)}`}
            status={metrics.cac.realized <= metrics.cac.meta ? 'good' : 'bad'}
            icon={<span className="text-purple-500">🏷️</span>}
            className="bg-[#18181b] border-zinc-800"
          />
           <KPICard 
            label="ROAS" 
            value={`${metrics.roas.realized.toFixed(2)}x`}
            subValue={`Meta: ${metrics.roas.meta.toFixed(2)}x`}
            status={metrics.roas.realized >= metrics.roas.meta ? 'good' : 'bad'}
            icon={<span className="text-emerald-500">📈</span>}
            className="bg-[#18181b] border-zinc-800"
          />
        </div>

        {/* --- Single Funnels Section --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SingleFunnel data={metaFunnel} title="Funil Projetado" type="projected" />
            <SingleFunnel 
               data={realizedFunnel} 
               title="Funil Realizado" 
               type="realized" 
               comparisonData={metaFunnel} 
               costs={{
                 cpl: metrics.cpl.realized,
                 cpa: metrics.cpa.realized,
                 cpv: metrics.cpv.realized,
                 cac: metrics.cac.realized
               }}
            />
        </div>

        {/* --- Side by Side Funnels (Comparative) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-[#18181b] rounded-2xl border border-zinc-800 p-8 shadow-lg">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">COMPARATIVO</h2>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Volume de Funil</p>
                </div>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-zinc-600 rounded-full"></div>
                      <span className="text-zinc-400">Meta</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                      <span className="text-cyan-400">Realizado</span>
                   </div>
                </div>
              </div>
              
              <FunnelChart meta={metaFunnel} realized={realizedFunnel} metrics={metrics} />
           </div>

           {/* --- Charts & Economics --- */}
           <div className="space-y-6">
              <ComparisonChart meta={metaFunnel} realized={realizedFunnel} />
              
              <div className="bg-[#18181b] rounded-2xl border border-zinc-800 overflow-hidden shadow-lg">
                <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                   <h3 className="font-bold text-white tracking-tight">UNIT ECONOMICS & TAXAS</h3>
                   <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Gap / Desvio</span>
                </div>
                <div className="divide-y divide-zinc-800/50">
                   <UnitRow label="Custo por Lead (CPL)" actual={metrics.cpl.realized} meta={metrics.cpl.meta} isCurrency />
                   <UnitRow label="Taxa Lead → Contato" actual={metrics.conversion.leadToAppt.realized} meta={metrics.conversion.leadToAppt.meta} suffix="%" />
                   <UnitRow label="Taxa Contato → Cotação" actual={metrics.conversion.apptToVisit.realized} meta={metrics.conversion.apptToVisit.meta} suffix="%" />
                   <UnitRow label="Taxa Cotação → Adesão" actual={metrics.conversion.visitToSale.realized} meta={metrics.conversion.visitToSale.meta} suffix="%" />
                   <UnitRow label="Taxa Geral (Leads → Adesões)" actual={metrics.conversion.overall.realized} meta={metrics.conversion.overall.meta} suffix="%" />
                </div>
              </div>
           </div>
        </div>

        {/* --- Action Plan (Gemini) --- */}
        {actionPlan && (
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl border border-cyan-900/50 p-10 animate-fade-in relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 right-0 p-4 opacity-20 text-cyan-500">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-48 w-48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
             </div>
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600"></div>
             
             <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3 relative z-10">
                <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-black text-xs px-2 py-1 rounded font-bold">AI</span>
                PLANO DE AÇÃO ESTRATÉGICO
             </h2>
             <div className="prose prose-invert prose-cyan max-w-none relative z-10">
                <ReactMarkdown>{actionPlan}</ReactMarkdown>
             </div>
          </div>
        )}
    </div>
  );
};

// --- Helper Components reused within Tracker ---

const KPICard: React.FC<{ 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  subValue?: string; 
  status?: 'good' | 'bad' | 'neutral'; 
  className?: string;
}> = ({ label, value, icon, subValue, status = 'neutral', className }) => {
  const statusColor = status === 'good' ? 'text-emerald-400' : status === 'bad' ? 'text-rose-400' : 'text-zinc-500';
  
  return (
    <div className={`p-6 rounded-2xl shadow-lg border ${className} hover:border-zinc-700 transition-colors`}>
      <div className="flex justify-between items-start mb-3">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</p>
        <span className="text-xl opacity-80">{icon}</span>
      </div>
      <p className="text-3xl font-black text-white tracking-tight">{value}</p>
      {subValue && (
        <p className={`text-xs font-bold mt-2 ${statusColor} bg-zinc-900/50 inline-block px-2 py-1 rounded`}>
          {subValue}
        </p>
      )}
    </div>
  );
};

const UnitRow: React.FC<{ label: string; actual: number; meta: number; isCurrency?: boolean; suffix?: string }> = ({ label, actual, meta, isCurrency, suffix = '' }) => {
  const format = (v: number) => isCurrency 
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
    : v.toFixed(1) + suffix;
    
  const isCost = label.includes('Custo') || label.includes('CPL') || label.includes('CPA') || label.includes('CAC');
  const isGood = isCost ? actual <= meta : actual >= meta;

  const diff = actual - meta;
  const absDiff = Math.abs(diff);
  
  const diffFormatted = isCurrency
     ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(absDiff)
     : absDiff.toFixed(1) + suffix;

  let gapText = '';
  if (diff === 0) {
      gapText = 'NA META';
  } else if (isCost) {
      if (diff > 0) gapText = `+${diffFormatted}`; 
      else gapText = `-${diffFormatted}`; 
  } else {
      if (diff > 0) gapText = `+${diffFormatted}`; 
      else gapText = `-${diffFormatted}`; 
  }

  const badgeColor = isGood 
    ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50' 
    : 'bg-rose-950/30 text-rose-400 border-rose-900/50';

  return (
    <div className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800/30 transition-colors group">
      <span className="text-sm font-medium text-zinc-400 w-1/3 group-hover:text-white transition-colors">{label}</span>
      
      <div className="flex items-center gap-4 flex-1 justify-end">
         {/* GAP Badge */}
         <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor} whitespace-nowrap`}>
            {gapText}
         </div>

        <div className="text-right min-w-[80px]">
          <p className="text-sm font-bold text-white">{format(actual)}</p>
          <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Realizado</p>
        </div>
        
        <div className="h-6 w-px bg-zinc-800"></div>
        
        <div className="text-right min-w-[80px]">
          <p className="text-sm font-medium text-zinc-500">{format(meta)}</p>
          <p className="text-[9px] text-zinc-700 uppercase tracking-widest font-bold">Meta</p>
        </div>
      </div>
    </div>
  );
};

export default FunnelTracker;