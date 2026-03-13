'use client';

import { Phone, PhoneOff } from 'lucide-react';

interface Props {
  fromNickname: string;
  fromAvatar?: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallModal({ fromNickname, fromAvatar, onAccept, onReject }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-bg-card border border-border rounded-3xl p-8 text-center w-80 animate-slide-up shadow-card">
        <div className="relative inline-block mb-4">
          <img
            src={fromAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fromNickname}`}
            alt={fromNickname}
            className="w-24 h-24 rounded-full border-4 border-primary/30 mx-auto"
          />
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
        </div>
        <p className="text-text-muted text-sm mb-1">영상통화 수신 중</p>
        <h3 className="text-xl font-bold text-text-primary mb-6">{fromNickname}</h3>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onReject}
            className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-all"
          >
            <PhoneOff size={26} />
          </button>
          <button
            onClick={onAccept}
            className="w-16 h-16 rounded-full bg-online/20 border border-online/40 text-online flex items-center justify-center hover:bg-online/30 transition-all animate-pulse-slow"
          >
            <Phone size={26} />
          </button>
        </div>
      </div>
    </div>
  );
}
