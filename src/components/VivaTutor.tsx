import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Trophy, 
  Coins, 
  Loader2, 
  ChevronRight,
  MessageCircle,
  X,
  Play
} from 'lucide-react';
import { generateVivaQuestions, evaluateVivaResponse } from '../services/geminiService';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';

interface VivaQuestion {
  question: string;
  difficulty: 'easy' | 'medium' | 'tricky';
}

interface VivaTutorProps {
  notes: string;
  onClose: () => void;
}

export default function VivaTutor({ notes, onClose }: VivaTutorProps) {
  const [step, setStep] = useState<'init' | 'loading' | 'questioning' | 'scoring'>('init');
  const [questions, setQuestions] = useState<VivaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(window.speechSynthesis);
  const hasRewarded = useRef(false);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsListening(false);
        handleResponse(text);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Mic start error:", e);
      }
    }
  };

  const speak = (text: string, autoListen: boolean = false) => {
    if (isMuted || !synthRef.current) {
      if (autoListen) setTimeout(startListening, 1000);
      return;
    }
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (autoListen) startListening();
    };
    synthRef.current.speak(utterance);
  };

  const startViva = async () => {
    setStep('loading');
    const q = await generateVivaQuestions(notes);
    if (q && q.length === 3) {
      setQuestions(q);
      setStep('questioning');
      const intro = "Ready for a quick 2-minute Viva? Let's check your confidence! First question: " + q[0].question;
      speak(intro, true);
    } else {
      onClose();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      startListening();
    }
  };

  const handleResponse = async (text: string) => {
    const currentQ = questions[currentIndex];
    const evaluation = await evaluateVivaResponse(currentQ.question, text, currentQ.difficulty);
    
    setFeedback(evaluation.feedback);
    setScores([...scores, evaluation.score]);
    
    const isLast = currentIndex === 2;
    speak(evaluation.feedback, !isLast);

    if (!isLast) {
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setFeedback(null);
        setTranscript('');
        const nextQ = questions[nextIndex].question;
        speak("Next question: " + nextQ, true);
      }, 4000);
    } else {
      setTimeout(() => {
        finishViva([...scores, evaluation.score]);
      }, 4000);
    }
  };

  const finishViva = async (finalScores: number[]) => {
    if (hasRewarded.current) return;
    setStep('scoring');
    const totalScore = finalScores.reduce((a, b) => a + b, 0);
    const avgScore = Math.round((totalScore / 30) * 10);
    
    let title = "Science Champion!";
    if (avgScore < 5) title = "Keep Practicing!";
    else if (avgScore < 8) title = "Great Effort!";

    const resultText = `${avgScore}/10: You're a ${title} You've earned 20 NexCoins for your participation!`;
    speak(resultText);

    // Update NexCoins in Firestore
    if (auth.currentUser) {
      hasRewarded.current = true;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      try {
        await updateDoc(userRef, {
          nexCoins: increment(20)
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] dark:shadow-[20px_20px_0px_0px_rgba(255,255,255,0.1)]"
      >
        <div className="p-8 border-b-4 border-black dark:border-white/10 flex items-center justify-between bg-blue-600 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black italic leading-none">AI Voice Tutor</h3>
              <p className="text-xs font-bold opacity-80 mt-1 uppercase tracking-widest">School Viva Session</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-10">
          <AnimatePresence mode="wait">
            {step === 'init' && (
              <motion.div 
                key="init"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-8"
              >
                <div className="w-32 h-32 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto border-4 border-black dark:border-white/10">
                  <Play size={48} className="text-blue-600 ml-2" />
                </div>
                <div>
                  <h4 className="text-3xl font-black italic mb-4 dark:text-white">Ready for a quick 2-minute Viva?</h4>
                  <p className="text-gray-400 font-bold text-lg">Let's check your confidence with 3 quick oral questions!</p>
                </div>
                <button
                  onClick={startViva}
                  className="w-full py-5 bg-blue-600 text-white border-4 border-black rounded-3xl font-black text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  START VIVA
                </button>
              </motion.div>
            )}

            {step === 'loading' && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20 space-y-6"
              >
                <Loader2 size={64} className="text-blue-600 animate-spin mx-auto" />
                <h4 className="text-2xl font-black italic dark:text-white">Preparing your Viva...</h4>
              </motion.div>
            )}

            {step === 'questioning' && (
              <motion.div 
                key="questioning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <span className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full text-xs font-black uppercase tracking-widest">
                    Question {currentIndex + 1} of 3
                  </span>
                  <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border-2 border-black ${
                    questions[currentIndex].difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    questions[currentIndex].difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {questions[currentIndex].difficulty}
                  </span>
                </div>

                <div className="bg-gray-50 dark:bg-white/5 border-4 border-black dark:border-white/10 rounded-[2rem] p-8 relative">
                  <MessageCircle size={32} className="absolute -top-4 -left-4 text-blue-600 bg-white dark:bg-[#111111] rounded-full p-1 border-2 border-black" />
                  <p className="text-2xl font-black italic dark:text-white leading-tight">
                    {questions[currentIndex].question}
                  </p>
                </div>

                {feedback && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-blue-700 dark:text-blue-300 font-bold italic text-center"
                  >
                    {feedback}
                  </motion.div>
                )}

                <div className="flex flex-col items-center gap-6">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-4 bg-white dark:bg-white/5 border-2 border-black dark:border-white/10 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
                    >
                      {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} className={isSpeaking ? 'animate-bounce' : ''} />}
                    </button>
                    <button
                      onClick={toggleListening}
                      disabled={isSpeaking}
                      className={`w-24 h-24 rounded-full border-4 border-black flex items-center justify-center transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${
                        isListening 
                          ? 'bg-red-500 animate-pulse' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white disabled:opacity-50`}
                    >
                      {isListening ? <MicOff size={40} /> : <Mic size={40} />}
                    </button>
                  </div>
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                    {isListening ? 'Listening...' : 'Tap to speak your answer'}
                  </p>
                  {transcript && (
                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-2">You said:</p>
                      <p className="text-lg font-black italic dark:text-white">"{transcript}"</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'scoring' && (
              <motion.div 
                key="scoring"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
              >
                <div className="relative inline-block">
                  <div className="w-40 h-40 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto border-4 border-black dark:border-white/10">
                    <Trophy size={80} className="text-yellow-600" />
                  </div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-dashed border-yellow-400 rounded-full"
                  />
                </div>

                <div>
                  <h4 className="text-4xl font-black italic mb-2 dark:text-white">
                    {Math.round((scores.reduce((a, b) => a + b, 0) / 30) * 10)}/10 Confidence Score
                  </h4>
                  <p className="text-xl font-bold text-gray-500">
                    {Math.round((scores.reduce((a, b) => a + b, 0) / 30) * 10) >= 8 ? "You're a Science Champion!" : 
                     Math.round((scores.reduce((a, b) => a + b, 0) / 30) * 10) >= 5 ? "Great Effort!" : "Keep Practicing!"}
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border-4 border-black dark:border-white/10 rounded-3xl p-6 flex items-center justify-center gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]">
                  <div className="p-3 bg-yellow-400 rounded-2xl border-2 border-black">
                    <Coins size={32} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-black dark:text-white">+20 NexCoins</p>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Participation Reward</p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-5 bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-white/10 rounded-3xl font-black text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] hover:-translate-y-1 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  FINISH VIVA
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
