import React, { useState, useEffect } from 'react';
import Scene from './components/Scene';
import { TreeState } from './types';
import { Audio, Disc, TreeDeciduous, X } from 'lucide-react'; // Using icons as metaphor if available, or just fallback

// A simple hook to detect if audio is playing (Mock)
const useAudio = (url: string) => {
  const [playing, setPlaying] = useState(false);
  // Implementation of actual audio suppressed for brevity, 
  // but logic exists to toggle states based on "music" metaphor.
  const toggle = () => setPlaying(!playing);
  return { playing, toggle };
};

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.SCATTERED);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-assemble on load after a delay for effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setTreeState(TreeState.TREE_SHAPE);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleToggle = () => {
    setTreeState(prev => prev === TreeState.TREE_SHAPE ? TreeState.SCATTERED : TreeState.TREE_SHAPE);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden text-[#e6e6e6]">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene treeState={treeState} />
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8 md:p-12">
        
        {/* Header */}
        <header className="flex justify-between items-start">
          <div className="flex flex-col animate-fade-in-down">
            <h1 className="font-serif text-3xl md:text-5xl tracking-widest text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
              ARIX
            </h1>
            <span className="font-sans text-xs tracking-[0.5em] uppercase mt-2 opacity-80">
              Signature Collection
            </span>
          </div>
          
          <div className="pointer-events-auto">
             <button className="text-xs font-sans tracking-widest border border-[#FFD700]/30 px-4 py-2 hover:bg-[#FFD700]/10 transition-colors uppercase">
               Menu
             </button>
          </div>
        </header>

        {/* Center / Interaction Area */}
        <div className="flex-1 flex items-center justify-center">
            {/* The interaction text is minimal to not obstruct the art */}
        </div>

        {/* Footer / Controls */}
        <footer className="flex justify-between items-end">
          <div className="flex flex-col gap-2 font-sans text-xs opacity-60 tracking-wider">
            <span>Lat: 90.000° N</span>
            <span>Lon: 0.000° W</span>
            <span className="mt-2 text-[#FFD700]">Merry Christmas</span>
          </div>

          <div className="pointer-events-auto flex flex-col items-end gap-4">
            <div 
              className={`
                group relative flex items-center gap-4 cursor-pointer transition-all duration-700
                ${treeState === TreeState.TREE_SHAPE ? 'opacity-100' : 'opacity-80'}
              `}
              onClick={handleToggle}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <span className={`
                font-serif tracking-widest text-sm transition-all duration-500
                ${isHovered ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}
              `}>
                {treeState === TreeState.TREE_SHAPE ? 'SCATTER' : 'ASSEMBLE'}
              </span>
              
              <div className="w-16 h-16 rounded-full border border-[#FFD700]/50 flex items-center justify-center backdrop-blur-sm bg-black/20 hover:bg-[#FFD700]/20 hover:scale-110 transition-all duration-500 shadow-[0_0_30px_rgba(255,215,0,0.2)]">
                {/* Simple geometrical icon representing order vs chaos */}
                <div className={`w-3 h-3 bg-[#FFD700] transition-all duration-700 ${treeState === TreeState.TREE_SHAPE ? 'rotate-45 scale-100' : 'rotate-0 scale-50 rounded-full'}`} />
              </div>
            </div>
          </div>
        </footer>
      </div>
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-6">
        <div className="w-full h-full border border-[#FFD700]/10 relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#FFD700]/40"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#FFD700]/40"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#FFD700]/40"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#FFD700]/40"></div>
        </div>
      </div>
    </div>
  );
};

export default App;
