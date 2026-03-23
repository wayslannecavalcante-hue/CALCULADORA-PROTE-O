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

const ReverseFunnel: React.FC = () => {
  // --- Estado dos Inputs ---
  const [inputs, setInputs] = useState({
    targetSales: 30, // Meta de Vendas (Qtd)
    ticketAvg: 350,  // Adesão Média PV
    baseCpl: 15.00,  // CPL Base para cálculo principal
  });

  // --- Benchmarks (Taxas do Funil PV - Proteção Veicular) ---
  // Target: 8.4% Overall (0.7 * 0.6 * 0.2 = 0.084)
  const BENCHMARKS = {
    leadToAppt: 0.70,  // 70% Contato Feito
    apptToVisit: 0.60, // 60% Cotação
    visitToSale: 0.20, // 20% Fechamento (Adesão)
    overall: 0.084     // 8.4% Overall
  };

  // --- Cálculos Automáticos (Reverso) ---
  
  const metrics = useMemo(() => {
    // 1. Quantidade de Leads Necessários para bater a meta de vendas
    // Fórmula: Vendas / Taxa de Conversão Global
    const leadsRequired = Math.ceil(inputs.targetSales / BENCHMARKS.overall);
    
    // 2. Investimento Necessário
    // Fórmula: Leads Necessários * CPL Base
    const investmentRequired = leadsRequired * inputs.baseCpl;
    
    // 3. Projeção Intermediária (Reverso)
    const visitsRequired = Math.ceil(inputs.targetSales / BENCHMARKS.visitToSale);
    const appointmentsRequired = Math.ceil(visitsRequired / BENCHMARKS.apptToVisit);

    // 4. Financeiro Projetado
    const revenueProjected = inputs.targetSales * inputs.ticketAvg;
    const profitMargin = 0.15;
    const profitProjected = revenueProjected * profitMargin;
    
    // 5. Métricas de Eficiência
    const roasProjected = investmentRequired > 0 ? revenueProjected / investmentRequired : 0;
    const cacProjected = inputs.targetSales > 0 ? investmentRequired / inputs.targetSales : 0;
    const roasProfit = investmentRequired > 0 ? profitProjected / investmentRequired : 0;

    // 6. Custos Unitários Estimados
    const costPerAppt = appointmentsRequired > 0 ? investmentRequired / appointmentsRequired : 0;
    const costPerVisit = visitsRequired > 0 ? investmentRequired / visitsRequired : 0;

    return {
      investmentRequired,
      leadsRequired,
      funnel: {
        appointments: appointmentsRequired,
        visits: visitsRequired,
        sales: inputs.targetSales,
        costs: {
            appt: costPerAppt,
            visit: costPerVisit,
            sale: cacProjected
        }
      },
      financials: {
          revenue: revenueProjected,
          profit: profitProjected,
          cac: cacProjected,
          roas: roasProjected,
          roasProfit: roasProfit
      }
    };
  }, [inputs]);

  // --- Matriz de Cenários (Rodapé) ---
  const matrix = useMemo(() => {
    
    // Função para criar cenário reverso
    const createReverseScenario = (convRate: number, cpl: number) => {
        // Leads necessários para atingir a meta fixa de vendas
        const leads = Math.ceil(inputs.targetSales / (convRate / 100));
        
        // Investimento varia conforme a eficiência
        const investment = leads * cpl;
        
        const revenue = inputs.targetSales * inputs.ticketAvg;
        const profit = revenue * 0.15;
        const cac = inputs.targetSales > 0 ? investment / inputs.targetSales : 0;
        const roasProfit = investment > 0 ? profit / investment : 0;
        
        return { 
            convRate, 
            cpl, 
            leads, 
            investment, 
            sales: inputs.targetSales, // Vendas são fixas (Meta)
            revenue, 
            profit, 
            cac, 
            roasProfit, 
            ticket: inputs.ticketAvg 
        };
    };

    return {
        // Cenário Ruim: Conv 5%, CPL R$ 20,00
        bad: createReverseScenario(5.0, 20.00), 
        
        // Cenário Bom: Conv 12%, CPL R$ 10,00
        good: createReverseScenario(12.0, 10.00), 
        
        // Cenário Meta: Conv 8.4%, CPL R$ 15,00
        target: createReverseScenario(8.4, 15.00) 
    };
  }, [inputs]);


  // --- Formatadores ---
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatNumber = (val: number) => new Intl.NumberFormat('pt-BR').format(val);

  // --- Dados para Gráficos ---
  const investmentChartData = [
    { name: 'Otimista', Investimento: matrix.good.investment }, // Using "Good" scenario as Optimistic (Visual comparison)
    { name: 'Necessário', Investimento: matrix.target.investment }, // Using "Target" as Necessary/Goal
    { name: 'Pessimista', Investimento: matrix.bad.investment },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10" id="reverse-content">
      
      {/* 1. Header & Inputs */}
      <div className="bg-[#18181b] rounded-2xl border border-zinc-800 p-8 shadow-xl relative overflow-hidden">
        
        {/* Absolute Button Top Right */}
        <div className="absolute top-8 right-8 z-20">
            <button 
              onClick={() => generatePDF('reverse-content', 'Relatorio_Funil_Reverso_PV')}
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
                <span className="text-purple-400 bg-purple-950/30 p-2 rounded-lg">🚀</span> 
                Funil Reverso: Meta ➔ Investimento
            </h2>
            <p className="text-zinc-500 text-sm mt-1 ml-11">
                Defina sua meta de adesões e descubra quanto precisa investir.
            </p>
        </div>

        <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800/50 relative z-10">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                Dados de Entrada (Metas)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup 
                    label="Meta de Adesões (Qtd)" 
                    value={inputs.targetSales} 
                    onChange={(v) => setInputs({...inputs, targetSales: Number(v)})} 
                    isCurrency={false}
                />
                <InputGroup 
                    label="Adesão Média (R$)" 
                    value={inputs.ticketAvg} 
                    onChange={(v) => setInputs({...inputs, ticketAvg: Number(v)})} 
                />
            </div>
        </div>
      </div>

      {/* 2. Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {/* Investimento Necessário (Com Input de CPL Embutido) */}
         <div className="bg-[#18181b] border border-purple-500/30 p-6 rounded-xl flex flex-col justify-center shadow-[0_0_20px_rgba(168,85,247,0.1)] relative overflow-hidden group">
             <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-6 -mt-6"></div>
             <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💰</span>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Investimento Necessário</span>
                 </div>
                 <div className="text-3xl font-black text-white mb-3">{formatCurrency(metrics.investmentRequired)}</div>
                 
                 {/* Mini Input de CPL */}
                 <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg border border-white/5 w-fit">
                    <span className="text-[10px] text-zinc-500 whitespace-nowrap pl-1">Baseado em CPL de:</span>
                    <div className="relative w-20">
                        <span className="absolute left-2 top-1.5 text-zinc-500 text-xs">R$</span>
                        <input 
                            type="number" 
                            value={inputs.baseCpl}
                            onChange={(e) => setInputs({...inputs, baseCpl: Number(e.target.value)})}
                            className="w-full bg-zinc-800 border-none rounded text-xs text-white pl-6 py-1 focus:ring-1 focus:ring-purple-500"
                        />
                    </div>
                 </div>
             </div>
         </div>
         
         <InfoCard label="Leads Necessários" value={formatNumber(metrics.leadsRequired)} icon="👥" highlightColor="text-cyan-400" />
         <InfoCard label="Faturamento Projetado" value={formatCurrency(metrics.financials.revenue)} icon="📈" highlightColor="text-emerald-400" />
      </div>

      {/* 3. Funnel Visualization (Reverso) */}
      <div className="bg-[#18181b] rounded-2xl border border-zinc-800 p-8 shadow-xl">
         <div className="flex justify-between items-end mb-8">
            <div>
                <h3 className="text-lg font-bold text-white mb-1">Estrutura do Funil Necessária</h3>
                <p className="text-zinc-500 text-xs">Volume necessário em cada etapa para atingir {inputs.targetSales} adesões (Baseado em Conv. {((BENCHMARKS.overall)*100).toFixed(1)}%).</p>
            </div>
         </div>

         <div className="flex flex-col items-center gap-2 max-w-3xl mx-auto">
            <FunnelBar 
                label="Leads Necessários" 
                value={metrics.leadsRequired} 
                cost={inputs.baseCpl}
                color="bg-gradient-to-r from-blue-700 to-blue-600" 
                width="100%" 
            />
            <FunnelBar 
                label={`Contatos Nec. (${(BENCHMARKS.leadToAppt * 100).toFixed(0)}%)`} 
                value={metrics.funnel.appointments} 
                cost={metrics.funnel.costs.appt}
                color="bg-gradient-to-r from-indigo-700 to-indigo-600" 
                width="80%" 
            />
            <FunnelBar 
                label={`Cotações Nec. (${(BENCHMARKS.apptToVisit * 100).toFixed(0)}%)`} 
                value={metrics.funnel.visits} 
                cost={metrics.funnel.costs.visit}
                color="bg-gradient-to-r from-purple-700 to-purple-600" 
                width="60%" 
            />
            <FunnelBar 
                label={`Meta de Adesões (${(BENCHMARKS.visitToSale * 100).toFixed(0)}%)`} 
                value={metrics.funnel.sales} 
                cost={metrics.funnel.costs.sale} // CAC
                color="bg-gradient-to-r from-emerald-600 to-emerald-500 border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
                width="40%" 
            />
         </div>
      </div>

      {/* 4. Financeiro e Lucro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#18181b] rounded-2xl border border-zinc-800 p-6 shadow-lg">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-emerald-500">★</span> Resultado Financeiro
            </h3>
            <div className="space-y-4">
                <Row label="Faturamento" value={formatCurrency(metrics.financials.revenue)} color="text-white" />
                <Row label="Investimento Est." value={formatCurrency(metrics.investmentRequired)} color="text-rose-400" />
                <div className="h-px bg-zinc-800 my-2"></div>
                <Row label="Lucro Líquido (15%)" value={formatCurrency(metrics.financials.profit)} color="text-emerald-400" highlight />
            </div>
          </div>

          <div className="bg-[#18181b] rounded-2xl border border-zinc-800 p-6 shadow-lg">
             <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-cyan-500">📊</span> Eficiência Estimada
             </h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">ROAS</span>
                    <div className="text-2xl font-black text-cyan-400">{metrics.financials.roas.toFixed(2)}x</div>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">CAC Ideal</span>
                    <div className="text-2xl font-black text-purple-400">{formatCurrency(metrics.financials.cac)}</div>
                </div>
                 <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 col-span-2 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">ROAS (Lucro Líquido)</span>
                    <div className="text-xl font-black text-emerald-500">{metrics.financials.roasProfit.toFixed(2)}x</div>
                </div>
             </div>
          </div>
      </div>

      {/* 5. Comparativo de Investimento (Gráfico) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-1 bg-[#18181b] rounded-2xl border border-zinc-800 p-6 shadow-lg">
             <h3 className="font-bold text-white mb-4 text-sm uppercase">Sensibilidade de Investimento</h3>
             <p className="text-xs text-zinc-500 mb-6">Como a variação na taxa de conversão afeta o capital necessário.</p>
             <ResponsiveContainer width="100%" height={200}>
                <BarChart data={investmentChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10}} />
                    <Tooltip cursor={{fill: '#27272a', opacity: 0.4}} contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', fontSize: '12px' }} />
                    <Bar dataKey="Investimento" radius={[4, 4, 0, 0]}>
                        {investmentChartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === 1 ? '#a855f7' : '#f43f5e'} />
                        ))}
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
         </div>

         {/* 6. Matriz de Cenários */}
         <div className="md:col-span-2 bg-[#18181b] rounded-2xl border border-zinc-800 p-8 shadow-xl">
             <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-cyan-500">◎</span> Comparativo de Cenários por CPL
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Cenário Ruim */}
                <ScenarioCard 
                    title="Cenário Ruim" 
                    subtitle="CPL R$ 20,00"
                    badge="5% Conv."
                    data={matrix.bad}
                    colorClass="bg-rose-950/30"
                    borderColor="border-rose-900/50"
                    accentColor="text-rose-500"
                    formatCurrency={formatCurrency}
                    formatNumber={formatNumber}
                />
                
                {/* Cenário Bom */}
                <ScenarioCard 
                    title="Cenário Bom" 
                    subtitle="CPL R$ 10,00"
                    badge="12% Conv."
                    data={matrix.good}
                    colorClass="bg-amber-950/30"
                    borderColor="border-amber-900/50"
                    accentColor="text-amber-500"
                    formatCurrency={formatCurrency}
                    formatNumber={formatNumber}
                />

                {/* Cenário Meta */}
                <ScenarioCard 
                    title="Cenário Meta" 
                    subtitle="CPL R$ 15,00"
                    badge="8.4% Conv."
                    data={matrix.target}
                    colorClass="bg-emerald-950/30"
                    borderColor="border-emerald-900/50"
                    accentColor="text-emerald-500"
                    formatCurrency={formatCurrency}
                    formatNumber={formatNumber}
                    isTarget
                />
             </div>
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

const InputGroup: React.FC<{ label: string; value: number; onChange: (val: string) => void; isCurrency?: boolean }> = ({ label, value, onChange, isCurrency = true }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</label>
        <div className="relative group">
            {isCurrency && <span className="absolute left-3 top-2.5 text-zinc-500 group-focus-within:text-purple-400 transition-colors">R$</span>}
            <input 
                type="number" 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className={`w-full ${isCurrency ? 'pl-10' : 'pl-3'} p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all font-mono`} 
            />
        </div>
    </div>
);

const InfoCard: React.FC<{ label: string; value: string; icon: string; highlightColor?: string }> = ({ label, value, icon, highlightColor }) => (
    <div className="bg-[#18181b] border border-zinc-800 p-6 rounded-xl flex flex-col justify-center shadow-lg">
        <div className="flex items-center gap-2 mb-2">
            <span className="text-lg opacity-80">{icon}</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
        </div>
        <div className={`text-2xl font-black ${highlightColor || 'text-white'}`}>{value}</div>
    </div>
);

const FunnelBar: React.FC<{ label: string; value: number; cost: number; color: string; width: string }> = ({ label, value, cost, color, width }) => (
    <div className={`relative h-14 flex items-center justify-between px-6 rounded-lg text-white shadow-lg mb-1 transition-all hover:scale-[1.01] group ${color}`} style={{ width }}>
        <div className="flex flex-col">
            <span className="text-sm font-bold drop-shadow-md flex items-center gap-2">{label}</span>
        </div>
        <div className="flex items-center gap-6">
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

const Row: React.FC<{ label: string; value: string; color: string; highlight?: boolean }> = ({ label, value, color, highlight }) => (
    <div className="flex justify-between items-center">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${highlight ? 'text-zinc-300' : 'text-zinc-500'}`}>{label}</span>
        <span className={`font-mono font-bold ${highlight ? 'text-xl' : 'text-base'} ${color}`}>{value}</span>
    </div>
);

// --- New Detailed Scenario Card (Matching Planning Tab) ---
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
             <ScenarioRow label="Investimento Nec." value={formatCurrency(data.investment)} highlight />
             <ScenarioRow label="Nº de Leads" value={formatNumber(data.leads)} />
             <ScenarioRow label="CAC Estimado" value={formatCurrency(data.cac)} />
             <div className="my-2 border-t border-dashed border-zinc-800"></div>
             <ScenarioRow label="Adesões (Meta)" value={formatNumber(data.sales)} />
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

export default ReverseFunnel;