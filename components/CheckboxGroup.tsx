
import React from 'react';
import Tooltip from './Tooltip';

interface CheckboxGroupProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  tooltip?: string;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ label, options, selected, onChange, tooltip }) => {
  const handleToggle = (value: string) => {
    const currentIndex = selected.indexOf(value);
    const newSelected = [...selected];

    if (currentIndex === -1) {
      newSelected.push(value);
    } else {
      newSelected.splice(currentIndex, 1);
    }

    onChange(newSelected);
  };

  return (
    <div>
        <div className="flex items-center space-x-1.5 mb-2">
            <label className="block text-sm font-medium text-gray-400">{label}</label>
            {tooltip && <Tooltip text={tooltip} />}
        </div>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <label key={option.value} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-700/50 transition-colors">
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => handleToggle(option.value)}
              className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
            />
            <span className="text-sm text-gray-200">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default CheckboxGroup;