import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Bot, Check } from 'lucide-react';
import { OPENROUTER_MODELS, LLMModel } from '../config/llm-models';

interface LLMSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  label?: string;
  className?: string;
  models?: LLMModel[];
  showPricing?: boolean;
}

const getModelColor = (index: number) => {
  const colors = [
    { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500' },
    { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-500' },
    { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-500' },
    { bg: 'bg-yellow-600', border: 'border-yellow-600', text: 'text-yellow-600' },
    { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-500' },
  ];
  return colors[index % colors.length];
};

export default function LLMSelector({
  selectedModel,
  onModelChange,
  label = 'AI Model',
  className = '',
  models = OPENROUTER_MODELS.filter(m => m.recommended),
  showPricing = true,
}: LLMSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModelData = models.find(m => m.id === selectedModel) || models[0];
  const selectedIndex = models.findIndex(m => m.id === selectedModel);
  const selectedColor = getModelColor(selectedIndex >= 0 ? selectedIndex : 0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      {/* Selected Model Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-primary-600 transition-all"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 ${selectedColor.bg} rounded-lg flex items-center justify-center flex-shrink-0 shadow-md`}>
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="font-semibold text-gray-900 truncate">{selectedModelData?.name}</div>
            {showPricing && (
              <div className="text-xs text-gray-500 truncate">
                {selectedModelData?.provider} • ${selectedModelData?.pricing.input.toFixed(2)}/M input
              </div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl z-[9999] max-h-96 overflow-y-auto">
          {models.map((model, idx) => {
            const isSelected = model.id === selectedModel;
            const colorConfig = getModelColor(idx);
            
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  onModelChange(model.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                  isSelected 
                    ? 'bg-green-500 text-white' 
                    : 'hover:bg-gray-50 text-gray-900'
                } ${idx === 0 ? 'rounded-t-2xl' : ''} ${idx === models.length - 1 ? 'rounded-b-2xl' : ''}`}
              >
                <div className={`w-10 h-10 ${isSelected ? 'bg-white/20' : colorConfig.bg} rounded-lg flex items-center justify-center flex-shrink-0 shadow-md`}>
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-semibold truncate">{model.name}</div>
                  <div className={`text-xs truncate ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                    {model.provider} • ${model.pricing.input.toFixed(2)}/M input
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
