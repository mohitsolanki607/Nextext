import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Zap, 
  Medal,
  Crown,
  Play,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  limit, 
  doc, 
  updateDoc,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { generateWeeklyExam } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfWeek, getWeek, getYear, addDays } from 'date-fns';

interface Question {
  question: string;
  options: string[];
  answer: number;
}

interface Exam {
  id: string;
  subject: string;
  weekNumber: number;
  year: number;
  questions: Question[];
  status: 'active' | 'finished';
}

interface Submission {
  id: string;
  examId: string;
  uid: string;
  displayName: string;
  score: number;
  completedAt: any;
}

export default function WeeklyExam() {
  const { user, profile } = useAuth();
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isExamining, setIsExamining] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const weekNumber = getWeek(new Date());
  const year = getYear(new Date());

  useEffect(() => {
    let timer: any;
    if (isExamining && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isExamining) {
      finishExam(answers);
    }
    return () => clearInterval(timer);
  }, [isExamining, timeLeft]);

  useEffect(() => {
    // Fetch active exam for this week
    const q = query(
      collection(db, 'weekly_exams'),
      where('weekNumber', '==', weekNumber),
      where('year', '==', year),
      where('status', '==', 'active'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const examData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Exam;
        setActiveExam(examData);
        
        // Check if user already submitted
        if (user) {
          const subQ = query(
            collection(db, 'exam_submissions'),
            where('examId', '==', examData.id),
            where('uid', '==', user.uid)
          );
          getDocs(subQ).then(snap => {
            setHasSubmitted(!snap.empty);
          });
        }
      } else {
        setActiveExam(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [weekNumber, year, user]);

  useEffect(() => {
    if (activeExam) {
      const q = query(
        collection(db, 'exam_submissions'),
        where('examId', '==', activeExam.id),
        orderBy('score', 'desc'),
        orderBy('completedAt', 'asc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
        setSubmissions(subs);
      });

      return () => unsubscribe();
    }
  }, [activeExam]);

  const handleGenerateExam = async () => {
    setIsGenerating(true);
    try {
      const questions = await generateWeeklyExam("General Studies & Current Affairs");
      await addDoc(collection(db, 'weekly_exams'), {
        subject: "General Studies & Current Affairs",
        weekNumber,
        year,
        questions,
        status: 'active',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const startExam = () => {
    setIsExamining(true);
    setCurrentQuestion(0);
    setAnswers([]);
    setSelectedOption(null);
    setTimeLeft(900);
  };

  const handleNext = () => {
    if (selectedOption === null) return;
    const newAnswers = [...answers, selectedOption];
    setAnswers(newAnswers);
    setSelectedOption(null);
    
    if (currentQuestion < (activeExam?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishExam(newAnswers);
    }
  };

  const finishExam = async (finalAnswers: number[]) => {
    if (!activeExam || !user) return;
    
    let score = 0;
    activeExam.questions.forEach((q, i) => {
      if (q.answer === finalAnswers[i]) score++;
    });

    try {
      await addDoc(collection(db, 'exam_submissions'), {
        examId: activeExam.id,
        uid: user.uid,
        displayName: profile?.displayName || user.displayName,
        score,
        answers: finalAnswers,
        completedAt: serverTimestamp()
      });
      setHasSubmitted(true);
      setIsExamining(false);
      
      // Check if top 3 logic (simplified: if score is high, maybe notify)
      // Real logic would run at end of week via cloud function or admin trigger
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeclareWinners = async () => {
    if (!activeExam || submissions.length === 0) return;
    setIsGenerating(true);
    try {
      // Top 3 winners
      const winners = submissions.slice(0, 3);
      
      for (const winner of winners) {
        const userRef = doc(db, 'users', winner.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const currentEnd = userDoc.data().subscriptionEndsAt?.toDate() || new Date();
          const newEnd = addDays(currentEnd > new Date() ? currentEnd : new Date(), 15);
          
          await updateDoc(userRef, {
            isPro: true,
            subscriptionEndsAt: newEnd
          });
        }
      }

      // Mark exam as finished
      await updateDoc(doc(db, 'weekly_exams', activeExam.id), {
        status: 'finished'
      });
      
      alert(`Winners declared! ${winners.map(w => w.displayName).join(', ')} received 15 days of Pro.`);
    } catch (err) {
      console.error(err);
      alert("Failed to declare winners.");
    } finally {
      setIsGenerating(false);
    }
  };

  const isAdmin = user?.email === "msolanki80979@gmail.com";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tight mb-2 italic">Weekly AI Exam</h2>
          <p className="text-gray-400 font-medium">Compete with others. Top 3 win 15 days of Pro access!</p>
        </div>
        <div className="bg-yellow-400 text-black px-6 py-3 rounded-2xl font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
          <Crown size={20} />
          Week {weekNumber}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {!activeExam ? (
            <div className="bg-white border-4 border-black rounded-[3rem] p-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <Calendar size={64} className="mx-auto text-gray-300 mb-6" />
              <h3 className="text-2xl font-black mb-4">No Exam Active</h3>
              <p className="text-gray-400 font-bold mb-8">The AI is preparing this week's challenge. Check back soon!</p>
              {isAdmin && (
                <button 
                  onClick={handleGenerateExam}
                  disabled={isGenerating}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-700 transition-all flex items-center gap-2 mx-auto"
                >
                  {isGenerating ? <Loader2 className="animate-spin" /> : <Zap />}
                  Generate Week {weekNumber} Exam
                </button>
              )}
            </div>
          ) : isExamining ? (
            <div className="bg-white border-4 border-black rounded-[3rem] p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-10">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Question {currentQuestion + 1} of {activeExam.questions.length}</span>
                  <div className={`flex items-center gap-2 font-black mt-1 ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
                    <Clock size={16} />
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <div className="flex gap-1">
                  {activeExam.questions.map((_, i) => (
                    <div key={i} className={`h-2 w-8 rounded-full border border-black ${i <= currentQuestion ? 'bg-blue-600' : 'bg-gray-100'}`} />
                  ))}
                </div>
              </div>
              
              <h3 className="text-2xl font-black mb-10 leading-tight italic">"{activeExam.questions[currentQuestion].question}"</h3>
              
              <div className="grid grid-cols-1 gap-4 mb-10">
                {activeExam.questions[currentQuestion].options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedOption(i)}
                    className={`w-full text-left p-6 border-2 border-black rounded-2xl font-bold transition-all group flex items-center justify-between ${
                      selectedOption === i ? 'bg-blue-600 text-white border-black' : 'hover:bg-blue-50 hover:border-blue-600'
                    }`}
                  >
                    <span>{option}</span>
                    <div className={`w-6 h-6 rounded-full border-2 border-black flex items-center justify-center ${selectedOption === i ? 'bg-white text-black' : 'bg-gray-100'}`}>
                      {selectedOption === i && <div className="w-3 h-3 bg-black rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={selectedOption === null}
                className={`w-full py-5 rounded-2xl font-black text-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 ${
                  selectedOption === null ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {currentQuestion === activeExam.questions.length - 1 ? 'Finish Exam' : 'Next Question'}
                <ChevronRight size={20} />
              </button>
            </div>
          ) : hasSubmitted ? (
            <div className="bg-white border-4 border-black rounded-[3rem] p-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-3xl font-black mb-4 italic">Exam Completed!</h3>
              <p className="text-gray-400 font-bold mb-8">You've successfully submitted your answers. Check the leaderboard to see your rank!</p>
              <div className="p-6 bg-gray-50 border-2 border-black rounded-2xl inline-block">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Your Score</p>
                <p className="text-4xl font-black text-blue-600">
                  {submissions.find(s => s.uid === user?.uid)?.score || 0} / {activeExam.questions.length}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border-4 border-black rounded-[3rem] p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-6 mb-10">
                <div className="bg-blue-100 text-blue-600 p-5 rounded-3xl border-2 border-black">
                  <Trophy size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic">{activeExam.subject}</h3>
                  <p className="text-gray-400 font-bold">10 Questions • 15 Minutes • Pro Prize</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3 text-gray-600 font-bold">
                  <CheckCircle2 className="text-green-500" size={20} />
                  <span>Only one attempt allowed per week.</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 font-bold">
                  <CheckCircle2 className="text-green-500" size={20} />
                  <span>Top 3 scorers win 15 days of Pro access.</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 font-bold">
                  <CheckCircle2 className="text-green-500" size={20} />
                  <span>Winners announced every Sunday at 12:00 PM.</span>
                </div>
              </div>

              <button 
                onClick={startExam}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
              >
                <Play fill="currentColor" />
                Start Weekly Exam
              </button>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white border-4 border-black rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black mb-8 flex items-center gap-2">
              <Medal className="text-orange-500" />
              Leaderboard
            </h3>
            
            <div className="space-y-4">
              {submissions.length === 0 ? (
                <p className="text-gray-400 font-bold text-center py-8">No submissions yet. Be the first!</p>
              ) : (
                submissions.map((sub, i) => (
                  <div key={sub.id} className={`flex items-center gap-4 p-4 border-2 border-black rounded-2xl ${i < 3 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                    <div className={`w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center font-black ${
                      i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-300' : i === 2 ? 'bg-orange-300' : 'bg-white'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate">{sub.displayName}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(sub.completedAt?.toDate()), 'HH:mm')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-blue-600">{sub.score}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase">Pts</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {submissions.length > 0 && (
              <div className="mt-8 pt-8 border-t-2 border-black">
                <div className="flex items-center gap-2 text-orange-600 font-black text-xs uppercase tracking-widest">
                  <Zap size={14} />
                  Prize Pool
                </div>
                <p className="text-sm font-bold text-gray-500 mt-2 mb-6">
                  Top 3 will receive <span className="text-black font-black">15 Days Pro</span> automatically at the end of the week.
                </p>
                
                {isAdmin && activeExam?.status === 'active' && (
                  <button 
                    onClick={handleDeclareWinners}
                    disabled={isGenerating}
                    className="w-full py-4 bg-green-600 text-white rounded-2xl font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                    Declare Winners & Grant Prizes
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Past Winners */}
          <div className="bg-black text-white border-4 border-black rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <ShieldCheck className="text-green-400" />
              Hall of Fame
            </h3>
            <p className="text-gray-400 text-sm font-bold mb-4">Last week's champions:</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-black">
                <span className="text-yellow-400">1. Rahul S.</span>
                <span>10/10</span>
              </div>
              <div className="flex justify-between text-sm font-black">
                <span className="text-gray-300">2. Priya M.</span>
                <span>9/10</span>
              </div>
              <div className="flex justify-between text-sm font-black">
                <span className="text-orange-300">3. Amit K.</span>
                <span>9/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
