'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Hand,
  Smile,
  ScreenShare,
  Users as UsersIcon,
  MessageSquare,
  Info,
  Share2,
  Copy,
  Check,
  RotateCcw,
  ArrowLeft,
  ShieldCheck,
  GraduationCap,
  Send,
  X,
  Lock,
  MessageCircle,
  User,
  Volume2,
} from 'lucide-react';
import { appStore } from '@/lib/store';
import { Course, AuthSession } from '@/lib/types';
import {
  verifyLecturerToken,
  getLecturerInviteMessage,
  getStudentInviteMessage,
} from '@/lib/meetUtils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Google Meet Avatar Background Colors
const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-blue-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-purple-600',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-orange-600',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

// Enterprise-grade STUN + OpenRelay TURN servers for 4G cellular and WiFi traversal
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:openrelay.metered.ca:80' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:80?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
};

// Helper to gather all ICE candidates into a single complete SDP payload
function waitForIceGathering(pc: RTCPeerConnection, maxTimeoutMs: number = 3000): Promise<void> {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') {
      resolve();
      return;
    }
    let timeoutId: any;
    const checkState = () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timeoutId);
        pc.removeEventListener('icegatheringstatechange', checkState);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', checkState);
    timeoutId = setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', checkState);
      resolve();
    }, maxTimeoutMs);
  });
}

interface RemotePeer {
  peerId: string;
  name: string;
  role: string;
  isCamOn: boolean;
  isMicOn: boolean;
  isHandRaised?: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  time: string;
  text: string;
  isMe: boolean;
  isDosen?: boolean;
}

