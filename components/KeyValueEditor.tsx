
import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, TrashIcon } from './Icons';
import { t } from '../i18n';
import Tooltip from './Tooltip';

interface KeyValueEditorProps {
  data: Record<string, string> | undefined;
  setData: (newData: Record<string, string>) => void;
  keyPlaceholder: string;
  valuePlaceholder: string;
  suggestions?: Record<string, string>;
  getTooltipContent?: (key: string, value: string) => string | undefined;
}

const KeyValueEditor: React.FC<KeyValueEditorProps> = ({ data, setData, keyPlaceholder, valuePlaceholder, suggestions, getTooltipContent }) => {
  const [entries, setEntries] = useState<[string, string][]>(Object.entries(data || {}));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEntries(Object.entries(data || {}));
  }, [data]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [suggestionsRef]);

  const updateParent = (currentEntries: [string, string][]) => {
    const newObject = Object.fromEntries(currentEntries.filter(([key]) => key.trim() !== ''));
    setData(newObject);
  };

  const handleKeyChange = (index: number, newKey: string) => {
    const newEntries: [string, string][] = [...entries];
    newEntries[index][0] = newKey;
    setEntries(newEntries);
    updateParent(newEntries);
  };

  const handleValueChange = (index: number, newValue: string) => {
    const newEntries: [string, string][] = [...entries];
    newEntries[index][1] = newValue;
    setEntries(newEntries);
    updateParent(newEntries);
  };

  const handleDelete = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
    updateParent(newEntries);
  };

  const handleAddEmpty = () => {
    setEntries(prev => [...prev, ['', '']]);
    setShowSuggestions(false);
  }

  const handleAddSuggestion = (key: string, value: string) => {
    if (entries.some(([entryKey]) => entryKey === key)) {
        setShowSuggestions(false);
        return;
    }
    const newEntries = [...entries, [key, value]] as [string, string][];
    setEntries(newEntries);
    updateParent(newEntries);
    setShowSuggestions(false);
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value], index) => {
        const tooltipText = getTooltipContent && key ? getTooltipContent(key, value) : undefined;
        return (
            <div key={index} className="flex items-center space-x-2">
                <div className="flex-1 flex items-center space-x-2">
                    <input
                        type="text"
                        placeholder={keyPlaceholder}
                        value={key}
                        onChange={(e) => handleKeyChange(index, e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {tooltipText && <Tooltip text={tooltipText} />}
                </div>

                <input
                    type="text"
                    placeholder={valuePlaceholder}
                    value={value}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={() => handleDelete(index)}
                    aria-label={`Eliminar entrada ${key}`}
                    className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-md transition-colors"
                >
                    <TrashIcon className="h-5 w-5" />
                </button>
            </div>
        )
      })}
      <div className="relative pt-1">
        <button
          onClick={() => setShowSuggestions(prev => !prev)}
          className="w-full flex items-center justify-center space-x-2 p-2 bg-green-500/20 text-green-400 hover:bg-green-500/40 rounded-md transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>{t('addEntry')}</span>
        </button>
        {showSuggestions && (
            <div ref={suggestionsRef} className="absolute z-20 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <ul className="py-1">
                {suggestions && Object.entries(suggestions).map(([key, value]) => (
                    <li key={key}>
                      <button
                        onClick={() => handleAddSuggestion(key, value)}
                        disabled={entries.some(([entryKey]) => entryKey === key)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {key} <span className="text-gray-400 text-xs truncate">{value}</span>
                      </button>
                    </li>
                 ))}
                 {suggestions && Object.keys(suggestions).length > 0 && <hr className="border-gray-600 my-1" />}
                <li>
                  <button
                    onClick={handleAddEmpty}
                    className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-gray-600"
                  >
                    + {t('addEmptyEntry')}
                  </button>
                </li>
              </ul>
            </div>
        )}
      </div>
    </div>
  );
};

export default KeyValueEditor;