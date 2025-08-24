import React from 'react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-blue-400 border-b border-gray-700 pb-2 mb-4">{title}</h3>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

export default Section;
