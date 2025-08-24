
import React, { useState, useEffect } from 'react';
import { t } from '../i18n';
import Tooltip from './Tooltip';

interface DynamicFieldEditorProps {
  fieldKey: string;
  value: any;
  onChange: (key: string, value: any) => void;
  tooltipText?: string;
}

const DynamicFieldEditor: React.FC<DynamicFieldEditorProps> = ({ fieldKey, value, onChange, tooltipText }) => {
  const [textValue, setTextValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof value === 'object' && value !== null) {
      setTextValue(JSON.stringify(value, null, 2));
    } else {
      setTextValue(String(value ?? ''));
    }
    setError('');
  }, [value]);
  
  const handleSimpleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newValue = e.target.value;
    if (typeof value === 'boolean') {
      onChange(fieldKey, newValue === 'true');
    } else if (typeof value === 'number') {
      const num = Number(newValue)
      if(!isNaN(num)) {
        onChange(fieldKey, num);
      }
    } else {
      onChange(fieldKey, newValue);
    }
  };
  
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawValue = e.target.value;
    setTextValue(rawValue);
    try {
      const parsedValue = JSON.parse(rawValue);
      onChange(fieldKey, parsedValue);
      setError('');
    } catch (err) {
      setError(t('errorInvalidJsonFragment'));
    }
  };

  const renderEditor = () => {
    const type = typeof value;
    if (type === 'string') {
      return <input type="text" value={value} onChange={handleSimpleChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />;
    }
    if (type === 'number') {
      return <input type="number" value={value} onChange={handleSimpleChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />;
    }
    if (type === 'boolean') {
       return (
         <select value={String(value)} onChange={handleSimpleChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
           <option value="true">true</option>
           <option value="false">false</option>
         </select>
       );
    }
    if (type === 'object' && value !== null) {
      return (
        <div>
          <textarea
            value={textValue}
            onChange={handleTextareaChange}
            rows={10}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Editor JSON para ${fieldKey}`}
          />
          {error && <p className="text-red-400 text-sm mt-1" role="alert">{error}</p>}
        </div>
      );
    }

    return <p className="text-gray-400">{t('unsupportedType')}: {type}</p>
  }
  
  return (
    <div>
        <div className="flex items-center space-x-1.5 mb-1">
            <label className="block text-sm font-medium text-gray-400 capitalize">{fieldKey}</label>
            {tooltipText && <Tooltip text={tooltipText} />}
        </div>
        {renderEditor()}
    </div>
  );
};

export default DynamicFieldEditor;