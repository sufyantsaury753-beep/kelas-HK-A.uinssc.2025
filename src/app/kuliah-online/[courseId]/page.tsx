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
import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
  RemoteTrack,
  ParticipantEvent,
  VideoPresets,
} from 'livekit-client';
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

// Persistent Device ID across browser reloads so LiveKit immediately kicks previous connection on rejoin
function getPersistentDeviceId(): string {
  if (typeof window === 'undefined') return 'srv';
  try {
    const key = 'hk_meet_device_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = Math.random().toString(36).substring(2, 9);
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return 'dev-' + Math.random().toString(36).substring(2, 7);
  }
}

interface LiveKitRemotePeer {
  peerId: string;
  name: string;
  role: string;
  isCamOn: boolean;
  isMicOn: boolean;
  isHandRaised?: boolean;
  participant: RemoteParticipant;
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
}: {
  peer: LiveKitRemotePeer;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [isCamOn, setIsCamOn] = useState(peer.isCamOn);
  const [isMicOn, setIsMicOn] = useState(peer.isMicOn);

  useEffect(() => {
    setIsCamOn(peer.isCamOn);
    setIsMicOn(peer.isMicOn);
  }, [peer.isCamOn, peer.isMicOn]);

  useEffect(() => {
    const videoEl = videoRef.current;
    const audioEl = audioRef.current;
    const p = peer.participant;
    if (!p) return;

    const checkTracks = () => {
      let hasActiveVideo = false;
      let hasActiveAudio = false;

      p.trackPublications.forEach((pub) => {
        if (pub.track) {
          if (pub.kind === Track.Kind.Video && videoEl) {
            pub.track.attach(videoEl);
            if (!pub.isMuted) hasActiveVideo = true;
          } else if (pub.kind === Track.Kind.Audio && audioEl) {
            pub.track.attach(audioEl);
            if (!pub.isMuted) hasActiveAudio = true;
          }
        }
      });

      setIsCamOn(Boolean(p.isCameraEnabled && hasActiveVideo));
      setIsMicOn(Boolean(p.isMicrophoneEnabled && hasActiveAudio));
    };

    checkTracks();

    const handleTrackSubscribed = (track: RemoteTrack) => {
      if (track.kind === Track.Kind.Video && videoEl) {
        track.attach(videoEl);
        setIsCamOn(true);
      } else if (track.kind === Track.Kind.Audio && audioEl) {
        track.attach(audioEl);
        audioEl.play().catch(() => setAudioBlocked(true));
        setIsMicOn(true);
      }
    };

    const handleTrackUnsubscribed = (track: RemoteTrack) => {
      if (track.kind === Track.Kind.Video && videoEl) {
        track.detach(videoEl);
        setIsCamOn(false);
      } else if (track.kind === Track.Kind.Audio && audioEl) {
        track.detach(audioEl);
        setIsMicOn(false);
      }
    };

    const handleTrackMuted = (pub: any) => {
      if (pub.kind === Track.Kind.Video) setIsCamOn(false);
      if (pub.kind === Track.Kind.Audio) setIsMicOn(false);
    };

    const handleTrackUnmuted = (pub: any) => {
      if (pub.kind === Track.Kind.Video) {
        if (pub.track && videoEl) pub.track.attach(videoEl);
        setIsCamOn(true);
      }
      if (pub.kind === Track.Kind.Audio) {
        if (pub.track && audioEl) pub.track.attach(audioEl);
        setIsMicOn(true);
      }
    };

    p.on(ParticipantEvent.TrackSubscribed, handleTrackSubscribed);
    p.on(ParticipantEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    p.on(ParticipantEvent.TrackMuted, handleTrackMuted);
    p.on(ParticipantEvent.TrackUnmuted, handleTrackUnmuted);

    return () => {
      p.off(ParticipantEvent.TrackSubscribed, handleTrackSubscribed);
      p.off(ParticipantEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      p.off(ParticipantEvent.TrackMuted, handleTrackMuted);
      p.off(ParticipantEvent.TrackUnmuted, handleTrackUnmuted);
      if (videoEl) {
        p.trackPublications.forEach((pub) => {
          if (pub.track?.kind === Track.Kind.Video) pub.track.detach(videoEl);
        });
      }
      if (audioEl) {
        p.trackPublications.forEach((pub) => {
          if (pub.track?.kind === Track.Kind.Audio) pub.track.detach(audioEl);
        });
      }
    };
  }, [peer.participant]);

  const handleManualUnmute = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => setAudioBlocked(false)).catch(() => {});
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
          isCamOn ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Dedicated Remote Audio Stream */}
      <audio ref={audioRef} autoPlay playsInline />

      {/* OFF CAM or Waiting: Google Meet Style Circle Avatar */}
      {!isCamOn && (
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

  // Realtime multi-user state (LiveKit SFU Participants)
  const [remotePeers, setRemotePeers] = useState<LiveKitRemotePeer[]>([]);
  const [remoteScreenTrack, setRemoteScreenTrack] = useState<RemoteTrack | null>(null);
  const [remoteScreenSharerName, setRemoteScreenSharerName] = useState<string>('');
  const [raisedHands, setRaisedHands] = useState<Record<string, boolean>>({});

  // Video Stream References
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteScreenVideoRef = useRef<HTMLVideoElement | null>(null);

  // LiveKit Room reference
  const roomRef = useRef<Room | null>(null);
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

    const deviceId = getPersistentDeviceId();

    // Check Lecturer Guest Access Token
    if (roleParam === 'dosen' && tokenParam) {
      const isValid = verifyLecturerToken(target.id, target.code, tokenParam);
      if (isValid) {
        setIsLecturer(true);
        setIsAuthorized(true);
        setMyPeerId(`dosen-${target.id}`);
        return;
      }
    }

    // Check Student Session
    if (currentAuth) {
      setIsLecturer(false);
      setIsAuthorized(true);
      const userNim = currentAuth.nim ? currentAuth.nim.trim() : 'admin';
      const rolePrefix = currentAuth.role === 'ADMIN' ? 'admin' : 'mhs';
      setMyPeerId(`${rolePrefix}-${userNim}`);
    } else {
      setIsLecturer(false);
      setIsAuthorized(false);
    }
  }, [courseId, roleParam, tokenParam]);

  // Display name of local user
  const myDisplayName = isLecturer
    ? `${course?.dosen || 'Dosen'} (Dosen Pengampu)`
    : `${auth?.name || 'Mahasiswa'}`;

  const myInitials = isLecturer
    ? (course?.dosen.replace(/^(Dr\.|Prof\.|H\.|Drs\.|M\.)\s+/g, '')[0] || 'D').toUpperCase()
    : (auth?.name || 'M')[0].toUpperCase();

  // 1. Connect to LiveKit Cloud Room (High Speed SFU Media Server)
  useEffect(() => {
    if (!isAuthorized || !courseId || !myPeerId) return;

    let active = true;
    let room: Room | null = null;

    async function initLiveKit() {
      try {
        const res = await fetch(
          `/api/livekit/token?room=${encodeURIComponent(courseId)}&identity=${encodeURIComponent(
            myPeerId
          )}&name=${encodeURIComponent(myDisplayName)}`
        );
        const data = await res.json();
        if (!data.token) {
          throw new Error(data.error || 'Gagal memperoleh token akses LiveKit');
        }

        if (!active) return;

        const livekitUrl =
          process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://kelas-hk-a-aiflm7bo.livekit.cloud';

        room = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h540.resolution,
            facingMode,
          },
          audioCaptureDefaults: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          publishDefaults: {
            simulcast: true,
            videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360],
            videoCodec: 'vp8',
            dtx: true,
            red: true,
            audioPreset: { maxBitrate: 32000 },
          },
        });
        roomRef.current = room;

        const syncParticipants = () => {
          if (!room || !active) return;
          const remotesRaw: LiveKitRemotePeer[] = [];
          let activeRemoteScreen: { track: RemoteTrack; name: string } | null = null;

          room.remoteParticipants.forEach((p) => {
            // NEVER include self or any stale/ghost session belonging to the local user
            const isSelf =
              p.identity === myPeerId ||
              p.identity === room?.localParticipant.identity ||
              (p.name && myDisplayName && p.name.trim().toLowerCase() === myDisplayName.trim().toLowerCase()) ||
              (auth?.nim && p.identity.includes(auth.nim.trim()));

            if (isSelf) {
              return;
            }

            const role = p.identity.startsWith('dosen-')
              ? 'DOSEN'
              : p.identity.startsWith('admin')
              ? 'ADMIN'
              : 'MAHASISWA';

            remotesRaw.push({
              peerId: p.identity,
              name: p.name || p.identity,
              role,
              isCamOn: p.isCameraEnabled,
              isMicOn: p.isMicrophoneEnabled,
              isHandRaised: Boolean(raisedHands[p.identity]),
              participant: p,
            });

            p.trackPublications.forEach((pub) => {
              if (pub.source === Track.Source.ScreenShare && pub.track) {
                activeRemoteScreen = {
                  track: pub.track as RemoteTrack,
                  name: p.name || p.identity,
                };
              }
            });
          });

          // Deduplicate by participant name (case-insensitive) to prevent ghost tiles during reconnects
          const peerMap = new Map<string, LiveKitRemotePeer>();
          for (const peer of remotesRaw) {
            const key = peer.name.trim().toLowerCase();
            const existing = peerMap.get(key);
            if (!existing) {
              peerMap.set(key, peer);
            } else {
              // Keep the one with active camera or newer join timestamp
              const existingTime = existing.participant?.joinedAt?.getTime() || 0;
              const currentTime = peer.participant?.joinedAt?.getTime() || 0;
              if (peer.isCamOn && !existing.isCamOn) {
                peerMap.set(key, peer);
              } else if (currentTime >= existingTime) {
                peerMap.set(key, peer);
              }
            }
          }
          const remotes = Array.from(peerMap.values());

          setRemotePeers(remotes);
          if (activeRemoteScreen) {
            setRemoteScreenTrack((activeRemoteScreen as any).track);
            setRemoteScreenSharerName((activeRemoteScreen as any).name);
          } else {
            setRemoteScreenTrack(null);
            setRemoteScreenSharerName('');
          }
        };

        room.on(RoomEvent.Connected, syncParticipants);
        room.on(RoomEvent.ParticipantConnected, syncParticipants);
        room.on(RoomEvent.ParticipantDisconnected, syncParticipants);
        room.on(RoomEvent.TrackSubscribed, syncParticipants);
        room.on(RoomEvent.TrackUnsubscribed, syncParticipants);
        room.on(RoomEvent.TrackMuted, syncParticipants);
        room.on(RoomEvent.TrackUnmuted, syncParticipants);

        await room.connect(livekitUrl, data.token);

        if (!active) {
          room.disconnect();
          return;
        }

        // Enable Camera & Mic based on state with 540p & speech audio
        await room.localParticipant.setCameraEnabled(isCamOn, {
          resolution: VideoPresets.h540.resolution,
          facingMode,
        });
        await room.localParticipant.setMicrophoneEnabled(isMicOn, {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        });

        // Attach local camera to localVideoRef
        const camTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack;
        if (camTrack && localVideoRef.current) {
          camTrack.attach(localVideoRef.current);
        }

        setIsLocalMediaReady(true);
      } catch (err) {
        console.error('LiveKit connection error:', err);
        setIsLocalMediaReady(true);
      }
    }

    // Fast cleanup on tab close / browser refresh to evict session immediately
    const handleBrowserExit = () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
    window.addEventListener('beforeunload', handleBrowserExit);
    window.addEventListener('pagehide', handleBrowserExit);

    initLiveKit();

    return () => {
      active = false;
      window.removeEventListener('beforeunload', handleBrowserExit);
      window.removeEventListener('pagehide', handleBrowserExit);
      if (room) {
        room.disconnect();
      }
      roomRef.current = null;
    };
  }, [isAuthorized, courseId, myPeerId, myDisplayName]);

  // Attach Remote Screen Share Video
  useEffect(() => {
    if (remoteScreenTrack && remoteScreenVideoRef.current) {
      remoteScreenTrack.attach(remoteScreenVideoRef.current);
      return () => {
        remoteScreenTrack.detach(remoteScreenVideoRef.current!);
      };
    }
  }, [remoteScreenTrack]);

  // 2. Connect Supabase Realtime Channel for In-Meeting Chat & Floating Emoji Reactions
  useEffect(() => {
    if (!isAuthorized || !courseId || !myPeerId || !isSupabaseConfigured()) return;

    const channelName = `meet-room-${courseId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
      },
    });

    channelRef.current = channel;

    // Chat messages
    channel.on('broadcast', { event: 'chat-message' }, ({ payload }) => {
      if (!payload) return;
      setChatMessages((prev) => [...prev, { ...payload, isMe: false }]);
    });

    // Floating reaction emojis
    channel.on('broadcast', { event: 'emoji-reaction' }, ({ payload }) => {
      if (!payload?.emoji) return;
      const newReaction = { id: Date.now(), emoji: payload.emoji };
      setFloatingReactions((prev) => [...prev, newReaction]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 2800);
    });

    // Raised hands state
    channel.on('broadcast', { event: 'hand-raised-update' }, ({ payload }) => {
      if (!payload?.peerId) return;
      setRaisedHands((prev) => ({
        ...prev,
        [payload.peerId]: payload.isHandRaised,
      }));
      setRemotePeers((prev) =>
        prev.map((p) =>
          p.peerId === payload.peerId ? { ...p, isHandRaised: payload.isHandRaised } : p
        )
      );
    });

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [isAuthorized, courseId, myPeerId]);

  // Handle Toggle Camera
  const handleToggleCam = async () => {
    const nextState = !isCamOn;
    setIsCamOn(nextState);
    if (roomRef.current) {
      await roomRef.current.localParticipant.setCameraEnabled(nextState, {
        resolution: VideoPresets.h540.resolution,
        facingMode,
      });
      if (nextState) {
        const camTrack = roomRef.current.localParticipant.getTrackPublication(
          Track.Source.Camera
        )?.videoTrack;
        if (camTrack && localVideoRef.current) {
          camTrack.attach(localVideoRef.current);
        }
      }
    }
  };

  // Handle Toggle Mic
  const handleToggleMic = async () => {
    const nextState = !isMicOn;
    setIsMicOn(nextState);
    if (roomRef.current) {
      await roomRef.current.localParticipant.setMicrophoneEnabled(nextState, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
    }
  };

  // Handle Switch Camera (Front <-> Back for Mobile)
  const handleFlipCamera = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    if (roomRef.current) {
      try {
        await roomRef.current.localParticipant.setCameraEnabled(false);
        await roomRef.current.localParticipant.setCameraEnabled(true, {
          resolution: VideoPresets.h540.resolution,
          facingMode: nextFacing,
        });
        const camTrack = roomRef.current.localParticipant.getTrackPublication(
          Track.Source.Camera
        )?.videoTrack;
        if (camTrack && localVideoRef.current) {
          camTrack.attach(localVideoRef.current);
        }
      } catch (err) {
        console.warn('Gagal flip camera:', err);
      }
    }
  };

  // Handle Screen Sharing
  const handleToggleScreenShare = async () => {
    if (!roomRef.current) return;
    try {
      const nextState = !isScreenSharing;
      await roomRef.current.localParticipant.setScreenShareEnabled(nextState);
      setIsScreenSharing(nextState);
      if (nextState) {
        const screenTrack = roomRef.current.localParticipant.getTrackPublication(
          Track.Source.ScreenShare
        )?.videoTrack;
        if (screenTrack && screenVideoRef.current) {
          screenTrack.attach(screenVideoRef.current);
        }
      }
    } catch (err) {
      console.warn('Batal membagikan layar:', err);
      setIsScreenSharing(false);
    }
  };

  // Handle Raise Hand
  const handleToggleHand = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    setRaisedHands((prev) => ({ ...prev, [myPeerId]: nextState }));

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'hand-raised-update',
        payload: { peerId: myPeerId, isHandRaised: nextState },
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
    if (roomRef.current) {
      try {
        roomRef.current.localParticipant.trackPublications.forEach((pub) => {
          pub.track?.stop();
        });
      } catch (e) {
        // ignore
      }
      roomRef.current.disconnect();
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
          {/* A. If Local Screen Sharing is Active */}
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

          {/* A2. If Remote Screen Sharing is Active */}
          {remoteScreenTrack && !isScreenSharing && (
            <div className="w-full flex-1 max-h-[50vh] sm:max-h-[60vh] mb-2 relative bg-black rounded-2xl sm:rounded-3xl overflow-hidden border border-stone-700/80 shadow-2xl flex items-center justify-center">
              <video
                ref={remoteScreenVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-stone-900/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-700 text-xs font-semibold text-white flex items-center space-x-2 shadow-md z-10">
                <ScreenShare className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>{remoteScreenSharerName || 'Peserta'} sedang mempresentasikan layar</span>
              </div>
            </div>
          )}

          {/* B. VIDEO TILES CONTAINER (Strict 50:50 Mobile Split with absolute inset-0) */}
          <div
            className={`flex-1 min-h-0 w-full h-full ${
              isScreenSharing || remoteScreenTrack
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
