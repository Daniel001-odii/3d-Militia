/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types/game';
import { MessageSquare, Send } from 'lucide-react';

interface Props {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const InGameChat: React.FC<Props> = ({ messages, onSendMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter') {
        if (!isOpen) {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      } else if (e.code === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setIsOpen(false);
      return;
    }
    onSendMessage(text.trim());
    setText('');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 left-6 z-30 max-w-sm pointer-events-auto">
      {/* Messages List */}
      <div 
        ref={scrollRef}
        className="space-y-1 max-h-36 overflow-y-auto mb-2 pr-2 text-xs scrollbar-thin select-none"
      >
        {messages.slice(-8).map((m) => {
          const isSystem = m.senderName === 'SYSTEM';
          const nameColor = isSystem 
            ? 'text-amber-400' 
            : m.team === 'red' 
            ? 'text-red-400' 
            : m.team === 'blue' 
            ? 'text-blue-400' 
            : 'text-emerald-400';

          return (
            <div 
              key={m.id}
              className="bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded border border-white/5 text-[11px] leading-tight"
            >
              <span className={`font-bold ${nameColor} mr-1.5 font-['Chakra_Petch']`}>
                {m.senderName}:
              </span>
              <span className="text-neutral-200">{m.text}</span>
            </div>
          );
        })}
      </div>

      {/* Input Field */}
      {isOpen ? (
        <form onSubmit={handleSend} className="flex gap-1.5 animate-in fade-in duration-100">
          <input
            ref={inputRef}
            type="text"
            maxLength={100}
            placeholder="Type message (Press Enter to send)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-neutral-950/90 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="bg-amber-600 hover:bg-amber-500 text-black px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="bg-black/50 hover:bg-black/80 border border-white/10 text-neutral-400 hover:text-white px-2.5 py-1 rounded text-[11px] flex items-center gap-1.5 transition-colors"
        >
          <MessageSquare className="w-3 h-3" />
          <span>Press [Enter] to Chat</span>
        </button>
      )}
    </div>
  );
};
