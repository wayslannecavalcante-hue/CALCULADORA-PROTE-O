import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { generatePDF } from '../services/pdfService';

const CampaignPlanner: React.FC = () => {
  // --- Estado dos Inputs ---
  const [inputs, setInputs] = useState({
    investment: 10000,
    ticketAvg: 350, // Adesão Média
    targetCpl: 15,  // CPL Meta padrão ajustado para 15
  });

  // --- Benchmarks (Taxas do Funil PV - Proteção Veicular) ---
  // Target: 8.4% Overall (0.7 * 0.6 * 0.2 = 0.084)
  const BENCHMARKS = {
    leadToAppt: 0.70,  // 70% Contato Feito
    apptToVisit: 0.60, // 60% Cotação
    visitToSale: 0.20, // 20% Fechamento (Adesão)
  };

  // --- Cálculos Automáticos ---
  
  const metrics = useMemo(() => {
    // Volume
    const leads = inputs.targetCpl > 0 ? Math.floor(inputs.investment / inputs.targetCpl) : 0;
    
    // Projeção do Funil (Baseada nos Benchmarks)
    const appointments = Math.floor(leads * BENCHMARKS.leadToAppt);
    const visits = Math.floor(appointments * BENCHMARKS.apptToVisit);
    
    // Vendas Projetadas (Resultado final do funil)
    const salesProjected = Math.floor(visits * BENCHMARKS.visitToSale);

    // Custos por Etapa (Projetado)
    const costPerAppt = appointments > 0 ? inputs.investment / appointments : 0;
    const costPerVisit = visits > 0 ? inputs.investment / visits : 0;
    const costPerSale = salesProjected > 0 ? inputs.investment / salesProjected : 0; // CAC Projetado pelo funil
    
    // Taxas de Conversão (Leads -> Vendas)
    const conversionRateMin = 5.0; // 5% (Cenário Ruim)
    // A Taxa Ideal é a do funil (~8.4%)
    const conversionRateIdeal = leads > 0 ? (salesProjected / leads) * 100 : 0;

    // Cenários de Vendas
    const salesMin = Math.floor(leads * (conversionRateMin / 100));
    // IMPORTANTE: Sales Ideal = Sales Projetado do Funil (para baterem os valores)
    const salesIdeal = salesProjected;

    // Cenários Financeiros
    const revenueMin = salesMin * inputs.ticketAvg;
    const revenueIdeal = salesIdeal * inputs.ticketAvg;
    
    // Lucro (Margem de 15% sobre o faturamento total)
    const profitMargin = 0.15; 
    const profitMin = revenueMin * profitMargin;
    const profitIdeal = revenueIdeal * profitMargin;

    // CAC
    const cacMin = salesMin > 0 ? inputs.investment / salesMin : 0;
    // IMPORTANTE: CAC Ideal agora é idêntico ao CAC do Funil
    const cacIdeal = salesIdeal > 0 ? inputs.investment / salesIdeal : 0;

    // ROAS (Faturamento / Investimento)
    const roasMin = inputs.investment > 0 ? revenueMin / inputs.investment : 0;
    const roasIdeal = inputs.investment > 0 ? revenueIdeal / inputs.investment : 0;
    
    // ROAS Lucro (Lucro / Investimento)
    const roasProfitMin = inputs.investment > 0 ? profitMin / inputs.investment : 0;
    const roasProfitIdeal = inputs.investment > 0 ? profitIdeal / inputs.investment : 0;

    return {
      leads,
      funnel: {
        appointments,
        visits,
        sales: salesProjected,
        costs: {
            appt: costPerAppt,
            visit: costPerVisit,
            sale: costPerSale
        }
      },
      scenarios: {
        min: { sales: salesMin, revenue: revenueMin, profit: profitMin, cac: cacMin, roas: roasMin, roasProfit: roasProfitMin },
        ideal: { sales: salesIdeal, revenue: revenueIdeal, profit: profitIdeal, cac: cacIdeal, roas: roasIdeal, roasProfit: roasProfitIdeal }
      },
      rates: {
        min: conversionRateMin,
        ideal: conversionRateIdeal
      }
    };
  }, [inputs]);

  // --- Matriz de Cenários (Rodapé) ---
  const matrix = useMemo(() => {
    
    const createScenario = (cpl: number, convRate: number) => {
        const leads = cpl > 0 ? Math.floor(inputs.investment / cpl) : 0;
        const sales = Math.floor(leads * (convRate / 100));
        const revenue = sales * inputs.ticketAvg;
        const profit = revenue * 0.15; // Margem 15%
        const cac = sales > 0 ? inputs.investment / sales : 0;
        const roasProfit = inputs.investment > 0 ? profit / inputs.investment : 0;
        
        return { cpl, convRate, leads, sales, revenue, profit, cac, roasProfit, ticket: inputs.ticketAvg };
    };

    return {
        // Ruim: 5% conversão e cpl 30 reais
        bad: createScenario(30.00, 5.0),  
        
        // Bom: 8% conversão e cpl 20 reais
        good: createScenario(20.00, 8.0), 
        
        // Meta: 10% de conversão e cpl 15 reais
        target: createScenario(15.00, 10.0) 
    };
  }, [inputs]);


  // --- Formatadores ---
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatNumber = (val: number) => new Intl.NumberFormat('pt-BR').format(val);

  // --- Dados para Gráficos ---
  const salesChartData = [
    { name: 'Mínimo', Vendas: metrics.scenarios.min.sales },
    { name: 'Ideal', Vendas: metrics.scenarios.ideal.sales },
  ];

  const roasChartData = [
    { name: 'Mínimo', ROAS: metrics.scenarios.min.roas },
    { name: 'Ideal', ROAS: metrics.scenarios.ideal.roas },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10" id="planner-content">
      
      {/* 1. Header & Inputs */}
      <div className="bg-[#18181b] rounded-2xl border border-zinc-800 p-8 shadow-xl relative overflow-hidden">
        
        {/* Absolute Button Top Right */}
        <div className="absolute top-8 right-8 z-20">
            <button 
              onClick={() => generatePDF('planner-content', 'Relatorio_Planejamento_PV')}
              className="text-xs font-semibold px-4 py-2 rounded-full border border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all duration-300 flex items-center gap-2 backdrop-blur-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              BAIXAR PDF
            </button>
        </div>

        <div className="relative z-10 mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-cyan-400 bg-cyan-950/30 p-2 rounded-lg">📊</span> 
                Planejador de Campanhas - Proteção Veicular
            </h2>
            <p className="text-zinc-500 text-sm mt-1 ml-11">Simule cenários e defina metas baseadas no seu investimento.</p>
        </div>

        <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800/50 relative z-10">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                Dados de Entrada
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputGroup label="Investimento (R$)" value={inputs.investment} onChange={(v) => setInputs({...inputs, investment: Number(v)})} />
                <InputGroup label="Adesão Média (R$)" value={inputs.ticketAvg} onChange={(v) => setInputs({...inputs, ticketAvg: Number(v)})} />
                <InputGroup label="Meta de CPL (R$)" value={inputs.targetCpl} onChange={(v) => setInputs({...inputs, targetCpl: Number(v)})} />
            </div>
        </div>
      </div>

      {/* 2. Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <InfoCard label="Investimento" value={formatCurrency(inputs.investment)} icon="💰" />
         <InfoCard label="Meta de CPL" value={formatCurrency(inputs.targetCpl)} icon="🎯" />
         <InfoCard label="Leads Projetados" value={formatNumber(metrics.leads)} icon="👥" highlight />
         
         {/* Card Duplo de Taxa */}
         <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-xl flex flex-col justify-center gap-3 shadow-lg">
             <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-zinc-500 uppercase">Conv. Mínima</span>
                 <span className="text-sm font-black text-white bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                    {metrics.rates.min.toFixed(0)}%
                 </span>
             </div>
             <div className="w-full h-px bg-zinc-800"></div>
             <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-emerald-500 uppercase">Conv. Ideal (Funil)</span>
                 <span className="text-lg font-black text-emerald-400">
                    {metrics.rates.ideal.toFixed(1)}%
                 </span>
             </div>
         </div>
      </div>

      {/* 3. Funnel Visualization (Com Custos) */}
      <div className="bg-[#18181b] rounded-2xl border border-zinc-800 p-8 shadow-xl">
         <div className="flex justify-between items-end mb-8">
            <div>
                <h3 className="text-lg font-bold text-white mb-1">Projeção de Funil</h3>
                <p className="text-zinc-500 text-xs">Custos estimados por etapa com base no investimento total (Benchmarks: 70%/60%/20%).</p>
            </div>
         </div>

         <div className="flex flex-col items-center gap-2 max-w-3xl mx-auto">
            <FunnelBar 
                label="Leads" 
                value={metrics.leads} 
                cost={inputs.targetCpl}
                color="bg-gradient-to-r from-blue-700 to-blue-600" 
                width="100%" 
            />
            <FunnelBar 
                label={`Contatos Feitos (${(BENCHMARKS.leadToAppt * 100).toFixed(0)}%)`} 
                value={metrics.funnel.appointments} 
                cost={metrics.funnel.costs.appt}
                color="bg-gradient-to-r from-indigo-700 to-indigo-600" 
                width="80%" 
            />
            <FunnelBar 
                label={`Cotações (${(BENCHMARKS.apptToVisit * 100).toFixed(0)}%)`} 
                value={metrics.funnel.visits} 
                cost={metrics.funnel.costs.visit}
                color="bg-gradient-to-r from-purple-700 to-purple-600" 
                width="60%" 
            />
            <FunnelBar 
                label={`Adesões (${(BENCHMARKS.visitToSale * 100).toFixed(0)}%)`} 
                value={metrics.funnel.sales} 
                cost={metrics.funnel.costs.sale} // CAC Projetado (Funil Padrão)
                color="bg-gradient-to-r from-emerald-600 to-emerald-500" 
                width="40%" 
            />
         </div>
      </div>

      {/* 4. Metas e CAC */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Metas de Vendas */}
         <div className="bg-[#18181b] rounded-2xl border border-zinc-800 p-6 shadow-lg">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-cyan-500">★</span> Metas de Adesões
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl hover:bg-amber-500/10 transition-colors">
                    <span className="text-[10px] text-amber-500 uppercase font-bold tracking-wider">Mínimo (5%)</span>
                    <div className="text-3xl font-black text-amber-500 mt-2">{metrics.scenarios.min.sales}</div>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl hover:bg-emerald-500/10 transition-colors">
                    <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">Ideal (Funil)</span>
                    <div className="text-3xl font-black text-emerald-500 mt-2">{metrics.scenarios.ideal.sales}</div>
                </div>
            </div>
         </div>

         {/* CAC */}
         <div className="bg-[#18181b] rounded-2xl border border-zinc-800 p-6 shadow-lg">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-purple-500">🏷️</span> Custo de Aquisição (CAC)
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-xl hover:bg-rose-500/10 transition-colors">
                    <span className="text-[10px] text-rose-500 uppercase font-bold tracking-wider">Máximo Aceitável</span>
                    <div className="text-2xl font-black text-rose-500 mt-2">{formatCurrency(metrics.scenarios.min.cac)}</div>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl hover:bg-blue-500/10 transition-colors">
                    <span className="text-[10px] text-blue-500 uppercase font-bold tracking-wider">Meta Ideal</span>
                    <div className="text-2xl font-black text-blue-500 mt-2">{formatCurrency(metrics.scenarios.ideal.cac)}</div>
                </div>
            </div>
         </div>
      </div>

      {/* 5. Financeiro (Faturamento, Lucro, ROAS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <FinancialCard 
            title="Faturamento Estimado" 
            icon="$"
            minVal={metrics.scenarios.min.revenue} 
            idealVal={metrics.scenarios.ideal.revenue} 
            isCurrency 
         />
         <FinancialCard 
            title="Lucro Líquido (15%)" 
            icon="☆"
            minVal={metrics.scenarios.min.profit} 
            idealVal={metrics.scenarios.ideal.profit} 
            isCurrency 
            textColor="text-zinc-200"
         />
         
         <div className="bg-[#18181b] rounded-2xl border border-zinc-800 p-6 flex flex-col justify-between shadow-lg">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-zinc-500">📈</span> ROAS
            </h3>
            <div className="space-y-4">
                <Row label="ROAS (Faturamento)" value={`${metrics.scenarios.min.roas.toFixed(1)}x`} idealValue={`${metrics.scenarios.ideal.roas.toFixed(1)}x`} />
                <div className="h-px bg-zinc-800 my-2"></div>
                <Row label="ROAS (Lucro)" value={metrics.scenarios.min.roasProfit.toFixed(1)} idealValue={metrics.scenarios.ideal.roasProfit.toFixed(1)} isProfit />
            </div>
         </div>
      </div>

      {/* 6. Gráficos Comparativos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <ChartCard title="Comparativo de Adesões" data={salesChartData} dataKey="Vendas" color="#10b981" />
         <ChartCard title="Comparativo de ROAS" data={roasChartData} dataKey="ROAS" color="#06b6d4" />
      </div>

      {/* 7. Matriz de Cenários */}
      <div className="bg-[#18181b] rounded-2xl border border-zinc-800 p-8 shadow-xl">
         <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-cyan-500">◎</span> Comparativo de Cenários por CPL
         </h3>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScenarioCard 
                title="Cenário Ruim" 
                subtitle={`CPL ${formatCurrency(matrix.bad.cpl)}`}
                badge={`${matrix.bad.convRate.toFixed(0)}% Conv.`}
                colorClass="bg-rose-950/30"
                borderColor="border-rose-900/50"
                accentColor="text-rose-500"
                data={matrix.bad}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
            />
            
            <ScenarioCard 
                title="Cenário Bom" 
                subtitle={`CPL ${formatCurrency(matrix.good.cpl)}`}
                badge={`${matrix.good.convRate.toFixed(0)}% Conv.`}
                colorClass="bg-amber-950/30"
                borderColor="border-amber-900/50"
                accentColor="text-amber-500"
                data={matrix.good}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
            />

            <ScenarioCard 
                title="Cenário Meta" 
                subtitle={`CPL ${formatCurrency(matrix.target.cpl)}`}
                badge={`${matrix.target.convRate.toFixed(0)}% Conv.`}
                colorClass="bg-emerald-950/30"
                borderColor="border-emerald-900/50"
                accentColor="text-emerald-500"
                data={matrix.target}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
                isTarget
            />
         </div>
      </div>
      
      {/* 8. Aviso Legal (Impostos) */}
      <div className="bg-yellow-900/10 border border-yellow-600/20 p-6 rounded-xl flex items-start gap-4">
         <div className="text-yellow-600 mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
         </div>
         <div className="space-y-2">
             <p className="text-yellow-500 font-bold text-sm uppercase tracking-wide">Atenção aos Impostos</p>
             <p className="text-zinc-400 text-sm leading-relaxed">
                A partir de janeiro de 2026, a Meta inclui impostos nas cobranças de anúncios, aumentando em cerca de <strong>12,15%</strong> o valor pago.
             </p>
             <p className="text-zinc-500 text-xs italic border-t border-yellow-600/10 pt-2 mt-2">
                Importante: Os cálculos na nossa ferramenta consideram o valor líquido disponível para os anúncios, sem incluir estes impostos.
             </p>
         </div>
      </div>

    </div>
  );
};

