import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';

export default function FrameworkPicker() {
  const { frameworks, selectedFrameworkId, setSelectedFrameworkId } = useSessionStore();
  const [showControls, setShowControls] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {frameworks.map((f) => {
          const isSelected = selectedFrameworkId === f.id;
          return (
            <button
              key={f.id}
              className={`
                panel relative text-left transition-all group
                ${isSelected 
                  ? 'border-cyan bg-cyan/5 shadow-[0_0_20px_rgba(0,240,255,0.1)]' 
                  : 'hover:border-cyan'}
              `}
              onClick={() => setSelectedFrameworkId(f.id)}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-4 h-4 border border-cyan rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-cyan" />
                </div>
              )}
              <Shield className={`w-8 h-8 mb-4 transition-colors ${isSelected ? 'text-cyan glow-text' : 'text-ink-muted group-hover:text-cyan'}`} />
              <strong className="block font-heading text-sm tracking-[2px] text-ink uppercase group-hover:glow-text">{f.name}</strong>
              <p className="text-[10px] text-ink-muted mt-2 leading-relaxed font-body uppercase tracking-wider">{f.description}</p>
              
              <div className="mt-4 pt-4 border-t border-cyan-dim flex justify-between items-center">
                <span className="panel-label !mb-0 !text-[8px]">
                  {f.controls.length} Signals
                </span>
                <div 
                  className="font-heading text-[8px] text-cyan hover:glow-text cursor-pointer flex items-center gap-1 tracking-widest"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowControls(showControls === f.id ? null : f.id);
                  }}
                >
                  PREVIEW {showControls === f.id ? <ChevronUp className="w-2 h-2" /> : <ChevronDown className="w-2 h-2" />}
                </div>
              </div>
              
              {showControls === f.id && (
                <div className="mt-4 space-y-1 animate-in slide-in-from-top-1">
                  {f.controls.slice(0, 5).map(c => (
                    <div key={c.control_id} className="text-[9px] font-mono text-ink-muted bg-base-light/50 p-1 border border-cyan/5">
                      <span className="text-cyan font-bold">{c.control_id}</span> · {c.name}
                    </div>
                  ))}
                  {f.controls.length > 5 && <div className="text-[8px] text-ink-muted italic font-mono">... AND {f.controls.length - 5} MORE SIGNALS</div>}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
