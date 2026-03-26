import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Swords, 
  Users, 
  Trophy, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  ChevronRight,
  Zap
} from 'lucide-react';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDocs,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { generateBattleQuestions } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

interface Question {
  question: string;
  options: string[];
  answer: number;
}

interface Battle {
  id: string;
  status: 'waiting' | 'active' | 'finished';
  subject: string;
  players: string[];
  playerNames: { [uid: string]: string };
  scores: { [uid: string]: number };
  currentQuestion: number;
  questions: Question[];
  createdAt: any;
}

const SUBJECTS = [
  "UPSC History",
  "SSC Mathematics",
  "IBPS Reasoning",
  "RRB General Science",
  "State PSC Geography",
  "Current Affairs 2024"
];

export default function BattleSystem() {
  const { user, profile } = useAuth();
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [userAnswer, setUserAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [battleResult, setBattleResult] = useState<'win' | 'loss' | 'draw' | null>(null);

  useEffect(() => {
    if (!user || !activeBattle || activeBattle.status !== 'active') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNextQuestion();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeBattle?.currentQuestion, activeBattle?.status]);

  const findBattle = async () => {
    if (!user || !profile) return;
    setIsSearching(true);
    
    try {
      // Find waiting battles for the subject
      const q = query(
        collection(db, 'battles'), 
        where('subject', '==', selectedSubject),
        where('status', '==', 'waiting'),
        limit(1)
      );
      
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        // Join existing battle
        const battleDoc = snap.docs[0];
        const battleData = battleDoc.data();
        
        if (battleData.players.includes(user.uid)) {
          setIsSearching(false);
          return;
        }

        const updatedPlayers = [...battleData.players, user.uid];
        const updatedPlayerNames = { ...battleData.playerNames, [user.uid]: profile.displayName };
        const updatedScores = { ...battleData.scores, [user.uid]: 0 };
        const battleLang = battleData.language || 'English';

        // Generate questions if we are the second player
        const questions = await generateBattleQuestions(selectedSubject, battleLang);

        await updateDoc(doc(db, 'battles', battleDoc.id), {
          players: updatedPlayers,
          playerNames: updatedPlayerNames,
          scores: updatedScores,
          status: 'active',
          questions: questions,
          currentQuestion: 0
        });

        subscribeToBattle(battleDoc.id);
      } else {
        // Create new battle
        const newBattle = {
          subject: selectedSubject,
          language: selectedLanguage,
          status: 'waiting',
          players: [user.uid],
          playerNames: { [user.uid]: profile.displayName },
          scores: { [user.uid]: 0 },
          currentQuestion: 0,
          questions: [],
          createdAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'battles'), newBattle);
        subscribeToBattle(docRef.id);
      }
    } catch (err) {
      console.error("Battle error:", err);
      setIsSearching(false);
    }
  };

  const subscribeToBattle = (battleId: string) => {
    onSnapshot(doc(db, 'battles', battleId), (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Battle;
        setActiveBattle(data);
        setIsSearching(false);

        if (data.status === 'finished') {
          calculateResult(data);
        }
      }
    });
  };

  const handleAnswer = async (index: number) => {
    if (!user || !activeBattle || userAnswer !== null) return;
    setUserAnswer(index);

    const currentQ = activeBattle.questions[activeBattle.currentQuestion];
    if (index === currentQ.answer) {
      const newScores = { ...activeBattle.scores, [user.uid]: (activeBattle.scores[user.uid] || 0) + 10 };
      await updateDoc(doc(db, 'battles', activeBattle.id), {
        scores: newScores
      });
    }
  };

  const handleNextQuestion = async () => {
    if (!user || !activeBattle || activeBattle.status !== 'active') return;
    setUserAnswer(null);
    setTimeLeft(15);

    if (activeBattle.currentQuestion < activeBattle.questions.length - 1) {
      // Only one player needs to trigger the next question
      // We'll let the first player in the list do it
      if (activeBattle.players[0] === user.uid) {
        await updateDoc(doc(db, 'battles', activeBattle.id), {
          currentQuestion: activeBattle.currentQuestion + 1
        });
      }
    } else {
      if (activeBattle.players[0] === user.uid) {
        await updateDoc(doc(db, 'battles', activeBattle.id), {
          status: 'finished'
        });
      }
    }
  };

  const calculateResult = (battle: Battle) => {
    if (!user) return;
    const myScore = battle.scores[user.uid] || 0;
    const opponentId = battle.players.find(p => p !== user.uid);
    const opponentScore = opponentId ? (battle.scores[opponentId] || 0) : 0;

    if (myScore > opponentScore) setBattleResult('win');
    else if (myScore < opponentScore) setBattleResult('loss');
    else setBattleResult('draw');
  };

  const leaveBattle = () => {
    setActiveBattle(null);
    setBattleResult(null);
    setUserAnswer(null);
    setTimeLeft(15);
  };

  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#111111] rounded-[3rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] border-4 border-black dark:border-white/10">
        <div className="relative mb-8">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 border-4 border-blue-100 dark:border-blue-900/30 border-t-blue-600 rounded-full"
          />
          <Swords className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black mb-2 dark:text-white">Finding Opponent...</h3>
        <p className="text-gray-400 font-medium mb-8">Matching you for {selectedSubject}</p>
        <button 
          onClick={() => setIsSearching(false)}
          className="px-8 py-3 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-all border-2 border-black dark:border-white/10"
        >
          Cancel Search
        </button>
      </div>
    );
  }

  if (activeBattle && activeBattle.status === 'active') {
    const currentQ = activeBattle.questions[activeBattle.currentQuestion];
    const opponentId = activeBattle.players.find(p => p !== user?.uid);
    const opponentName = opponentId ? activeBattle.playerNames[opponentId] : "Opponent";

    return (
      <div className="max-w-4xl mx-auto">
        {/* Battle Header */}
        <div className="flex items-center justify-between mb-8 bg-white dark:bg-[#111111] p-6 rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] border-4 border-black dark:border-white/10">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 text-white p-3 rounded-2xl border-2 border-black dark:border-white/10">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Score</p>
              <p className="text-xl font-black dark:text-white">{profile?.displayName}: {activeBattle.scores[user?.uid || '']}</p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-black text-2xl ${timeLeft < 5 ? 'border-red-500 text-red-500' : 'border-blue-500 text-blue-500'}`}>
              {timeLeft}
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Question {activeBattle.currentQuestion + 1}/5</p>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Opponent</p>
              <p className="text-xl font-black dark:text-white">{opponentName}: {opponentId ? activeBattle.scores[opponentId] : 0}</p>
            </div>
            <div className="bg-red-500 text-white p-3 rounded-2xl border-2 border-black dark:border-white/10">
              <Zap size={24} />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <motion.div 
          key={activeBattle.currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-[#111111] p-12 rounded-[3rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] border-4 border-black dark:border-white/10 mb-8"
        >
          <h3 className="text-2xl font-black mb-10 leading-tight dark:text-white">{currentQ.question}</h3>
          <div className="grid grid-cols-1 gap-4">
            {currentQ.options.map((option, idx) => (
              <button
                key={idx}
                disabled={userAnswer !== null}
                onClick={() => handleAnswer(idx)}
                className={`w-full text-left p-6 rounded-2xl font-black transition-all flex items-center justify-between group border-4 border-black dark:border-white/10 ${
                  userAnswer === idx 
                    ? idx === currentQ.answer 
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                      : 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                    : userAnswer !== null && idx === currentQ.answer
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <span>{option}</span>
                <div className={`w-8 h-8 rounded-full border-2 border-black dark:border-white/10 flex items-center justify-center ${
                  userAnswer === idx 
                    ? 'bg-white text-black' 
                    : userAnswer !== null && idx === currentQ.answer 
                      ? 'bg-white text-black' 
                      : 'bg-gray-100 dark:bg-white/10'
                }`}>
                  {(userAnswer === idx || (userAnswer !== null && idx === currentQ.answer)) && (
                    <div className={`w-4 h-4 rounded-full ${
                      idx === currentQ.answer ? 'bg-green-600' : 'bg-red-600'
                    }`} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (battleResult) {
    return (
      <div className="max-w-md mx-auto text-center bg-white dark:bg-[#111111] p-12 rounded-[3rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] border-4 border-black dark:border-white/10">
        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl ${
          battleResult === 'win' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 shadow-yellow-500/10' :
          battleResult === 'loss' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 shadow-red-500/10' :
          'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 shadow-gray-500/10'
        }`}>
          {battleResult === 'win' ? <Trophy size={48} /> : <Swords size={48} />}
        </div>
        <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter dark:text-white">
          {battleResult === 'win' ? 'Victory!' : battleResult === 'loss' ? 'Defeat' : 'Draw'}
        </h2>
        <p className="text-gray-400 font-medium mb-10">
          {battleResult === 'win' ? 'You dominated the arena!' : 'Better luck next time, warrior.'}
        </p>
        
        <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-3xl mb-10 border-2 border-black dark:border-white/10">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Final Score</p>
          <p className="text-3xl font-black dark:text-white">{activeBattle?.scores[user?.uid || '']} Points</p>
        </div>

        <button 
          onClick={leaveBattle}
          className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 border-4 border-black dark:border-white/10"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-4xl font-black tracking-tight mb-2 italic dark:text-white">Battle Arena</h2>
          <p className="text-gray-400 font-medium">Challenge other students in real-time subject battles.</p>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="flex flex-wrap gap-2 max-w-md justify-end">
            {['English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Spanish', 'French', 'German'].map(lang => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black border-2 transition-all ${
                  selectedLanguage === lang 
                    ? 'bg-blue-600 border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-black dark:hover:border-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-[#111111] p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] border-2 border-black dark:border-white/10">
            <div className="bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 p-2 rounded-xl">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Streak</p>
              <p className="text-lg font-black dark:text-white">{profile?.streak || 0} Days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="bg-white dark:bg-[#111111] p-10 rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] border-4 border-black dark:border-white/10">
            <h3 className="text-xl font-black mb-6 dark:text-white">Select Subject</h3>
            <div className="grid grid-cols-1 gap-3">
              {SUBJECTS.map(subject => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`w-full text-left px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-between group border-2 border-black dark:border-white/10 ${
                    selectedSubject === subject ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  <span>{subject}</span>
                  <ChevronRight size={18} className={selectedSubject === subject ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-12 rounded-[3rem] text-white relative overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] border-4 border-black dark:border-white/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="relative z-10">
              <Swords size={64} className="mb-8 opacity-50" />
              <h3 className="text-3xl font-black mb-4 tracking-tight leading-tight">Ready to test your knowledge?</h3>
              <p className="text-blue-100 mb-10 text-lg leading-relaxed">
                Enter the arena and compete with students across India preparing for government exams.
              </p>
              <button 
                onClick={findBattle}
                className="w-full py-5 bg-white text-blue-600 rounded-2xl font-black text-xl hover:bg-blue-50 transition-all active:scale-95 shadow-xl border-2 border-black flex items-center justify-center gap-3"
              >
                Find a Match
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