// --- Sub-Components ---

const InputGroup: React.FC<{ label: string; value: number; onChange: (val: string) => void }> = ({ label, value, onChange }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</label>
        <div className="relative group">
            <span className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-cyan-400 transition-colors">R$</span>
            <input 
                type="number" 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className="w-full pl-10 p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all font-mono" 
            />
        </div>
    </div>
);

const InfoCard: React.FC<{ label: string; value: string; icon: string; highlight?: boolean }> = ({ label, value, icon, highlight }) => (
    <div className={`p-4 rounded-xl border flex flex-col justify-center shadow-lg ${highlight ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-[#18181b] border-zinc-800'}`}>
        <div className="flex items-center gap-2 mb-2">
            <span className="text-lg opacity-80">{icon}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${highlight ? 'text-cyan-400' : 'text-zinc-500'}`}>{label}</span>
        </div>
        <div className={`text-2xl font-black ${highlight ? 'text-white' : 'text-zinc-200'}`}>{value}</div>
    </div>
);

// Funnel Bar Enhanced with Cost
const FunnelBar: React.FC<{ label: string; value: number; cost: number; color: string; width: string }> = ({ label, value, cost, color, width }) => (
    <div className={`relative h-14 flex items-center justify-between px-6 rounded-lg text-white shadow-lg mb-1 transition-all hover:scale-[1.01] group ${color}`} style={{ width }}>
        {/* Left: Label */}
        <div className="flex flex-col">
            <span className="text-sm font-bold drop-shadow-md flex items-center gap-2">
                {label}
            </span>
        </div>

        {/* Right: Value & Cost */}
        <div className="flex items-center gap-6">
             {/* Cost Pill */}
             <div className="hidden group-hover:flex flex-col items-end bg-black/20 px-3 py-1 rounded backdrop-blur-sm border border-white/10">
                 <span className="text-[9px] uppercase font-bold opacity-70">Custo Unit.</span>
                 <span className="text-xs font-mono font-bold text-white">
                     {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cost)}
                 </span>
             </div>

             <span className="text-2xl font-black drop-shadow-md">{new Intl.NumberFormat('pt-BR').format(value)}</span>
        </div>
    </div>
);

const FinancialCard: React.FC<{ title: string; icon: string; minVal: number; idealVal: number; isCurrency?: boolean; textColor?: string }> = ({ title, icon, minVal, idealVal, isCurrency, textColor = "text-zinc-100" }) => {
    const format = (v: number) => isCurrency ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : v;
    return (
        <div className="bg-[#18181b] rounded-2xl border border-zinc-800 p-6 flex flex-col h-full shadow-lg">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-zinc-500">{icon}</span> {title}
            </h3>
            <div className="flex-1 flex flex-col justify-center gap-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Mínimo</span>
                    <span className={`font-mono text-lg font-bold ${textColor}`}>{format(minVal)}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Ideal</span>
                    <span className={`font-mono text-lg font-bold text-emerald-400`}>{format(idealVal)}</span>
                </div>
            </div>
        </div>
    );
};

const Row: React.FC<{ label: string; value: string; idealValue: string; isProfit?: boolean }> = ({ label, value, idealValue, isProfit }) => (
    <div className="flex justify-between items-center">
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider w-1/3">{label}</span>
        <div className="flex items-center gap-4 flex-1 justify-end">
             <div className="text-right">
                 <span className={`block text-sm font-bold ${isProfit ? 'text-rose-400' : 'text-zinc-300'}`}>{value}</span>
                 <span className="text-[8px] text-zinc-600 uppercase font-bold">Mín</span>
             </div>
             <div className="w-px h-6 bg-zinc-800"></div>
             <div className="text-right">
                 <span className={`block text-sm font-bold ${isProfit ? 'text-blue-400' : 'text-emerald-400'}`}>{idealValue}</span>
                 <span className="text-[8px] text-zinc-600 uppercase font-bold">Ideal</span>
             </div>
        </div>
    </div>
);

const ChartCard: React.FC<{ title: string; data: any[]; dataKey: string; color: string }> = ({ title, data, dataKey, color }) => (
    <div className="bg-[#18181b] rounded-2xl border border-zinc-800 p-6 h-[320px] shadow-lg">
        <h3 className="font-bold text-white mb-6 text-sm uppercase tracking-wider">{title}</h3>
        <ResponsiveContainer width="100%" height="85%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 11, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10}} />
                <Tooltip 
                    cursor={{fill: '#27272a', opacity: 0.4}}
                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #3f3f46', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={60}>
                     {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 1 ? color : '#eab308'} style={{ filter: index === 1 ? `drop-shadow(0 0 6px ${color}40)` : '' }} /> 
                     ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
);

const ScenarioCard: React.FC<{ 
    title: string; 
    subtitle: string; 
    badge: string;
    colorClass: string; 
    borderColor: string; 
    accentColor: string; 
    data: any; 
    formatCurrency: any;
    formatNumber: any;
    isTarget?: boolean;
}> = ({ title, subtitle, badge, colorClass, borderColor, accentColor, data, formatCurrency, formatNumber, isTarget }) => (
    <div className={`rounded-xl border ${borderColor} bg-[#18181b] overflow-hidden ${isTarget ? 'ring-2 ring-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : ''}`}>
        <div className={`${colorClass} p-4 border-b ${borderColor} flex justify-between items-center`}>
            <div>
                <h4 className={`font-black uppercase tracking-tight text-lg ${accentColor}`}>{title}</h4>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider text-zinc-300">{subtitle}</p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded bg-black/20 border border-white/10 ${accentColor}`}>{badge}</span>
        </div>
        <div className="p-5 space-y-3">
             <ScenarioRow label="Nº de Leads" value={formatNumber(data.leads)} />
             <ScenarioRow label="Adesões Estimadas" value={formatNumber(data.sales)} highlight />
             <ScenarioRow label="CAC Estimado" value={formatCurrency(data.cac)} />
             <ScenarioRow label="Adesão Média" value={formatCurrency(data.ticket)} />
             <div className="my-2 border-t border-dashed border-zinc-800"></div>
             <ScenarioRow label="Faturamento" value={formatCurrency(data.revenue)} highlight />
             <ScenarioRow label="Lucro Líquido" value={formatCurrency(data.profit)} />
             
             <div className="pt-3 mt-3 border-t border-zinc-800 flex justify-between items-center bg-black/20 -mx-5 -mb-5 px-5 py-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ROAS (Lucro)</span>
                <span className={`font-black text-xl ${accentColor}`}>{data.roasProfit.toFixed(1)}x</span>
             </div>
        </div>
    </div>
);

const ScenarioRow: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-zinc-500 text-xs">{label}</span>
        <span className={`font-bold ${highlight ? 'text-white' : 'text-zinc-300'}`}>{value}</span>
    </div>
);

export default CampaignPlanner;