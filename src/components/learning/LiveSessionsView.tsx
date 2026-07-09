import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Loader2, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  PhoneOff, 
  Calendar, 
  Copy, 
  ExternalLink, 
  Plus, 
  History, 
  LogOut, 
  Check, 
  Sparkles,
  Link
} from 'lucide-react';
import { Room, RoomEvent, VideoTrack } from 'livekit-client';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useToast } from '../../context/ToastContext';

interface GoogleMeetSpace {
  id: string;
  userId: string;
  meetingUri: string;
  meetingCode: string;
  title: string;
  createdAt: any;
}

export const LiveSessionsView: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'ai' | 'meet'>('ai');

  // Existing LiveKit/AI Session States
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live'>('idle');
  const [room, setRoom] = useState<Room | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<VideoTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<VideoTrack | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);

  // Google Meet States
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [creatingSpace, setCreatingSpace] = useState(false);
  const [newSpaceTitle, setNewSpaceTitle] = useState('');
  const [meetSpaces, setMeetSpaces] = useState<GoogleMeetSpace[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch Google Meet space history from Firestore
  const fetchMeetSpaces = async () => {
    if (!auth.currentUser) return;
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, "google_meet_spaces"),
        where("userId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const spaces: GoogleMeetSpace[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        spaces.push({
          id: docSnap.id,
          userId: data.userId,
          meetingUri: data.meetingUri,
          meetingCode: data.meetingCode,
          title: data.title,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });
      // Sort in-memory to avoid requiring a composite index setup right away
      spaces.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setMeetSpaces(spaces);
    } catch (error) {
      console.error("Error fetching Google Meet spaces:", error);
      handleFirestoreError(error, OperationType.LIST, 'google_meet_spaces');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'meet') {
      fetchMeetSpaces();
    }
  }, [activeTab]);

  // Google Authentication handler to request Google Meet scopes
  const handleConnectGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/meetings.space.created');
      provider.addScope('https://www.googleapis.com/auth/meetings.space.readonly');
      provider.addScope('https://www.googleapis.com/auth/meetings.space.settings');

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (credential?.accessToken) {
        setGoogleToken(credential.accessToken);
        addToast("Conta do Google conectada com sucesso ao Google Meet!", "success");
        fetchMeetSpaces();
      } else {
        addToast("Não foi possível obter o token do Google.", "error");
      }
    } catch (error: any) {
      console.error("Google authentication error:", error);
      addToast(`Falha ao conectar conta Google: ${error.message}`, "error");
    }
  };

  const handleDisconnectGoogle = () => {
    setGoogleToken(null);
    addToast("Desconectado do serviço do Google Meet.", "success");
  };

  // Google Meet space creation handler
  const handleCreateMeetSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleToken) {
      addToast("Conecte sua conta do Google primeiro.", "error");
      return;
    }

    const title = newSpaceTitle.trim() || "Sessão de Conversação LingoLive";
    setCreatingSpace(true);

    try {
      const res = await fetch('https://meet.googleapis.com/v2/spaces', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error(`Google Meet API error: ${res.statusText}`);
      }

      const data = await res.json();
      
      if (!data.meetingUri) {
        throw new Error("Formato de resposta inesperado do Google Meet API");
      }

      const meetingCode = data.meetingUri.split('/').pop() || "";

      // Save to Firestore
      if (auth.currentUser) {
        try {
          await addDoc(collection(db, "google_meet_spaces"), {
            userId: auth.currentUser.uid,
            meetingUri: data.meetingUri,
            meetingCode: meetingCode,
            title: title,
            createdAt: new Date(), // using local timestamp initially to display instantly
          });
        } catch (dbErr: any) {
          handleFirestoreError(dbErr, OperationType.CREATE, 'google_meet_spaces');
        }
      }

      addToast("Sala do Google Meet criada com sucesso!", "success");
      setNewSpaceTitle('');
      fetchMeetSpaces();
    } catch (error: any) {
      console.error("Failed to create Google Meet space:", error);
      addToast(`Erro ao criar sala do Meet: ${error.message}`, "error");
    } finally {
      setCreatingSpace(false);
    }
  };

  const copyToClipboard = (text: string, spaceId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(spaceId);
    addToast("Link copiado para a área de transferência!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Existing LiveKit handlers
  const startLiveSession = async () => {
    setStatus('connecting');
    try {
      const room = new Room();
      
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === 'video') {
            setRemoteVideoTrack(track as VideoTrack);
        }
      });

      const url = 'wss://your-livekit-url.com'; 
      const token = 'your-token'; 
      
      await room.connect(url, token);
      
      await room.localParticipant.setCameraEnabled(true);
      await room.localParticipant.setMicrophoneEnabled(true);

      const localPub = room.localParticipant.videoTrackPublications.values().next().value;
      if (localPub?.videoTrack) setLocalVideoTrack(localPub.videoTrack as VideoTrack);

      setRoom(room);
      setStatus('live');
    } catch (error) {
      console.error("Connection failed", error);
      setStatus('idle');
    }
  };

  const endLiveSession = () => {
    room?.disconnect();
    setRoom(null);
    setRemoteVideoTrack(null);
    setLocalVideoTrack(null);
    setStatus('idle');
  };

  const toggleMic = async () => {
    if (!room) return;
    await room.localParticipant.setMicrophoneEnabled(!isMicEnabled);
    setIsMicEnabled(!isMicEnabled);
  };

  const toggleCamera = async () => {
    if (!room) return;
    await room.localParticipant.setCameraEnabled(!isCameraEnabled);
    setIsCameraEnabled(!isCameraEnabled);
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (remoteVideoTrack && video) {
      remoteVideoTrack.attach(video);
    }
    return () => {
      remoteVideoTrack?.detach();
    };
  }, [remoteVideoTrack]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = localVideoRef.current;
    if (localVideoTrack && video) {
      localVideoTrack.attach(video);
    }
    return () => {
      localVideoTrack?.detach();
    };
  }, [localVideoTrack]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Video className="w-8 h-8 text-indigo-600" />
            Sessões Ao Vivo
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Escolha entre interagir com nossa IA integrada ou criar uma sala dedicada com o Google Meet.
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button 
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'ai' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Sessão com IA (LiveKit)
          </button>
          <button 
            onClick={() => setActiveTab('meet')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === 'meet' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-4 h-4 text-emerald-600" />
            Google Meet Síncrono
          </button>
        </div>
      </div>

      {activeTab === 'ai' ? (
        /* TAB 1: AI LIVEKIT SESSION */
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[450px] flex flex-col items-center justify-center gap-6">
          {status === 'idle' && (
            <div className="text-center max-w-md space-y-4">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Iniciar Prática com Voz IA</h3>
              <p className="text-slate-500 text-sm">
                Conecte-se com nosso instrutor inteligente para uma simulação fluida de voz bidirecional.
              </p>
              <button 
                onClick={startLiveSession}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition shadow-lg shadow-indigo-600/20"
              >
                <Video size={20} />
                Iniciar Sessão Ao Vivo
              </button>
            </div>
          )}

          {status === 'connecting' && (
            <div className="flex flex-col items-center gap-4 text-indigo-600">
              <Loader2 size={48} className="animate-spin" />
              <p className="font-semibold text-lg">Conectando à sala...</p>
            </div>
          )}

          {status === 'live' && (
            <div className="w-full h-full flex flex-col gap-4">
              <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden">
                {remoteVideoTrack ? (
                  <video 
                    ref={videoRef}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">Aguardando vídeo da IA...</div>
                )}
                
                {/* Local Video Preview (PIP) */}
                <div className="absolute bottom-4 right-4 w-32 aspect-video bg-slate-800 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
                  {localVideoTrack ? (
                    <video 
                      ref={localVideoRef}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/50"><Camera size={24} /></div>
                  )}
                </div>
              </div>
              
              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button onClick={toggleMic} className={`p-4 rounded-full ${isMicEnabled ? 'bg-slate-100 hover:bg-slate-200' : 'bg-red-100 text-red-600'}`}>
                  {isMicEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                </button>
                <button onClick={toggleCamera} className={`p-4 rounded-full ${isCameraEnabled ? 'bg-slate-100 hover:bg-slate-200' : 'bg-red-100 text-red-600'}`}>
                  {isCameraEnabled ? <Camera size={24} /> : <CameraOff size={24} />}
                </button>
                <button 
                  onClick={endLiveSession}
                  className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
                >
                  <PhoneOff size={24} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: GOOGLE MEET INTEGRATION */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main creation card */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            {!googleToken ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                  <Video className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">Configurar Conexão Google Meet</h3>
                  <p className="text-slate-500 text-sm max-w-md mx-auto">
                    Conecte seu perfil do Google para criar salas síncronas de estudo diretamente na plataforma Google Meet.
                  </p>
                </div>
                
                {/* Official Material Style Sign In Button */}
                <button 
                  onClick={handleConnectGoogle}
                  className="inline-flex items-center gap-3 px-6 py-3 bg-white border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition shadow-sm cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  Autorizar Google Meet
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Google Meet Integrado</h3>
                      <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Pronto para criar reuniões
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleDisconnectGoogle}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sair
                  </button>
                </div>

                <form onSubmit={handleCreateMeetSpace} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1.5">
                      Título ou Assunto da Sessão
                    </label>
                    <input 
                      type="text"
                      value={newSpaceTitle}
                      onChange={(e) => setNewSpaceTitle(e.target.value)}
                      placeholder="Ex: Aula de Conversação de Francês B1"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={creatingSpace}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    {creatingSpace ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Criando Sala no Google Meet...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Criar Nova Sala no Google Meet
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar: History list */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-50 pb-3">
              <History className="w-5 h-5 text-slate-500" />
              Salas Ativas & Histórico
            </h3>

            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                <p className="text-xs font-medium">Buscando histórico...</p>
              </div>
            ) : meetSpaces.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-medium">Nenhuma sala criada recentemente.</p>
                <p className="text-xs max-w-xs mx-auto">As salas criadas aparecerão aqui para fácil acesso posterior.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {meetSpaces.map((space) => (
                  <div key={space.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1">{space.title}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {new Date(space.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-semibold shrink-0">
                        {space.meetingCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a 
                        href={space.meetingUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Entrar na Sala
                      </a>
                      
                      <button 
                        onClick={() => copyToClipboard(space.meetingUri, space.id)}
                        className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition"
                        title="Copiar Link"
                      >
                        {copiedId === space.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
