
import React, { useRef, useLayoutEffect, useState } from 'react';
import { QuestionMarkCircleIcon } from './Icons';

interface TooltipProps {
  text: string;
  children?: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(false);

  useLayoutEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current && arrowRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltip = tooltipRef.current;
      const arrow = arrowRef.current;
      const margin = 8;
      
      // Use a temporary style to measure the tooltip's dimensions
      tooltip.style.visibility = 'hidden';
      tooltip.style.display = 'block';
      const tooltipRect = tooltip.getBoundingClientRect();
      tooltip.style.visibility = '';
      tooltip.style.display = '';

      let top, left;

      // Vertical positioning
      if (triggerRect.top - tooltipRect.height - margin > 0) { // Enough space above
        top = triggerRect.top - tooltipRect.height - margin;
        arrow.style.top = '100%';
        arrow.style.bottom = 'auto';
        arrow.style.transform = 'translateX(-50%) rotate(0deg)';
      } else { // Not enough space above, position below
        top = triggerRect.bottom + margin;
        arrow.style.top = '-8px'; // Position arrow at the top of the tooltip box
        arrow.style.bottom = 'auto';
        arrow.style.transform = 'translateX(-50%) rotate(180deg)';
      }
      
      // Horizontal positioning
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      
      // Horizontal collision detection
      if (left < margin) {
        left = margin;
      } else if (left + tooltipRect.width > window.innerWidth - margin) {
        left = window.innerWidth - tooltipRect.width - margin;
      }
      
      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
      
      // Adjust arrow horizontal position
      const arrowLeft = triggerRect.left + triggerRect.width / 2 - left;
      arrow.style.left = `${arrowLeft}px`;
    }
  }, [isVisible, text]);

  return (
    <div 
      ref={triggerRef} 
      className="flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children || <QuestionMarkCircleIcon className="h-5 w-5 text-gray-500" />}
      {isVisible && (
        <div
          ref={tooltipRef}
          style={{ position: 'fixed', zIndex: 50, transition: 'opacity 0.2s' }}
          className="rounded-lg bg-gray-600 p-3 text-center text-sm text-white pointer-events-none w-64 shadow-lg"
          role="tooltip"
        >
          {text}
          <div
            ref={arrowRef}
            className="absolute h-0 w-0 border-x-8 border-t-8 border-x-transparent border-t-gray-600"
            style={{ bottom: '-8px' }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;