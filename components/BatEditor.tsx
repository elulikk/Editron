import React from 'react';

interface BatEditorProps {
  content: string;
  setContent: (newContent: string) => void;
}

const BatEditor: React.FC<BatEditorProps> = ({ content, setContent }) => {
  return (
    <div className="h-full flex flex-col">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full flex-grow bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        aria-label="Editor de Compilar.BAT"
        spellCheck="false"
      />
    </div>
  );
};

export default BatEditor;
