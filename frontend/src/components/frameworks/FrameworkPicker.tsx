import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';

export default function FrameworkPicker() {
  const { frameworks, selectedFrameworkId, setSelectedFrameworkId } = useSessionStore();
  const [showControls, setShowControls] = useState<string | null>(null);

  const selectedFramework = frameworks.find(f => f.id === selectedFrameworkId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {frameworks.map((f) => (
          <button
            key={f.id}
            className={`
              relative p-5 rounded-2xl text-left transition-all border-2
              ${selectedFrameworkId === f.id 
                ? 'border-primary bg-blue-50 shadow-md ring-4 ring-blue-50' 
                : 'border-gray-100 bg-white hover:border-primary hover:shadow-sm'}
            `}
            onClick={() => setSelectedFrameworkId(f.id)}
          >
            {selectedFrameworkId === f.id && (
              <div className="absolute top-3 right-3 bg-primary text-white rounded-full p-1">
                <Check className="w-3 h-3" />
              </div>
            )}
            <Shield className={`w-8 h-8 mb-4 ${selectedFrameworkId === f.id ? 'text-primary' : 'text-gray-300'}`} />
            <strong className="block text-lg font-bold text-gray-900">{f.name}</strong>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">{f.description}</p>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {f.controls.length} Controls
              </span>
              <div 
                className="text-[10px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowControls(showControls === f.id ? null : f.id);
                }}
              >
                PREVIEW {showControls === f.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </div>
            </div>
            
            {showControls === f.id && (
              <div className="mt-4 space-y-2 overflow-hidden transition-all">
                {f.controls.slice(0, 5).map(c => (
                  <div key={c.control_id} className="text-[10px] text-gray-600 truncate bg-gray-50 p-1 rounded">
                    <span className="font-bold text-primary">{c.control_id}</span> · {c.name}
                  </div>
                ))}
                {f.controls.length > 5 && <div className="text-[10px] text-gray-400 italic">... and {f.controls.length - 5} more</div>}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
