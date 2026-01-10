import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface ValueWithRationaleProps {
  value: string | number | React.ReactNode;
  rationale?: string;
  label?: string;
  className?: string;
  inline?: boolean;
  link?: string; // Support for external links
}

/**
 * Component that displays a value with a hover tooltip showing its rationale/assumption
 * Features:
 * - Hover to show tooltip
 * - Click to pin tooltip open (for clicking links)
 * - Supports markdown-style links in rationale text
 * - Consistent clean font (not inherited from data point)
 * - Works even when no rationale exists yet (shows info icon)
 */
export function ValueWithRationale({ 
  value, 
  rationale, 
  label, 
  className = '',
  inline = false,
  link
}: ValueWithRationaleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close pinned tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isPinned && tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsPinned(false);
      }
    };

    if (isPinned) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isPinned]);

  // Parse rationale text for markdown-style links [text](url)
  const parseLinks = (text: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      // Add the link
      parts.push(
        <a
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 underline"
          onClick={(e) => e.stopPropagation()}
        >
          {match[1]}
        </a>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // If no rationale and no link, just display the value
  if (!rationale && !link) {
    return <>{value}</>;
  }

  const containerClass = inline 
    ? 'inline-flex items-center gap-1' 
    : 'flex items-center gap-1';

  const showTooltip = isHovered || isPinned;

  return (
    <div 
      className={`${containerClass} relative cursor-help ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsPinned(!isPinned)}
    >
      <span className={(rationale || link) ? 'border-b border-dashed border-muted-foreground/40' : ''}>
        {value}
      </span>
      {(rationale || link) && (
        <Info className="h-3 w-3 text-muted-foreground shrink-0" />
      )}
      
      {/* Tooltip - uses consistent font family and color, not inherited */}
      {showTooltip && (rationale || link) && (
        <div 
          ref={tooltipRef}
          className="absolute z-[100] bg-card border border-border rounded-lg p-3 shadow-lg min-w-[250px] max-w-[400px] left-0 top-full mt-1 animate-in fade-in-0 zoom-in-95 duration-200"
          style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
        >
          <div className="space-y-2">
            {label && (
              <div className="font-semibold text-sm text-foreground">{label}</div>
            )}
            {rationale && (
              <div>
                <span className="text-xs font-medium text-muted-foreground">Rationale:</span>
                <div className="text-sm text-foreground mt-1 leading-relaxed">
                  {parseLinks(rationale)}
                </div>
              </div>
            )}
            {link && (
              <div className="pt-1 border-t border-border">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:text-blue-600 underline flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  View source →
                </a>
              </div>
            )}
            {isPinned && (
              <div className="text-xs text-muted-foreground pt-1 border-t border-border">
                Click outside to close
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
