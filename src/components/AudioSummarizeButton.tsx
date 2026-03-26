import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Loader2, Pause, Play } from 'lucide-react';
import { generateAudioSummary } from '../services/geminiService';

interface AudioSummarizeButtonProps {
  text: string;
  className?: string;
  variant?: 'default' | 'minimal';
}

export function AudioSummarizeButton({ text, className = "", variant = 'default' }: AudioSummarizeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const cleanup = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    cleanup();
  }, [text]);

  const handleAudioSummarize = async () => {
    if (!text) return;

    if (isPlaying) {
      if (isPaused) {
        if (audioContextRef.current) {
          await audioContextRef.current.resume();
          setIsPaused(false);
        }
      } else {
        if (audioContextRef.current) {
          await audioContextRef.current.suspend();
          setIsPaused(true);
        }
      }
      return;
    }

    setIsLoading(true);
    try {
      const base64Audio = await generateAudioSummary(text);
      const audioBlob = await fetch(`data:audio/pcm;base64,${base64Audio}`).then(res => res.blob());
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = audioContext.createBuffer(1, arrayBuffer.byteLength / 2, 24000);
      const nowBuffering = audioBuffer.getChannelData(0);
      const dataView = new DataView(arrayBuffer);
      for (let i = 0; i < arrayBuffer.byteLength / 2; i++) {
        nowBuffering[i] = dataView.getInt16(i * 2, true) / 32768;
      }

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      source.start(0);
      sourceRef.current = source;
      setIsPlaying(true);
      setIsPaused(false);
    } catch (err) {
      console.error("Audio summary error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const Icon = isLoading ? Loader2 : isPlaying ? (isPaused ? Play : Pause) : Volume2;

  if (variant === 'minimal') {
    return (
      <button 
        onClick={handleAudioSummarize}
        disabled={isLoading}
        className={`p-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 text-purple-600 ${className}`}
        title={isPlaying ? (isPaused ? "Resume" : "Pause") : "Audio Summarize"}
      >
        <Icon size={16} className={isLoading ? "animate-spin" : ""} />
      </button>
    );
  }

  return (
    <button 
      onClick={handleAudioSummarize}
      disabled={isLoading}
      className={`p-4 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 ${className}`}
      title={isPlaying ? (isPaused ? "Resume" : "Pause") : "Audio Summarize"}
    >
      <Icon size={24} className={isLoading ? "animate-spin" : ""} />
    </button>
  );
}
