import React, { useState, useEffect, useCallback } from "react";
import {
  Video, Mic, MicOff, VideoOff, Share2, Settings, LogOut, Users,
  Clock, Calendar, Phone, PhoneOff, MessageSquare, Send, Copy, Check,
  Circle, StopCircle, Hand, Monitor, MoreVertical
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "@/src/firebase";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useToast } from "@/src/context/ToastContext";

interface LiveRoom {
  id: string;
  teacherId: string;
  teacherName: string;
  title: string;
  scheduledTime: number;
  duration: number;
  maxParticipants: number;
  status: "in_progress" | "completed";
  roomCode: string;
}

interface Participant {
  userId: string;
  name: string;
  role: "teacher" | "student";
  videoEnabled: boolean;
  audioEnabled: boolean;
  handRaised: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export const LiveClassVideoRoom: React.FC<{
  roomId: string;
  onEnd: () => void;
}> = ({ roomId, onEnd }) => {
  const { addToast } = useToast();
  const user = auth.currentUser;

  const [room, setRoom] = useState<LiveRoom | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Fetch room data
  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, "live_classes", roomId);
    const unsubscribe = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        setRoom(doc.data() as LiveRoom);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // Initialize mock participants
  useEffect(() => {
    // Mock participant data - in production this comes from Firestore listeners
    setParticipants([
      {
        userId: "user-2",
        name: "Maria Silva",
        role: "student",
        videoEnabled: true,
        audioEnabled: true,
        handRaised: false
      },
      {
        userId: "user-3",
        name: "João Costa",
        role: "student",
        videoEnabled: true,
        audioEnabled: false,
        handRaised: false
      }
    ]);
  }, [roomId]);

  const handleToggleVideo = useCallback(() => {
    setVideoEnabled(prev => !prev);
  }, []);

  const handleToggleAudio = useCallback(() => {
    setAudioEnabled(prev => !prev);
  }, []);

  const handleToggleRecording = useCallback(() => {
    setIsRecording(prev => !prev);
    if (!isRecording) {
      addToast("Gravação iniciada", "success");
      setChatMessages(prev => [...prev, {
        id: `sys-${Date.now()}`,
        senderId: "system",
        senderName: "Sistema",
        text: "🔴 Gravação iniciada",
        timestamp: Date.now()
      }]);
    } else {
      addToast("Gravação finalizada", "success");
    }
  }, [isRecording, addToast]);

