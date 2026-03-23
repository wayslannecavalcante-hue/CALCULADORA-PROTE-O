import React, { useState } from 'react';
import FunnelTracker from './components/FunnelTracker';
import CampaignPlanner from './components/CampaignPlanner';
import ReverseFunnel from './components/ReverseFunnel';

type Tab = 'tracker' | 'planner' | 'reverse';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('tracker');

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-20 selection:bg-cyan-500 selection:text-white">
      
      {/* Header & Navigation */}
      <header className="bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Area */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase">
              AEG <span className="text-cyan-400">MEDIA</span>
            </h1>
            <span className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 font-bold">Performance Suite</span>
          </div>

          {/* Tab Navigation */}
          <nav className="flex gap-1 bg-zinc-900/50 p-1 rounded-full border border-zinc-800 overflow-x-auto">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 whitespace-nowrap ${
                activeTab === 'tracker'
                  ? 'bg-zinc-800 text-white shadow-lg shadow-black/50 border border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              Acompanhamento
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 whitespace-nowrap ${
                activeTab === 'planner'
                  ? 'bg-zinc-800 text-white shadow-lg shadow-black/50 border border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              Planejamento
            </button>
            <button
              onClick={() => setActiveTab('reverse')}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 whitespace-nowrap ${
                activeTab === 'reverse'
                  ? 'bg-zinc-800 text-white shadow-lg shadow-black/50 border border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              Funil Reverso
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === 'tracker' ? (
          <FunnelTracker />
        ) : activeTab === 'planner' ? (
          <CampaignPlanner />
        ) : (
          <ReverseFunnel />
        )}
      </main>
    </div>
  );
};

export default App;