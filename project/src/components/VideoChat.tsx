import React from 'react';
import { Avatar3D } from './Avatar3D';

interface VideoChatProps {
  isActive: boolean;
  onClose: () => void;
  isSpeaking: boolean;
}

export function VideoChat({ isActive, onClose, isSpeaking }: VideoChatProps) {
  if (!isActive) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-zinc-800 rounded-lg shadow-xl border border-red-600/20 overflow-hidden">
      <Avatar3D isSpeaking={isSpeaking} />
    </div>
  );
}