  const handleRaiseHand = useCallback(() => {
    setHandRaised(prev => !prev);
    addToast(
      handRaised ? "Mão baixada" : "Mão levantada",
      "info"
    );
  }, [handRaised, addToast]);

  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim() || !user) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: user.uid,
      senderName: user.displayName || "Participante",
      text: chatInput,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, newMessage]);
    setChatInput("");
  }, [chatInput, user]);

  const handleCopyCode = () => {
    if (room?.roomCode) {
      navigator.clipboard.writeText(room.roomCode);
      setCodeCopied(true);
      addToast("Código copiado!", "success");
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleEndClass = () => {
    if (window.confirm("Deseja sair da aula?")) {
      addToast("Encerrando conexão...", "info");
      setTimeout(() => {
        onEnd();
      }, 500);
    }
  };

  if (!room) {
    return (
      <div className="w-full h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const isTeacher = room.teacherId === user?.uid;

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col text-white overflow-hidden">
      {/* Video Area */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 p-2 overflow-hidden">
        {/* Main Video (Teacher) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="md:col-span-2 lg:row-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden"
        >
          <div className="space-y-4 text-center">
            <div className="w-24 h-24 rounded-full bg-indigo-600/30 border-4 border-indigo-600 mx-auto flex items-center justify-center">
              <Video className="w-12 h-12 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-xl">{room.teacherName}</h3>
              <p className="text-slate-400 text-sm">Professor</p>
            </div>
          </div>

          {/* Recording Indicator */}
          {isRecording && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5"
            >
              <div className="w-2 h-2 bg-red-200 rounded-full animate-pulse" />
              REC
            </motion.div>
          )}

          {/* Room Code Badge (Teacher) */}
          {isTeacher && room.roomCode && (
            <div className="absolute top-4 left-4 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <code className="font-mono font-bold text-indigo-400">{room.roomCode}</code>
              <button
                onClick={handleCopyCode}
                className="p-1 hover:bg-slate-700 rounded"
              >
                {codeCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          )}
        </motion.div>

        {/* Participant Videos */}
        {participants.slice(0, 4).map((participant, idx) => (
          <motion.div
            key={participant.userId}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex flex-col items-center justify-center relative overflow-hidden group"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center font-bold text-xl">
              {participant.name.charAt(0)}
            </div>
            <p className="text-xs text-slate-300 mt-2 text-center px-2">{participant.name}</p>

            {/* Status Icons */}
            <div className="absolute bottom-2 right-2 flex gap-1">
              {!participant.videoEnabled && <VideoOff className="w-4 h-4 text-slate-400" />}
              {!participant.audioEnabled && <MicOff className="w-4 h-4 text-slate-400" />}
              {participant.handRaised && <Hand className="w-4 h-4 text-yellow-400" />}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4" />
            <span>{room.duration}m</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Users className="w-4 h-4" />
            <span>{participants.length + 1} participantes</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Video Control */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleVideo}
            className={`p-3 rounded-full transition-all ${
              videoEnabled
                ? "bg-indigo-600 hover:bg-indigo-500"
                : "bg-slate-700 hover:bg-slate-600"
            }`}
          >
            {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </motion.button>

          {/* Audio Control */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleAudio}
            className={`p-3 rounded-full transition-all ${
              audioEnabled
                ? "bg-indigo-600 hover:bg-indigo-500"
                : "bg-slate-700 hover:bg-slate-600"
            }`}
          >
            {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </motion.button>

          {/* Hand Raise (Students) */}
          {!isTeacher && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRaiseHand}
              className={`p-3 rounded-full transition-all ${
                handRaised
                  ? "bg-yellow-600 hover:bg-yellow-500"
                  : "bg-slate-700 hover:bg-slate-600"
              }`}
            >
              <Hand className="w-5 h-5" />
            </motion.button>
          )}

          {/* Screen Share */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 transition-all"
          >
            <Monitor className="w-5 h-5" />
          </motion.button>

          {/* Chat */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-full transition-all ${
              showChat ? "bg-indigo-600" : "bg-slate-700 hover:bg-slate-600"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </motion.button>

          {/* Participants */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowParticipants(!showParticipants)}
            className={`p-3 rounded-full transition-all ${
              showParticipants ? "bg-indigo-600" : "bg-slate-700 hover:bg-slate-600"
            }`}
          >
            <Users className="w-5 h-5" />
          </motion.button>

          {/* Recording (Teacher) */}
          {isTeacher && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleRecording}
              className={`p-3 rounded-full transition-all ${
                isRecording
                  ? "bg-red-600 hover:bg-red-500 animate-pulse"
                  : "bg-slate-700 hover:bg-slate-600"
              }`}
            >
              {isRecording ? <StopCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
            </motion.button>
          )}

          {/* End/Leave */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEndClass}
            className="p-3 rounded-full bg-rose-600 hover:bg-rose-500 transition-all"
          >
            <PhoneOff className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-slate-800 border-l border-slate-700 flex flex-col z-40"
          >
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold">Chat</h3>
              <button
                onClick={() => setShowChat(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <p className="text-xs font-bold text-indigo-400">{msg.senderName}</p>
                  <p className="text-sm text-slate-200">{msg.text}</p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-700 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Mensagem..."
                className="flex-1 px-3 py-2 bg-slate-700 rounded text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <button
                onClick={handleSendMessage}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Participants Panel */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="absolute left-0 top-0 bottom-0 w-72 bg-slate-800 border-r border-slate-700 flex flex-col z-40"
          >
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold">Participantes ({participants.length + 1})</h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {/* Teacher */}
              <div className="p-3 bg-slate-700 rounded-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs">
                  {room.teacherName.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{room.teacherName}</p>
                  <p className="text-xs text-slate-400">👨‍🏫 Professor</p>
                </div>
              </div>

              {/* Students */}
              {participants.map((p) => (
                <div key={p.userId} className="p-3 bg-slate-700 rounded-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs">
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{p.name}</p>
                    <div className="flex gap-1 mt-0.5">
                      {p.videoEnabled && <Video className="w-3 h-3 text-emerald-400" />}
                      {p.audioEnabled && <Mic className="w-3 h-3 text-emerald-400" />}
                      {p.handRaised && <Hand className="w-3 h-3 text-yellow-400" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
