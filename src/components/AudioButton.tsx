import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speakFrench, stopSpeech } from '../utils/speech';

interface AudioButtonProps {
  text: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  size = 'md',
  className = '',
  title = 'Écouter la prononciation',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    speakFrench(text);
    // Reset playing state after estimated duration
    const duration = Math.max(1200, (text.length / 10) * 1000);
    setTimeout(() => {
      setIsPlaying(false);
    }, duration);
  };

  const sizeClasses = {
    sm: 'p-1 text-slate-500 hover:text-indigo-600',
    md: 'p-1.5 text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-full',
    lg: 'p-2.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-full',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  return (
    <button
      type="button"
      onClick={handlePlay}
      className={`transition-colors inline-flex items-center justify-center cursor-pointer ${sizeClasses[size]} ${className}`}
      title={title}
      aria-label={title}
    >
      {isPlaying ? (
        <Volume2 size={iconSizes[size]} className="animate-pulse text-indigo-600" />
      ) : (
        <Volume2 size={iconSizes[size]} />
      )}
    </button>
  );
};
