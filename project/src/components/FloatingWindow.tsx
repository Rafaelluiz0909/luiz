import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface FloatingWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  position: { x: number; y: number };
  onClose: () => void;
  onDragEnd: (id: string, position: { x: number; y: number }) => void;
}

export function FloatingWindow({
  id,
  title,
  children,
  position,
  onClose,
  onDragEnd
}: FloatingWindowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [windowPosition, setWindowPosition] = useState(position);
  const windowRef = useRef<HTMLDivElement>(null);

  // Center window on mount
  useEffect(() => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      const x = Math.max(0, (window.innerWidth - rect.width) / 2);
      const y = Math.max(0, (window.innerHeight - rect.height) / 2);
      setWindowPosition({ x, y });
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - (windowRef.current?.offsetWidth || 0)));
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - (windowRef.current?.offsetHeight || 0)));
        setWindowPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onDragEnd(id, windowPosition);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, id, onDragEnd, windowPosition]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  return (
    <div
      ref={windowRef}
      className="fixed bg-zinc-800 rounded-lg shadow-xl border border-red-600/20 min-w-[300px] z-40"
      style={{
        left: `${windowPosition.x}px`,
        top: `${windowPosition.y}px`,
      }}
    >
      <div
        className="flex items-center justify-between p-3 cursor-move bg-zinc-900 rounded-t-lg border-b border-red-600/20"
        onMouseDown={handleMouseDown}
      >
        <h3 className="text-lg font-bold text-gray-100">{title}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}