// Remote Video Tile Component (Absolute inset-0 with audio fallback to prevent layout blowout)
function RemoteVideoTile({
  peer,
  stream,
}: {
  peer: RemotePeer;
  stream?: MediaStream;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    const audioEl = audioRef.current;

    if (videoEl && stream) {
      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
      }
      videoEl.play().catch(() => {});
    }

    if (audioEl && stream) {
      if (audioEl.srcObject !== stream) {
        audioEl.srcObject = stream;
      }
      audioEl.play().catch(() => {
        setAudioBlocked(true);
      });
    }

    const handleTrackChange = () => {
      if (videoEl) videoEl.play().catch(() => {});
      if (audioEl) audioEl.play().catch(() => setAudioBlocked(true));
    };

    if (stream) {
      stream.addEventListener('addtrack', handleTrackChange);
      stream.addEventListener('removetrack', handleTrackChange);
    }

    return () => {
      if (stream) {
        stream.removeEventListener('addtrack', handleTrackChange);
        stream.removeEventListener('removetrack', handleTrackChange);
      }
    };
  }, [stream, peer.isCamOn]);

  const handleManualUnmute = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => setAudioBlocked(false)).catch(() => {});
    }
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const initials = (peer.name.replace(/[^a-zA-Z]/g, '')[0] || 'M').toUpperCase();
  const avatarColor = getAvatarColor(peer.name);

  return (
    <div
      className={`relative bg-[#3c4043] rounded-2xl sm:rounded-3xl overflow-hidden border border-stone-700/80 transition-all flex items-center justify-center shadow-md w-full h-full min-h-0 flex-1 ${
        peer.isHandRaised ? 'ring-2 ring-amber-400' : ''
      }`}
    >
      {/* Remote Video Stream (Muted so mobile autoplay never blocks it; sound is delivered via dedicated audio) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          peer.isCamOn && stream ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Dedicated Remote Audio Stream */}
      <audio ref={audioRef} autoPlay playsInline />

      {/* OFF CAM or Waiting: Google Meet Style Circle Avatar */}
      {(!peer.isCamOn || !stream) && (
        <div className="flex flex-col items-center justify-center p-4 z-10">
          <div
            className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full ${avatarColor} text-white flex items-center justify-center font-bold text-3xl sm:text-4xl shadow-xl ring-4 ring-white/10`}
          >
            {initials}
          </div>
        </div>
      )}

      {/* Audio Autoplay Unblock Button if browser restricted background audio */}
      {audioBlocked && (
        <button
          type="button"
          onClick={handleManualUnmute}
          className="absolute top-12 inset-x-4 mx-auto z-20 py-1.5 px-3 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center space-x-1 shadow-lg"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Klik untuk Dengarkan Suara</span>
        </button>
      )}

      {/* Name Badge */}
      <div className="absolute bottom-2.5 left-2.5 max-w-[85%] bg-stone-900/85 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium text-white flex items-center space-x-1.5 shadow-md z-10">
        <span className="truncate">{peer.name}</span>
        {peer.role === 'DOSEN' && (
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
            DOSEN
          </span>
        )}
      </div>

      {/* Mic Status Icon */}
      <div className="absolute top-2.5 right-2.5 z-10">
        {!peer.isMicOn ? (
          <div className="w-7 h-7 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-md">
            <MicOff className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-stone-900/70 text-emerald-400 flex items-center justify-center shadow-md">
            <Mic className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Hand Raised Badge */}
      {peer.isHandRaised && (
        <div className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-lg animate-bounce z-10">
          <Hand className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

function GoogleMeetRoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const courseId = params?.courseId as string;
  const roleParam = searchParams.get('role');
  const tokenParam = searchParams.get('token');

  const [course, setCourse] = useState<Course | null>(null);
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [isLecturer, setIsLecturer] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Reliable unique peer ID for this session
  const [myPeerId, setMyPeerId] = useState<string>('');

  // Local media controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLocalMediaReady, setIsLocalMediaReady] = useState(false);

  // Layout & Drawers
  const [activeSideDrawer, setActiveSideDrawer] = useState<'PEOPLE' | 'CHAT' | 'INFO' | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedType, setCopiedType] = useState<'dosen' | 'mhs' | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // Realtime multi-user state (ONLY REAL PARTICIPANTS)
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  // Video Stream References
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // WebRTC PeerConnections Map & ICE Candidate Queue
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const iceCandidateQueueRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const channelRef = useRef<any>(null);

  // Class chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputChat, setInputChat] = useState('');

  // Floating reactions pool
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string }[]>([]);

  // Initialize clock and base url
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
    const updateClock = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auth & Course Validation
  useEffect(() => {
    const allCourses = appStore.getCourses();
    const target = allCourses.find((c) => c.id === courseId) || null;
    setCourse(target);

    const currentAuth = appStore.getAuth();
    setAuth(currentAuth);

    if (!target) {
      setIsAuthorized(false);
      return;
    }

    // Check Lecturer Guest Access Token
    if (roleParam === 'dosen' && tokenParam) {
      const isValid = verifyLecturerToken(target.id, target.code, tokenParam);
      if (isValid) {
        setIsLecturer(true);
        setIsAuthorized(true);
        const randId = Math.random().toString(36).substring(2, 7);
        setMyPeerId(`dosen-${target.id}-${randId}`);
        return;
      }
    }

    // Check Student Session
    if (currentAuth) {
      setIsLecturer(false);
      setIsAuthorized(true);
      const userNim = currentAuth.nim ? currentAuth.nim.trim() : 'admin';
      const randId = Math.random().toString(36).substring(2, 7);
      setMyPeerId(`${userNim}-${randId}`);
    } else {
      setIsLecturer(false);
      setIsAuthorized(false);
    }
  }, [courseId, roleParam, tokenParam]);

  // Display name of local user
  const myDisplayName = isLecturer
    ? `${course?.dosen || 'Dosen'} (Dosen Pengampu)`
    : `${auth?.name || 'Mahasiswa'} (Anda)`;

  const myInitials = isLecturer
    ? (course?.dosen.replace(/^(Dr\.|Prof\.|H\.|Drs\.|M\.)\s+/g, '')[0] || 'D').toUpperCase()
    : (auth?.name || 'M')[0].toUpperCase();

  // 1. Acquire Local Camera & Microphone FIRST
  useEffect(() => {
    if (!isAuthorized) return;

    let active = true;

    async function startMedia() {
      try {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(() => {});
        }

        stream.getVideoTracks().forEach((t) => (t.enabled = isCamOn));
        stream.getAudioTracks().forEach((t) => (t.enabled = isMicOn));

        setIsLocalMediaReady(true);
      } catch (err) {
        console.warn('Gagal mengakses kamera/mikrofon langsung:', err);
        setIsCamOn(false);
        setIsLocalMediaReady(true);
      }
    }

    startMedia();

    return () => {
      active = false;
    };
  }, [isAuthorized, facingMode]);

  // 2. Connect WebRTC signaling and Realtime Presence via Supabase
  // (Uses Single Complete-SDP Gathering for bulletproof connection across 4G & WiFi)
  useEffect(() => {
    if (
      !isAuthorized ||
      !courseId ||
      !myPeerId ||
      !isLocalMediaReady ||
      !isSupabaseConfigured()
    )
      return;

    const channelName = `meet-room-${courseId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: myPeerId },
        broadcast: { self: false },
      },
    });

    channelRef.current = channel;

    // Track remote stream updates reliably so React re-renders on track addition
    const handleRemoteTrack = (event: RTCTrackEvent, peerId: string) => {
      const stream =
        event.streams && event.streams[0]
          ? event.streams[0]
          : new MediaStream([event.track]);

      setRemoteStreams((prev) => {
        const current = prev[peerId];
        if (current) {
          if (!current.getTracks().some((t) => t.id === event.track.id)) {
            current.addTrack(event.track);
          }
          return { ...prev, [peerId]: new MediaStream(current.getTracks()) };
        }
        return { ...prev, [peerId]: stream };
      });
    };

    // Helper: Flush queued ICE candidates safely once remote description is set
    const flushIceCandidates = async (peerId: string, pc: RTCPeerConnection) => {
      const queued = iceCandidateQueueRef.current[peerId] || [];
      if (queued.length > 0) {
        for (const cand of queued) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.warn('Error flushing candidate:', e);
          }
        }
        delete iceCandidateQueueRef.current[peerId];
      }
    };

    // Helper: Create RTCPeerConnection for a remote peer with full ICE gathering
    const initiateConnection = async (targetPeerId: string) => {
      if (peerConnectionsRef.current[targetPeerId]) {
        return;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionsRef.current[targetPeerId] = pc;

      // Add local stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle receiving remote stream
      pc.ontrack = (event) => handleRemoteTrack(event, targetPeerId);

      // Trickle ICE candidates for ultra-fast relay connectivity
      pc.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'webrtc-ice-candidate',
            payload: {
              to: targetPeerId,
              from: myPeerId,
              candidate: event.candidate,
            },
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed') {
          try {
            pc.restartIce();
          } catch {}
        }
      };

      try {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);

        // Wait until all STUN & TURN candidates are gathered inside the SDP!
        await waitForIceGathering(pc);

        channel.send({
          type: 'broadcast',
          event: 'webrtc-signal',
          payload: {
            to: targetPeerId,
            from: myPeerId,
            sdp: pc.localDescription,
          },
        });
      } catch (err) {
        console.warn('Error creating WebRTC full offer:', err);
      }
    };

    // 1. Presence Sync: Synchronize who is actually in this room
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const activeRemotePeers: RemotePeer[] = [];

        for (const key in presenceState) {
          if (key === myPeerId) continue;
          const userList = presenceState[key] as any[];
          if (userList && userList.length > 0) {
            const p = userList[0];
            if (!p || !p.peerId || p.peerId === myPeerId) continue;
            if (activeRemotePeers.some((peer) => peer.peerId === p.peerId)) continue;

            activeRemotePeers.push({
              peerId: p.peerId,
              name: p.name,
              role: p.role,
              isCamOn: p.isCamOn,
              isMicOn: p.isMicOn,
              isHandRaised: p.isHandRaised,
            });

            // If connection not established, initiate offer (caller: myPeerId > p.peerId)
            if (!peerConnectionsRef.current[p.peerId] && myPeerId > p.peerId) {
              initiateConnection(p.peerId);
            }
          }
        }

        // Clean up connections for peers that left
        Object.keys(peerConnectionsRef.current).forEach((peerId) => {
          if (!activeRemotePeers.some((p) => p.peerId === peerId)) {
            try {
              peerConnectionsRef.current[peerId].close();
            } catch {}
            delete peerConnectionsRef.current[peerId];
            delete iceCandidateQueueRef.current[peerId];
            setRemoteStreams((prev) => {
              const copy = { ...prev };
              delete copy[peerId];
              return copy;
            });
          }
        });

        setRemotePeers(activeRemotePeers);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        if (Array.isArray(leftPresences)) {
          leftPresences.forEach((lp: any) => {
            if (lp?.peerId && peerConnectionsRef.current[lp.peerId]) {
              try {
                peerConnectionsRef.current[lp.peerId].close();
              } catch {}
              delete peerConnectionsRef.current[lp.peerId];
              delete iceCandidateQueueRef.current[lp.peerId];
              setRemoteStreams((prev) => {
                const copy = { ...prev };
                delete copy[lp.peerId];
                return copy;
              });
            }
          });
        }
      });

    // 2. WebRTC Signaling Receiver (Handles Single Complete-SDP Offer & Answer)
    channel.on('broadcast', { event: 'webrtc-signal' }, async ({ payload }) => {
      if (!payload || payload.to !== myPeerId) return;

      const { from, sdp } = payload;
      if (!sdp) return;

      let pc = peerConnectionsRef.current[from];

      if (sdp.type === 'offer') {
        if (pc) {
          try {
            pc.close();
          } catch {}
        }

        pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionsRef.current[from] = pc;

        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => {
            pc.addTrack(track, localStreamRef.current!);
          });
        }

        pc.ontrack = (event) => handleRemoteTrack(event, from);

        pc.onicecandidate = (event) => {
          if (event.candidate && channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'webrtc-ice-candidate',
              payload: {
                to: from,
                from: myPeerId,
                candidate: event.candidate,
              },
            });
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === 'failed') {
            try {
              pc.restartIce();
            } catch {}
          }
        };

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          await flushIceCandidates(from, pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          // Wait until answer candidates are collected inside SDP!
          await waitForIceGathering(pc);

          channel.send({
            type: 'broadcast',
            event: 'webrtc-signal',
            payload: {
              to: from,
              from: myPeerId,
              sdp: pc.localDescription,
            },
          });
        } catch (err) {
          console.warn('Error handling WebRTC complete offer:', err);
        }
      } else if (sdp.type === 'answer') {
        if (pc && pc.signalingState === 'have-local-offer') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            await flushIceCandidates(from, pc);
          } catch (err) {
            console.warn('Error setting WebRTC answer:', err);
          }
        }
      }
    });

    // 2b. WebRTC Trickle ICE Candidate Receiver
    channel.on('broadcast', { event: 'webrtc-ice-candidate' }, async ({ payload }) => {
      if (!payload || payload.to !== myPeerId || !payload.candidate) return;
      const { from, candidate } = payload;
      const pc = peerConnectionsRef.current[from];

      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('Error adding live ICE candidate:', e);
        }
      } else {
        if (!iceCandidateQueueRef.current[from]) {
          iceCandidateQueueRef.current[from] = [];
        }
        iceCandidateQueueRef.current[from].push(candidate);
      }
    });

    // 3. Peer State Updates (Cam / Mic / Raise Hand toggles)
    channel.on('broadcast', { event: 'peer-state-update' }, ({ payload }) => {
      if (!payload || !payload.peerId) return;
      setRemotePeers((prev) =>
        prev.map((p) => (p.peerId === payload.peerId ? { ...p, ...payload } : p))
      );
    });

    // 4. In-Meeting Chat Broadcast
    channel.on('broadcast', { event: 'chat-message' }, ({ payload }) => {
      if (!payload) return;
      setChatMessages((prev) => [...prev, { ...payload, isMe: false }]);
    });

    // 5. Floating Emoji Reaction Broadcast
    channel.on('broadcast', { event: 'emoji-reaction' }, ({ payload }) => {
      if (!payload?.emoji) return;
      const newReaction = { id: Date.now(), emoji: payload.emoji };
      setFloatingReactions((prev) => [...prev, newReaction]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 2800);
    });

    // Subscribe to channel & track initial presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          peerId: myPeerId,
          name: isLecturer
            ? `${course?.dosen || 'Dosen'} (Dosen Pengampu)`
            : `${auth?.name || 'Mahasiswa'}`,
          role: isLecturer ? 'DOSEN' : auth?.role === 'ADMIN' ? 'ADMIN' : 'MAHASISWA',
          isCamOn: isCamOn,
          isMicOn: isMicOn,
          isHandRaised: isHandRaised,
        });
      }
    });

    return () => {
      channel.unsubscribe();
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        try {
          pc.close();
        } catch {}
      });
      peerConnectionsRef.current = {};
      iceCandidateQueueRef.current = {};
    };
  }, [isAuthorized, courseId, myPeerId, isLocalMediaReady, isLecturer, auth, course]);

  // Handle Toggle Camera
  const handleToggleCam = () => {
    const nextState = !isCamOn;
    setIsCamOn(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'peer-state-update',
        payload: { peerId: myPeerId, isCamOn: nextState },
      });
      channelRef.current.track({
        peerId: myPeerId,
        name: isLecturer ? `${course?.dosen} (Dosen Pengampu)` : `${auth?.name}`,
        role: isLecturer ? 'DOSEN' : 'MAHASISWA',
        isCamOn: nextState,
        isMicOn: isMicOn,
        isHandRaised: isHandRaised,
      });
    }
  };

  // Handle Toggle Mic
  const handleToggleMic = () => {
    const nextState = !isMicOn;
    setIsMicOn(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'peer-state-update',
        payload: { peerId: myPeerId, isMicOn: nextState },
      });
      channelRef.current.track({
        peerId: myPeerId,
        name: isLecturer ? `${course?.dosen} (Dosen Pengampu)` : `${auth?.name}`,
        role: isLecturer ? 'DOSEN' : 'MAHASISWA',
        isCamOn: isCamOn,
        isMicOn: nextState,
        isHandRaised: isHandRaised,
      });
    }
  };

  // Handle Switch Camera (Front <-> Back for Mobile)
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Handle Screen Sharing
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      // Revert peer tracks to camera
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender && videoTrack) sender.replaceTrack(videoTrack);
        });
      }
      return;
    }

    try {
      if (!navigator.mediaDevices.getDisplayMedia) {
        alert('Fitur bagikan layar tidak didukung di perangkat ini.');
        return;
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = screenStream;
        screenVideoRef.current.play().catch(() => {});
      }

      const screenTrack = screenStream.getVideoTracks()[0];
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender && screenTrack) sender.replaceTrack(screenTrack);
      });

      screenTrack.onended = () => {
        setIsScreenSharing(false);
        screenStreamRef.current = null;
        if (localStreamRef.current) {
          const vTrack = localStreamRef.current.getVideoTracks()[0];
          Object.values(peerConnectionsRef.current).forEach((pc) => {
            const s = pc.getSenders().find((send) => send.track?.kind === 'video');
            if (s && vTrack) s.replaceTrack(vTrack);
          });
        }
      };
    } catch (err) {
      console.warn('Batal membagikan layar:', err);
      setIsScreenSharing(false);
    }
  };

  // Handle Raise Hand
  const handleToggleHand = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'peer-state-update',
        payload: { peerId: myPeerId, isHandRaised: nextState },
      });
      channelRef.current.track({
        peerId: myPeerId,
        name: isLecturer ? `${course?.dosen} (Dosen Pengampu)` : `${auth?.name}`,
        role: isLecturer ? 'DOSEN' : 'MAHASISWA',
        isCamOn: isCamOn,
        isMicOn: isMicOn,
        isHandRaised: nextState,
      });
    }

    if (nextState) {
      triggerReaction('✋');
    }
  };

  // Handle Reaction
  const triggerReaction = (emoji: string) => {
    const newReaction = { id: Date.now(), emoji };
    setFloatingReactions((prev) => [...prev, newReaction]);

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'emoji-reaction',
        payload: { emoji, from: myPeerId },
      });
    }

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2800);

    setShowEmojiPicker(false);
  };

  // Send In-Meeting Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputChat.trim()) return;

    const myName = isLecturer
      ? `${course?.dosen || 'Dosen'} (Dosen)`
      : `${auth?.name || 'Mahasiswa'}`;

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender: myName,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      text: inputChat.trim(),
      isMe: true,
      isDosen: isLecturer,
    };

    setChatMessages((prev) => [...prev, newMsg]);

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'chat-message',
        payload: newMsg,
      });
    }

    setInputChat('');
  };

  // Copy Lecturer & Student Invite
  const handleCopyLecturer = () => {
    if (!course) return;
    const msg = getLecturerInviteMessage(course, baseUrl);
    navigator.clipboard.writeText(msg);
    setCopiedType('dosen');
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handleCopyStudent = () => {
    if (!course) return;
    const msg = getStudentInviteMessage(course, baseUrl);
    navigator.clipboard.writeText(msg);
    setCopiedType('mhs');
    setTimeout(() => setCopiedType(null), 3000);
  };

  // End Call / Exit
  const handleLeaveMeeting = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }
    router.replace('/kuliah-online');
  };

  // Blocked / Unauthorized Screen
  if (isAuthorized === false && course) {
    return (
      <div className="fixed inset-0 z-50 bg-[#202124] flex items-center justify-center p-4 select-none">
        <div className="bg-[#2d2f34] text-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-stone-700 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">
              Akses Terproteksi
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-1 text-white">
              {course.name}
            </h2>
            <p className="text-xs text-stone-300 mt-2 leading-relaxed">
              Ruang tatap muka virtual ini khusus untuk mahasiswa kelas HK A 2025 dan Dosen Pengampu ({course.dosen}).
            </p>
          </div>

          <div className="bg-[#202124] rounded-2xl p-4 text-left border border-stone-700/60 text-xs space-y-1.5">
            <p className="font-bold text-amber-300 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" />
              <span>Untuk Bapak/Ibu Dosen Pengampu:</span>
            </p>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              Silakan gunakan tautan undangan khusus dari PJ Kelas untuk langsung bergabung tanpa login.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href={`/login?redirect=/kuliah-online/${course.id}`}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Login Akun Mahasiswa HK A</span>
            </Link>
            <Link
              href="/kuliah-online"
              className="w-full py-2.5 rounded-2xl bg-stone-700 hover:bg-stone-600 font-semibold text-xs text-stone-300 transition-all text-center"
            >
              Kembali
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading authorization
  if (isAuthorized === null || !course) {
    return (
      <div className="fixed inset-0 z-50 bg-[#202124] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-stone-300 font-medium">Menyiapkan Google Meet HK A...</p>
      </div>
    );
  }

  const totalPeopleCount = 1 + remotePeers.length;

  return (
    <div className="fixed inset-0 z-50 bg-[#202124] text-white flex flex-col select-none overflow-hidden font-sans">
      {/* 1. TOP BAR (Google Meet Style) */}
      <header className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between border-b border-stone-800/80 bg-[#202124]/95 flex-shrink-0 z-30">
        {/* Left: Meeting Title & Code */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleLeaveMeeting}
            title="Tinggalkan Pertemuan"
            className="p-2 -ml-2 rounded-full hover:bg-stone-700/60 text-stone-300 transition-colors sm:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-sm sm:text-base tracking-tight text-white line-clamp-1 max-w-[200px] sm:max-w-md">
                {course.name}
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Bebas Batas Waktu
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-mono hidden sm:block">
              {course.code} • Dosen: {course.dosen}
            </p>
          </div>
        </div>

        {/* Center: Live indicator */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-stone-800 border border-stone-700 text-xs text-stone-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] font-semibold">{currentTime}</span>
          </div>
        </div>

        {/* Right: Mobile quick flip camera & Share */}
        <div className="flex items-center space-x-1.5">
          {/* Mobile Flip Camera button */}
          <button
            type="button"
            onClick={handleFlipCamera}
            title="Balik Kamera (Depan / Belakang)"
            className="p-2 sm:hidden rounded-full hover:bg-stone-700/70 text-stone-300 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Share Meeting Link Button */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="px-3 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs font-semibold text-stone-200 flex items-center space-x-1.5 transition-all active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Bagikan Tautan</span>
          </button>

          {/* Info toggle */}
          <button
            type="button"
            onClick={() => setActiveSideDrawer((prev) => (prev === 'INFO' ? null : 'INFO'))}
            className={`p-2 rounded-full transition-colors ${
              activeSideDrawer === 'INFO'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-stone-700/60 text-stone-300'
            }`}
            title="Info Pertemuan"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. MAIN VIEWPORT (Google Meet Grid & Presentation Canvas) */}
      <div className="flex-1 relative flex overflow-hidden p-2 sm:p-4 gap-3 bg-[#202124]">
        {/* Floating Emojis Layer */}
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
          {floatingReactions.map((reaction) => (
            <div
              key={reaction.id}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 text-4xl sm:text-5xl"
              style={{
                animation: 'floatUp 2.5s ease-out forwards',
              }}
            >
              {reaction.emoji}
            </div>
          ))}
        </div>

        {/* Video Canvas Container */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 h-full w-full">
          {/* A. If Screen Sharing is Active */}
          {isScreenSharing && (
            <div className="w-full flex-1 max-h-[50vh] sm:max-h-[60vh] mb-2 relative bg-black rounded-2xl sm:rounded-3xl overflow-hidden border border-stone-700/80 shadow-2xl flex items-center justify-center">
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-stone-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-700 text-xs font-semibold text-white flex items-center space-x-2 shadow-md z-10">
                <ScreenShare className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>Anda sedang mempresentasikan layar</span>
              </div>
            </div>
          )}

          {/* B. VIDEO TILES CONTAINER (Strict 50:50 Mobile Split with absolute inset-0) */}
          <div
            className={`flex-1 min-h-0 w-full h-full ${
              isScreenSharing
                ? 'grid grid-cols-2 sm:grid-cols-4 max-h-[140px] sm:max-h-[180px] gap-2'
                : totalPeopleCount === 1
                ? 'flex items-center justify-center w-full h-full max-w-4xl mx-auto p-1'
                : totalPeopleCount === 2
                ? 'flex flex-col sm:grid sm:grid-cols-2 w-full h-full min-h-0 gap-2 sm:gap-3.5 overflow-hidden'
                : totalPeopleCount <= 4
                ? 'grid grid-cols-2 grid-rows-2 w-full h-full min-h-0 gap-2 sm:gap-3.5 overflow-hidden'
                : 'grid grid-cols-2 sm:grid-cols-3 w-full h-full min-h-0 gap-2 sm:gap-3.5 overflow-hidden'
            }`}
          >
            {/* 1. MY LOCAL TILE (User's Camera / Avatar) */}
            <div
              className={`relative bg-[#3c4043] rounded-2xl sm:rounded-3xl overflow-hidden border transition-all flex items-center justify-center shadow-md w-full h-full min-h-0 flex-1 ${
                !isMicOn ? 'border-stone-700/80' : 'border-stone-600/80'
              } ${isHandRaised ? 'ring-2 ring-amber-400' : ''}`}
            >
              {/* Camera Video Stream (Pinned with absolute inset-0 so it cannot stretch container) */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover -scale-x-100 transition-opacity duration-300 ${
                  isCamOn ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />

              {/* OFF CAM: Google Meet Elegant Circular Avatar with Initial */}
              {!isCamOn && (
                <div className="flex flex-col items-center justify-center p-4 z-10">
                  <div
                    className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full ${getAvatarColor(
                      myDisplayName
                    )} text-white flex items-center justify-center font-bold text-3xl sm:text-4xl shadow-xl ring-4 ring-white/10`}
                  >
                    {myInitials}
                  </div>
                </div>
              )}

              {/* Bottom Left Label: Name Badge */}
              <div className="absolute bottom-2.5 left-2.5 max-w-[85%] bg-stone-900/85 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium text-white flex items-center space-x-1.5 shadow-md z-10">
                <span className="truncate">{myDisplayName}</span>
                {isLecturer && (
                  <GraduationCap className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                )}
              </div>

              {/* Top Right: Mic Status Icon */}
              <div className="absolute top-2.5 right-2.5 z-10">
                {!isMicOn ? (
                  <div className="w-7 h-7 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-md">
                    <MicOff className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-stone-900/70 text-emerald-400 flex items-center justify-center shadow-md">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Hand Raised Badge */}
              {isHandRaised && (
                <div className="absolute top-2.5 left-2.5 w-8 h-8 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-lg animate-bounce z-10">
                  <Hand className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* 2. REAL REMOTE PEERS (Absolute 50:50 equal height share) */}
            {remotePeers.map((peer) => (
              <RemoteVideoTile
                key={peer.peerId}
                peer={peer}
                stream={remoteStreams[peer.peerId]}
              />
            ))}
          </div>

          {/* Empty room notification if alone */}
          {remotePeers.length === 0 && (
            <div className="mt-2 py-2 px-4 bg-stone-800/60 rounded-2xl text-center text-xs text-stone-400 max-w-md mx-auto flex items-center justify-center space-x-2 flex-shrink-0">
              <User className="w-3.5 h-3.5 text-stone-400" />
              <span>Anda sendirian di ruang kuliah ini. Bagikan tautan untuk mengundang mahasiswa atau dosen.</span>
            </div>
          )}
        </div>

        {/* C. SIDE DRAWERS (Chat / Participants / Info) */}
        {activeSideDrawer && (
          <aside className="w-full sm:w-80 md:w-96 bg-[#2d2f34] rounded-3xl border border-stone-700/80 flex flex-col overflow-hidden shadow-2xl z-30 animate-in slide-in-from-right-5 duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-stone-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {activeSideDrawer === 'PEOPLE' && (
                  <>
                    <UsersIcon className="w-4 h-4 text-blue-400" />
                    <h3 className="font-bold text-sm text-white">
                      Peserta ({totalPeopleCount})
                    </h3>
                  </>
                )}
                {activeSideDrawer === 'CHAT' && (
                  <>
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <h3 className="font-bold text-sm text-white">Pesan Dalam Panggilan</h3>
                  </>
                )}
                {activeSideDrawer === 'INFO' && (
                  <>
                    <Info className="w-4 h-4 text-blue-400" />
                    <h3 className="font-bold text-sm text-white">Detail Pertemuan</h3>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveSideDrawer(null)}
                className="p-1 rounded-full hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content: Real Participants List */}
            {activeSideDrawer === 'PEOPLE' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
                {/* Me */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-800/80 border border-stone-700">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full ${getAvatarColor(
                        myDisplayName
                      )} text-white font-bold flex items-center justify-center flex-shrink-0 text-xs`}
                    >
                      {myInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{myDisplayName}</p>
                      <p className="text-[10px] text-stone-400">Anda</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 text-stone-400">
                    {isMicOn ? (
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    )}
                  </div>
                </div>

                {/* Real Remote Peers */}
                {remotePeers.map((p) => (
                  <div
                    key={p.peerId}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-stone-800/50 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full ${getAvatarColor(
                          p.name
                        )} text-white font-bold flex items-center justify-center flex-shrink-0 text-xs`}
                      >
                        {(p.name.replace(/[^a-zA-Z]/g, '')[0] || 'M').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-200 truncate">{p.name}</p>
                        <p className="text-[10px] text-stone-400 font-mono">
                          {p.role === 'DOSEN'
                            ? 'Dosen Pengampu'
                            : p.role === 'ADMIN'
                            ? 'Administrator'
                            : 'Mahasiswa HK A'}
                        </p>
                      </div>
                    </div>
                    <div>
                      {!p.isMicOn ? (
                        <MicOff className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Drawer Content: In-Meeting Realtime Chat */}
            {activeSideDrawer === 'CHAT' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-stone-400 py-10">
                      Belum ada pesan dalam panggilan. Kirim pesan di bawah!
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center space-x-1.5 text-[10px] text-stone-400 mb-0.5">
                          <span className="font-semibold">{msg.sender}</span>
                          <span>•</span>
                          <span>{msg.time}</span>
                        </div>
                        <div
                          className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                            msg.isMe
                              ? 'bg-blue-600 text-white rounded-tr-xs'
                              : 'bg-stone-800 text-stone-200 rounded-tl-xs border border-stone-700'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input Chat Box */}
                <form
                  onSubmit={handleSendChat}
                  className="p-3 border-t border-stone-700 flex items-center space-x-2 bg-[#202124]"
                >
                  <input
                    type="text"
                    value={inputChat}
                    onChange={(e) => setInputChat(e.target.value)}
                    placeholder="Kirim pesan ke semua orang..."
                    className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Drawer Content: Meeting Info */}
            {activeSideDrawer === 'INFO' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-white text-sm">{course.name}</h4>
                  <p className="text-stone-400 text-[11px] mt-0.5">
                    {course.code} • {course.sks} SKS
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-stone-800 border border-stone-700 space-y-1.5 text-stone-300">
                  <p>
                    <strong>Dosen:</strong> {course.dosen}
                  </p>
                  <p>
                    <strong>Jadwal:</strong> {course.day}, {course.time}
                  </p>
                  <p>
                    <strong>Ruang:</strong> {course.room}
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleCopyLecturer}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 font-bold text-xs hover:bg-amber-500/30 transition-all flex items-center justify-center space-x-2"
                  >
                    {copiedType === 'dosen' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Tautan Dosen Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin Pesan Undangan Dosen</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyStudent}
                    className="w-full py-2.5 px-3 rounded-xl bg-stone-800 border border-stone-700 text-stone-300 font-semibold text-xs hover:bg-stone-700 transition-all flex items-center justify-center space-x-2"
                  >
                    {copiedType === 'mhs' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Tautan Mahasiswa Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin Link Mahasiswa</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* 3. GOOGLE MEET BOTTOM CONTROLS BAR */}
      <footer className="h-20 px-4 sm:px-6 flex items-center justify-between bg-[#202124] border-t border-stone-800/80 flex-shrink-0 z-30">
        {/* Left Side: Meeting details (Desktop only) */}
        <div className="hidden lg:flex items-center space-x-2 text-xs font-mono text-stone-300">
          <span className="font-bold text-white tracking-wide">{currentTime}</span>
          <span className="text-stone-500">|</span>
          <span className="truncate max-w-[200px] text-stone-400">{course.code}</span>
        </div>

        {/* Center: Main Circular Control Buttons */}
        <div className="flex items-center justify-center space-x-2.5 sm:space-x-4 w-full lg:w-auto">
          {/* 1. Microphone Toggle */}
          <button
            type="button"
            onClick={handleToggleMic}
            title={isMicOn ? 'Matikan Mikrofon' : 'Nyalakan Mikrofon'}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
              isMicOn
                ? 'bg-[#3c4043] hover:bg-[#434649] text-white'
                : 'bg-[#ea4335] hover:bg-[#d93025] text-white'
            }`}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* 2. Camera Toggle */}
          <button
            type="button"
            onClick={handleToggleCam}
            title={isCamOn ? 'Matikan Kamera' : 'Nyalakan Kamera'}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
              isCamOn
                ? 'bg-[#3c4043] hover:bg-[#434649] text-white'
                : 'bg-[#ea4335] hover:bg-[#d93025] text-white'
            }`}
          >
            {isCamOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* 3. Screen Sharing */}
          <button
            type="button"
            onClick={handleToggleScreenShare}
            title={isScreenSharing ? 'Hentikan Berbagi Layar' : 'Presentasikan Layar'}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
              isScreenSharing
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-[#3c4043] hover:bg-[#434649] text-white'
            }`}
          >
            <ScreenShare className="w-5 h-5" />
          </button>

          {/* 4. Raise Hand */}
          <button
            type="button"
            onClick={handleToggleHand}
            title={isHandRaised ? 'Turunkan Tangan' : 'Angkat Tangan'}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${
              isHandRaised
                ? 'bg-[#fbbc04] text-stone-950 font-bold'
                : 'bg-[#3c4043] hover:bg-[#434649] text-white'
            }`}
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* 5. Emoji Reactions Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              title="Kirim Reaksi Emoticon"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#3c4043] hover:bg-[#434649] text-white flex items-center justify-center transition-all shadow-md active:scale-95"
            >
              <Smile className="w-5 h-5" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-[#2d2f34] border border-stone-700 rounded-full p-1.5 shadow-2xl flex items-center space-x-1 animate-in zoom-in-95 z-50">
                {['💖', '👍', '🎉', '👏', '😂', '😮', '😢', '👎'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => triggerReaction(emoji)}
                    className="p-2 text-xl hover:scale-125 transition-transform rounded-full hover:bg-stone-700"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 6. RED END CALL BUTTON */}
          <button
            type="button"
            onClick={handleLeaveMeeting}
            title="Tinggalkan Pertemuan"
            className="w-14 h-11 sm:w-16 sm:h-12 rounded-full bg-[#ea4335] hover:bg-[#d93025] text-white flex items-center justify-center transition-all shadow-lg active:scale-95"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>

        {/* Right Side: Participant Count & Chat Drawers */}
        <div className="hidden sm:flex items-center space-x-2">
          {/* People Button */}
          <button
            type="button"
            onClick={() => setActiveSideDrawer((prev) => (prev === 'PEOPLE' ? null : 'PEOPLE'))}
            className={`p-2.5 rounded-full transition-colors flex items-center space-x-1 text-xs font-semibold ${
              activeSideDrawer === 'PEOPLE'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-stone-700/60 text-stone-300'
            }`}
            title="Daftar Peserta"
          >
            <UsersIcon className="w-5 h-5" />
            <span>{totalPeopleCount}</span>
          </button>

          {/* Chat Button */}
          <button
            type="button"
            onClick={() => setActiveSideDrawer((prev) => (prev === 'CHAT' ? null : 'CHAT'))}
            className={`p-2.5 rounded-full transition-colors ${
              activeSideDrawer === 'CHAT'
                ? 'bg-blue-600 text-white'
                : 'hover:bg-stone-700/60 text-stone-300'
            }`}
            title="Pesan Dalam Panggilan"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </footer>

      {/* Share Invite Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#2d2f34] text-white rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-stone-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-700 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Bagikan Tautan Kuliah</h3>
                  <p className="text-[10px] text-stone-400">{course.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-stone-400 hover:text-white p-1 text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Option 1: Lecturer WhatsApp Link */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-amber-200 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-amber-300" />
                  <span>Tautan Khusus Dosen ({course.dosen})</span>
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Tanpa Login
                </span>
              </div>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                Dosen otomatis masuk sebagai Dosen Pengampu tanpa perlu membuat akun atau login.
              </p>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyLecturer}
                  className="flex-1 py-2 px-3 rounded-xl bg-white text-stone-900 font-bold text-xs hover:bg-stone-200 transition-all flex items-center justify-center space-x-1.5"
                >
                  {copiedType === 'dosen' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Pesan WA Dosen</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const msg = getLecturerInviteMessage(course, baseUrl);
                    window.open(
                      `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`,
                      '_blank'
                    );
                  }}
                  className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Kirim WA</span>
                </button>
              </div>
            </div>

            {/* Option 2: Student WhatsApp Link */}
            <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-stone-200 flex items-center gap-1.5">
                  <UsersIcon className="w-4 h-4 text-blue-400" />
                  <span>Tautan Grup Mahasiswa HK A</span>
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-stone-700 text-stone-300">
                  Wajib Login
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyStudent}
                  className="flex-1 py-2 px-3 rounded-xl bg-stone-700 hover:bg-stone-600 text-white font-bold text-xs transition-all flex items-center justify-center space-x-1.5"
                >
                  {copiedType === 'mhs' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Pesan Grup Mahasiswa</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GoogleMeetRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 bg-[#202124] flex flex-col items-center justify-center text-white space-y-4">
          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-300 font-medium">Menyiapkan Google Meet HK A...</p>
        </div>
      }
    >
      <GoogleMeetRoomContent />
    </Suspense>
  );
}
