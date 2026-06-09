import React, { useEffect, useRef, useState } from 'react';

interface CustomScrollbarProps {
  children: React.ReactNode;
  containerClassName?: string;
  contentClassName?: string;
  height: string;
}

export const CustomScrollbar: React.FC<CustomScrollbarProps> = ({
  children,
  containerClassName = '',
  contentClassName = '',
  height,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumbHeight, setThumbHeight] = useState<number>(0);
  const [thumbTop, setThumbTop] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startY, setStartY] = useState<number>(0);
  const [startScrollTop, setStartScrollTop] = useState<number>(0);

  // Calculate thumb height and position
  useEffect(() => {
    const calculateThumbSize = () => {
      if (!contentRef.current || !trackRef.current) return;
      
      const { clientHeight, scrollHeight } = contentRef.current;
      const trackHeight = trackRef.current.clientHeight;
      
      // Calculate the thumb height based on the visible content ratio
      const ratio = clientHeight / scrollHeight;
      const newThumbHeight = Math.max(30, ratio * trackHeight);
      
      setThumbHeight(newThumbHeight);
    };

    calculateThumbSize();
    
    // Set up resize observer to recalculate when content changes
    const resizeObserver = new ResizeObserver(calculateThumbSize);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    
    return () => {
      if (contentRef.current) {
        resizeObserver.unobserve(contentRef.current);
      }
    };
  }, [children]);

  // Update thumb position on content scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current || !trackRef.current || isDragging) return;
      
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const trackHeight = trackRef.current.clientHeight;
      
      // Calculate the new thumb position
      const ratio = scrollTop / (scrollHeight - clientHeight);
      const maxTop = trackHeight - thumbHeight;
      const newThumbTop = ratio * maxTop;
      
      setThumbTop(newThumbTop);
    };
    
    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (contentElement) {
        contentElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [thumbHeight, isDragging]);

  // Handle thumb drag interactions
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !contentRef.current || !trackRef.current) return;
      
      e.preventDefault();
      
      const trackHeight = trackRef.current.clientHeight;
      const { scrollHeight, clientHeight } = contentRef.current;
      
      // Calculate the delta movement
      const deltaY = e.clientY - startY;
      const ratio = deltaY / (trackHeight - thumbHeight);
      const scrollDelta = ratio * (scrollHeight - clientHeight);
      
      // Update the scroll position
      contentRef.current.scrollTop = startScrollTop + scrollDelta;
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY, startScrollTop, thumbHeight]);

  // Handle thumb drag start
  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartY(e.clientY);
    
    if (contentRef.current) {
      setStartScrollTop(contentRef.current.scrollTop);
    }
  };

  return (
    <div 
      className={`custom-scrollbar-container ${containerClassName || ''}`} 
      style={{ height }}
    >
      <div 
        ref={contentRef} 
        className={`custom-scrollbar-content ${contentClassName || ''}`}
        style={{ 
          overflowY: containerClassName?.includes('no-scrollbar') ? 'visible' : 'auto', 
          overflowX: 'hidden' 
        }}
      >
        {children}
      </div>
      
      {/* Only show custom scrollbar when not in dialog or when no-scrollbar class isn't present */}
      {!containerClassName?.includes('in-dialog') && !containerClassName?.includes('no-scrollbar') && (
        <div 
          ref={trackRef} 
          className="custom-scrollbar-track"
        >
          <div
            ref={thumbRef}
            className="custom-scrollbar-thumb"
            style={{
              height: `${thumbHeight}px`,
              top: `${thumbTop}px`,
            }}
            onMouseDown={handleThumbMouseDown}
          />
        </div>
      )}
    </div>
  );
};

export default CustomScrollbar;