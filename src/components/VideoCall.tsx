'use client';

import { useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket-client';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  roomId: string;
  targetUserId: string;
  targetNickname: string;
  myUserId: string;
  isInitiator: boolean;  // true = 전화 건 쪽
  onEnd: () => void;
}

export default function VideoCall({ roomId, targetUserId, targetNickname, myUserId, isInitiator, onEnd }: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [connected, setConnected] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    let timer: NodeJS.Timeout;

    const start = async () => {
      // 미디어 스트림 획득
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // RTCPeerConnection 생성
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (e) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
        setConnected(true);
        timer = setInterval(() => setDuration((d) => d + 1), 1000);
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('ice-candidate', { toUserId: targetUserId, candidate: e.candidate });
        }
      };

      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', { toUserId: targetUserId, offer });
      }
    };

    start().catch((err) => {
      console.error('Media error:', err);
    });

    socket.on('webrtc-offer', async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(offer);
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit('webrtc-answer', { toUserId: targetUserId, answer });
    });

    socket.on('webrtc-answer', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      await pcRef.current?.setRemoteDescription(answer);
    });

    socket.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      await pcRef.current?.addIceCandidate(candidate).catch(() => {});
    });

    socket.on('call-ended', () => cleanup());

    return () => {
      clearInterval(timer);
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('ice-candidate');
      socket.off('call-ended');
    };
  }, []);

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    onEnd();
  };

  const handleEnd = () => {
    const socket = getSocket();
    socket.emit('call-end', { toUserId: targetUserId });
    cleanup();
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMicOn(track.enabled); }
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCamOn(track.enabled); }
  };

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* 상대방 영상 (메인) */}
      <div className="relative flex-1 bg-bg-surface">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {!connected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl mb-4 animate-pulse-slow">📹</div>
            <p className="text-white font-medium">{targetNickname}님에게 연결 중...</p>
          </div>
        )}

        {/* 상태 표시 */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2">
          {connected && <div className="w-2 h-2 bg-online rounded-full animate-pulse" />}
          <span className="text-white text-sm font-medium">
            {connected ? formatDuration(duration) : targetNickname}
          </span>
        </div>
      </div>

      {/* 내 영상 (PIP) */}
      <div className="absolute top-4 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover mirror"
        />
        {!camOn && (
          <div className="absolute inset-0 bg-bg-surface flex items-center justify-center">
            <VideoOff size={24} className="text-text-muted" />
          </div>
        )}
      </div>

      {/* 컨트롤 */}
      <div className="flex items-center justify-center gap-6 py-8 bg-black/60 backdrop-blur-xl">
        <button
          onClick={toggleMic}
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center transition-all',
            micOn ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-500 text-white'
          )}
        >
          {micOn ? <Mic size={22} /> : <MicOff size={22} />}
        </button>

        <button
          onClick={handleEnd}
          className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-all"
        >
          <PhoneOff size={26} />
        </button>

        <button
          onClick={toggleCam}
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center transition-all',
            camOn ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-500 text-white'
          )}
        >
          {camOn ? <Video size={22} /> : <VideoOff size={22} />}
        </button>
      </div>

      <style jsx>{`
        .mirror { transform: scaleX(-1); }
      `}</style>
    </div>
  );
}
