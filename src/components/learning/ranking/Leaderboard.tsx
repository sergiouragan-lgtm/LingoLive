import React, { useState, useEffect } from 'react';
import { Trophy, Globe, Flag, MapPin, GraduationCap, Users, UserCheck, Flame } from 'lucide-react';
import { collection, query, where, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebase';

type FilterScope = 'mundial' | 'pais' | 'provincia' | 'escola' | 'turma' | 'amigos';

interface RankingUser {
  id: string;
  name: string;
  score: number;
  streak: number;
  avatar: string;
  country?: string;
  province?: string;
  schoolId?: string;
  classId?: string;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  userId?: string;
  userProfile?: any;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ userId: propUserId, userProfile: propUserProfile }) => {
  const [activeFilter, setActiveFilter] = useState<FilterScope>('mundial');
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const currentUid = propUserId || auth.currentUser?.uid;

  useEffect(() => {
    let activeUnsubscribes: (() => void)[] = [];
    let isMounted = true;

    setLoading(true);
    const currentUser = auth.currentUser || { uid: currentUid };
    const effectiveUid = currentUser?.uid;

    if (!effectiveUid) {
      setLoading(false);
      setRankings([]);
      return;
    }

    const loadLeaderboardData = async () => {
      let userOrgId = propUserProfile?.organizationId || propUserProfile?.tenantId || '';
      let userCountry = propUserProfile?.country || 'Angola';
      let userProvince = propUserProfile?.province || propUserProfile?.state || 'Luanda';
      let userSchoolId = propUserProfile?.schoolId || propUserProfile?.school || '';
      let userClassId = propUserProfile?.classId || propUserProfile?.turma || '';
      let userFriends: string[] = Array.isArray(propUserProfile?.friends) ? propUserProfile.friends : [];

      // Look up current profile doc if needed
      try {
        const userDocRef = doc(db, 'profiles', effectiveUid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          if (data.organizationId || data.tenantId) userOrgId = data.organizationId || data.tenantId;
          if (data.country) userCountry = data.country;
          if (data.province || data.state) userProvince = data.province || data.state;
          if (data.schoolId || data.school) userSchoolId = data.schoolId || data.school;
          if (data.classId || data.turma) userClassId = data.classId || data.turma;
          if (Array.isArray(data.friends)) userFriends = data.friends;
        }
      } catch (err) {
        console.warn('[Leaderboard] User profile lookup notice:', err);
      }

      if (!isMounted) return;

      const leaderboardRef = collection(db, 'leaderboard_entries');

      // Amigos filter with batching (max 10 items per chunk)
      if (activeFilter === 'amigos') {
        if (userFriends.length === 0) {
          setRankings([]);
          setLoading(false);
          return;
        }

        const chunks: string[][] = [];
        for (let i = 0; i < userFriends.length; i += 10) {
          chunks.push(userFriends.slice(i, i + 10));
        }

        const combinedResults: Map<string, RankingUser> = new Map();

        chunks.forEach((chunk) => {
          const q = query(
            leaderboardRef,
            where('visibility', '==', 'PUBLIC'),
            where('userId', 'in', chunk)
          );

          const unsub = onSnapshot(q, (snapshot) => {
            snapshot.forEach((docSnap) => {
              const d = docSnap.data();
              const isMe = d.userId === effectiveUid || docSnap.id === effectiveUid;
              combinedResults.set(docSnap.id, {
                id: docSnap.id,
                name: isMe ? `${d.displayName || d.userName || 'Você'} (Você)` : (d.displayName || d.userName || `Estudante ${docSnap.id.slice(0, 4)}`),
                score: d.xp || d.score || 0,
                streak: d.streak || 0,
                avatar: d.avatarUrl || d.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.displayName || 'Estudante')}&background=6366f1&color=fff`,
                country: d.country,
                province: d.province,
                schoolId: d.schoolId,
                classId: d.classId,
                isCurrentUser: isMe
              });
            });

            if (isMounted) {
              const list = Array.from(combinedResults.values()).sort((a, b) => b.score - a.score);
              setRankings(list);
              setLoading(false);
            }
          }, (error) => {
            console.warn('[Leaderboard] Friends snapshot listener error:', error);
            if (isMounted) setLoading(false);
          });

          activeUnsubscribes.push(unsub);
        });

        return;
      }

      // Other filters scoped to public leaderboard entries
      let q;
      try {
        switch (activeFilter) {
          case 'pais':
            if (userCountry && userOrgId) {
              q = query(leaderboardRef, where('organizationId', '==', userOrgId), where('visibility', '==', 'PUBLIC'), where('country', '==', userCountry), orderBy('xp', 'desc'), limit(25));
            } else if (userCountry) {
              q = query(leaderboardRef, where('visibility', '==', 'PUBLIC'), where('country', '==', userCountry), orderBy('xp', 'desc'), limit(25));
            } else {
              setRankings([]);
              setLoading(false);
              return;
            }
            break;
          case 'provincia':
            if (userProvince && userOrgId) {
              q = query(leaderboardRef, where('organizationId', '==', userOrgId), where('visibility', '==', 'PUBLIC'), where('province', '==', userProvince), orderBy('xp', 'desc'), limit(25));
            } else if (userProvince) {
              q = query(leaderboardRef, where('visibility', '==', 'PUBLIC'), where('province', '==', userProvince), orderBy('xp', 'desc'), limit(25));
            } else {
              setRankings([]);
              setLoading(false);
              return;
            }
            break;
          case 'escola':
            if (userSchoolId && userOrgId) {
              q = query(leaderboardRef, where('organizationId', '==', userOrgId), where('visibility', '==', 'PUBLIC'), where('schoolId', '==', userSchoolId), orderBy('xp', 'desc'), limit(25));
            } else if (userSchoolId) {
              q = query(leaderboardRef, where('visibility', '==', 'PUBLIC'), where('schoolId', '==', userSchoolId), orderBy('xp', 'desc'), limit(25));
            } else {
              setRankings([]);
              setLoading(false);
              return;
            }
            break;
          case 'turma':
            if (userClassId && userOrgId) {
              q = query(leaderboardRef, where('organizationId', '==', userOrgId), where('visibility', '==', 'PUBLIC'), where('classId', '==', userClassId), orderBy('xp', 'desc'), limit(25));
            } else if (userClassId) {
              q = query(leaderboardRef, where('visibility', '==', 'PUBLIC'), where('classId', '==', userClassId), orderBy('xp', 'desc'), limit(25));
            } else {
              setRankings([]);
              setLoading(false);
              return;
            }
            break;
          case 'mundial':
          default:
            if (userOrgId) {
              q = query(leaderboardRef, where('organizationId', '==', userOrgId), where('visibility', '==', 'PUBLIC'), orderBy('xp', 'desc'), limit(25));
            } else {
              q = query(leaderboardRef, where('visibility', '==', 'PUBLIC'), orderBy('xp', 'desc'), limit(25));
            }
            break;
        }
      } catch (e) {
        console.warn('[Leaderboard] Query construction exception:', e);
        setRankings([]);
        setLoading(false);
        return;
      }

      const unsub = onSnapshot(q, (snapshot) => {
        const list: RankingUser[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const isMe = d.userId === effectiveUid || docSnap.id === effectiveUid;
          list.push({
            id: docSnap.id,
            name: isMe ? `${d.displayName || d.userName || 'Você'} (Você)` : (d.displayName || d.userName || `Estudante ${docSnap.id.slice(0, 4)}`),
            score: d.xp || d.score || 0,
            streak: d.streak || 0,
            avatar: d.avatarUrl || d.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.displayName || 'Estudante')}&background=6366f1&color=fff`,
            country: d.country,
            province: d.province,
            schoolId: d.schoolId,
            classId: d.classId,
            isCurrentUser: isMe
          });
        });

        list.sort((a, b) => b.score - a.score);
        if (isMounted) {
          setRankings(list);
          setLoading(false);
        }
      }, (error) => {
        console.warn('[Leaderboard] Realtime snapshot listener notice:', error);
        if (isMounted) {
          setRankings([]);
          setLoading(false);
        }
      });

      activeUnsubscribes.push(unsub);
    };

    loadLeaderboardData();

    return () => {
      isMounted = false;
      activeUnsubscribes.forEach((unsub) => unsub());
    };
  }, [activeFilter, currentUid, propUserProfile]);

  const filterTabs: { id: FilterScope; label: string; icon: any }[] = [
    { id: 'mundial', label: 'Mundial', icon: Globe },
    { id: 'pais', label: 'País', icon: Flag },
    { id: 'provincia', label: 'Província', icon: MapPin },
    { id: 'escola', label: 'Escola', icon: GraduationCap },
    { id: 'turma', label: 'Turma', icon: Users },
    { id: 'amigos', label: 'Amigos', icon: UserCheck }
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800">
          <Trophy className="text-amber-500" size={22} />
          Classificação
        </h2>
        <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider border border-amber-200/50">
          Ao Vivo ⚡
        </span>
      </div>

      {/* Filter Selector Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar text-xs">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={12} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Rankings List */}
      <div className="space-y-3 mt-1 min-h-[180px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">A carregar classificação pública...</span>
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50/50 rounded-xl p-4 border border-dashed border-slate-200">
            <Trophy className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold">Nenhum registo nesta classificação ainda.</p>
            <p className="text-[10px] text-slate-400 mt-1">Pratique para ser o primeiro a pontuar!</p>
          </div>
        ) : (
          rankings.map((entry, i) => (
            <div
              key={entry.id || i}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition ${
                entry.isCurrentUser
                  ? 'bg-indigo-50/90 border border-indigo-200/60 shadow-xs'
                  : 'bg-slate-50/40 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <span
                className={`font-black text-xs w-6 text-center ${
                  i === 0
                    ? 'text-amber-500 text-sm'
                    : i === 1
                    ? 'text-slate-400 text-sm'
                    : i === 2
                    ? 'text-amber-700 text-sm'
                    : 'text-slate-500'
                }`}
              >
                {i + 1}º
              </span>
              <img
                src={entry.avatar}
                alt={entry.name}
                className="w-8 h-8 rounded-full border border-slate-200 object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-slate-800 truncate">{entry.name}</div>
                <div className="text-[10px] text-slate-500 font-medium">{entry.score} XP</div>
              </div>
              <div className="text-xs font-bold text-orange-500 flex items-center gap-1 font-mono bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                <Flame size={12} className="fill-orange-500/20" />
                <span>{entry.streak}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
