import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Clock, AlertCircle } from 'lucide-react';

export interface StudyTimeTrackerProps {
  userId: string;
}

export const StudyTimeTracker: React.FC<StudyTimeTrackerProps> = ({ userId }) => {
  const [totalMinutes, setTotalMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const fetchStudyTime = async () => {
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        const q = query(collection(db, "users_practice_sessions"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        const sessions: any[] = [];
        const seenIds = new Set<string>();

        let foundAnyData = false;
        querySnapshot.forEach((doc) => {
          foundAnyData = true;
          const data = doc.data();
          const sessionId = data.sessionId || doc.id;
          
          if (!seenIds.has(sessionId)) {
            seenIds.add(sessionId);
            sessions.push({ ...data, id: doc.id });
          }
        });

        setHasData(foundAnyData);

        const totalSeconds = sessions.reduce((acc, session) => {
          let durationSeconds = 0;
          if (typeof session.durationSeconds === 'number' && session.durationSeconds > 0) {
            durationSeconds = session.durationSeconds;
          } else if (typeof session.durationMinutes === 'number' && session.durationMinutes > 0) {
            durationSeconds = session.durationMinutes * 60;
          } else if (session.startedAt && session.endedAt) {
            const start = session.startedAt instanceof Timestamp ? session.startedAt.toDate().getTime() : new Date(session.startedAt).getTime();
            const end = session.endedAt instanceof Timestamp ? session.endedAt.toDate().getTime() : new Date(session.endedAt).getTime();
            if (end > start) {
              durationSeconds = (end - start) / 1000;
            }
          }
          return acc + durationSeconds;
        }, 0);

        setTotalMinutes(Math.round(totalSeconds / 60));
      } catch (err) {
        console.error("Error fetching study time:", err);
        setError("studyTime.error");
      } finally {
        setLoading(false);
      }
    };

    fetchStudyTime();
  }, [userId]);

  if (loading) return <div className="animate-pulse bg-slate-200 h-10 w-24 rounded" aria-hidden="true"></div>;
  if (error) return <div className="text-rose-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</div>;
  if (!hasData || totalMinutes === null) return (
    <div className="text-slate-400 text-xs italic">
      Tempo de estudo ainda não disponível.
      <span className="block text-[10px] text-slate-400">O acompanhamento será apresentado quando as sessões registarem duração real.</span>
    </div>
  );

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return (
    <div className="flex items-center gap-2 text-slate-700 font-bold bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
      <Clock className="w-4 h-4 text-indigo-500" />
      <span aria-label={`Tempo total de estudo: ${hours > 0 ? `${hours} horas ` : ''}${minutes} minutos`}>
        {hours > 0 ? `${hours}h ` : ''}{minutes} min
      </span>
    </div>
  );
};
