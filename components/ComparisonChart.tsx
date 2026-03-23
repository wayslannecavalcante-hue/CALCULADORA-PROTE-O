import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { FunnelStage } from '../types';

interface ComparisonChartProps {
  meta: FunnelStage;
  realized: FunnelStage;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ meta, realized }) => {
  const data = [
    {
      name: 'LEADS',
      Meta: meta.leads,
      Realizado: realized.leads,
    },
    {
      name: 'AGENDAMENTOS',
      Meta: meta.appointments,
      Realizado: realized.appointments,
    },
    {
      name: 'VISITAS',
      Meta: meta.visits,
      Realizado: realized.visits,
    },
    {
      name: 'VENDAS',
      Meta: meta.sales,
      Realizado: realized.sales,
    },
  ];

  return (
    <div className="h-[300px] w-full bg-[#18181b] p-4 rounded-2xl border border-zinc-800 shadow-lg">
      <h3 className="text-[10px] font-bold text-zinc-500 mb-6 uppercase tracking-widest pl-2">Comparativo de Volume</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 10,
            left: 0,
            bottom: 5,
          }}
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{fill: '#71717a', fontSize: 10, fontWeight: 700}} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{fill: '#71717a', fontSize: 10, fontWeight: 700}} 
          />
          <Tooltip 
            cursor={{fill: '#27272a', opacity: 0.4}}
            contentStyle={{ 
                backgroundColor: '#18181b', 
                borderRadius: '8px', 
                border: '1px solid #3f3f46', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' 
            }}
            labelStyle={{ color: '#e4e4e7', fontWeight: 'bold', fontSize: '12px', marginBottom: '8px' }}
            itemStyle={{ fontSize: '12px', fontWeight: '600' }}
          />
          <Legend 
            wrapperStyle={{paddingTop: '15px'}} 
            iconType="circle"
            formatter={(value) => <span style={{ color: '#a1a1aa', fontSize: '12px', fontWeight: '600', marginLeft: '5px' }}>{value}</span>}
          />
          <Bar dataKey="Meta" fill="#3f3f46" radius={[4, 4, 0, 0]} name="Meta" maxBarSize={50} />
          <Bar dataKey="Realizado" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Realizado" maxBarSize={50}>
             {data.map((entry, index) => (
                <Cell 
                    key={`cell-${index}`} 
                    fill={entry.Realizado >= entry.Meta ? '#10b981' : '#06b6d4'} 
                    style={{ filter: entry.Realizado >= entry.Meta ? 'drop-shadow(0 0 4px rgba(16,185,129,0.4))' : 'drop-shadow(0 0 4px rgba(6,182,212,0.4))' }}
                />
              ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};