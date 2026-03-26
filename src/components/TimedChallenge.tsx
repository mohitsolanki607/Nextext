import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Timer, 
  Trophy, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Zap,
  Brain,
  Rocket,
  ShieldCheck
} from 'lucide-react';
import { generateInteractiveMockTest } from '../services/geminiService';

const CHALLENGE_TYPES = [
  { id: 'sprint', name: 'Speed Sprint', icon: Zap, time: 60, questions: 5, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'marathon', name: 'Knowledge Marathon', icon: Brain, time: 300, questions: 15, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'blitz', name: 'Exam Blitz', icon: Rocket, time: 120, questions: 10, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'pro', name: 'Pro Challenge', icon: ShieldCheck, time: 600, questions: 20, color: 'text-red-600', bg: 'bg-red-50' }
];

export default function TimedChallenge() {
  const [selectedChallenge, setSelectedChallenge] = useState<typeof CHALLENGE_TYPES[0] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isStarted && timeLeft > 0 && !isGameOver) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isStarted) {
      setIsGameOver(true);
    }
    return () => clearInterval(timer);
  }, [isStarted, timeLeft, isGameOver]);

  const startChallenge = async (challenge: typeof CHALLENGE_TYPES[0]) => {
    setIsLoading(true);
    setSelectedChallenge(challenge);
    try {
      const result = await generateInteractiveMockTest("General Competitive Exam", "Mixed Subjects");
      setQuestions(result.slice(0, challenge.questions));
      setTimeLeft(challenge.time);
      setIsStarted(true);
      setIsGameOver(false);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setSelectedOption(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (selectedOption === null || isGameOver) return;
    
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: selectedOption }));
    setSelectedOption(null);
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsGameOver(true);
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) score++;
    });
    return score;
  };

  if (!isStarted) {
    return (
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center">
          <h2 className="text-5xl font-black tracking-tight mb-4 italic dark:text-white">Timed Challenge Arena</h2>
          <p className="text-gray-400 font-bold text-xl">Test your speed and accuracy under pressure.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {CHALLENGE_TYPES.map(type => (
            <motion.button
              key={type.id}
              whileHover={{ scale: 1.05, y: -10 }}
              onClick={() => startChallenge(type)}
              className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] text-left flex flex-col h-full group transition-all"
            >
              <div className={`p-4 rounded-2xl border-2 border-black dark:border-white/10 w-fit mb-6 ${type.bg} dark:bg-white/5 ${type.color}`}>
                <type.icon size={32} />
              </div>
              <h3 className="text-2xl font-black mb-2 dark:text-white">{type.name}</h3>
              <p className="text-gray-400 font-bold mb-6 flex-grow">A high-stakes challenge to push your limits.</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-black text-sm dark:text-gray-300">
                  <Timer size={16} />
                  {type.time} Seconds
                </div>
                <div className="flex items-center gap-2 font-black text-sm dark:text-gray-300">
                  <Rocket size={16} />
                  {type.questions} Questions
                </div>
              </div>
              <div className="mt-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-center group-hover:bg-gray-900 dark:group-hover:bg-gray-100 transition-colors">
                Start Now
              </div>
            </motion.button>
          ))}
        </div>

        {isLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[3rem] p-12 flex flex-col items-center gap-6">
              <Loader2 className="animate-spin text-blue-600 w-16 h-16" />
              <h3 className="text-2xl font-black italic dark:text-white">Preparing Your Challenge...</h3>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[3rem] overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]">
        {/* Header */}
        <div className="bg-black dark:bg-white text-white dark:text-black p-8 flex items-center justify-between border-b-4 border-black dark:border-white/10">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl border-2 border-white/20 dark:border-black/10 ${selectedChallenge?.bg} dark:bg-black/5 ${selectedChallenge?.color}`}>
              {selectedChallenge && <selectedChallenge.icon size={24} />}
            </div>
            <div>
              <h3 className="text-xl font-black italic">{selectedChallenge?.name}</h3>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</p>
            </div>
          </div>
          <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 border-white/20 dark:border-black/10 font-black text-2xl ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white dark:text-black'}`}>
            <Timer size={24} />
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <div className="p-12">
          {!isGameOver ? (
            <div className="space-y-12">
              <div className="p-10 bg-gray-50 dark:bg-white/5 border-4 border-black dark:border-white/10 rounded-[2.5rem]">
                <h4 className="text-3xl font-black leading-tight dark:text-white">{questions[currentIndex].question}</h4>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {questions[currentIndex].options.map((opt: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedOption(idx)}
                    className={`p-8 text-left border-4 border-black dark:border-white/10 rounded-2xl font-black text-xl transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] flex items-center justify-between group ${
                      selectedOption === idx ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 dark:text-white'
                    }`}
                  >
                    <span>{opt}</span>
                    <div className={`w-8 h-8 rounded-full border-2 border-black dark:border-white/10 flex items-center justify-center ${selectedOption === idx ? 'bg-white dark:bg-black text-black dark:text-white' : 'bg-gray-100 dark:bg-white/10'}`}>
                      {selectedOption === idx && <div className="w-4 h-4 bg-black dark:bg-white rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={selectedOption === null}
                className={`w-full py-6 rounded-[2rem] font-black text-2xl border-4 border-black dark:border-white/10 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] ${
                  selectedOption === null ? 'bg-gray-200 dark:bg-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {currentIndex === questions.length - 1 ? 'Finish Challenge' : 'Next Question'}
              </button>
            </div>
          ) : (
            <div className="text-center space-y-12">
              <div className="p-12 bg-purple-50 dark:bg-purple-900/20 border-4 border-black dark:border-white/10 rounded-[3rem]">
                <Trophy size={80} className="mx-auto text-purple-600 dark:text-purple-400 mb-6" />
                <h4 className="text-5xl font-black italic mb-4 dark:text-white">Challenge Over!</h4>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">Final Score: <span className="text-purple-600 dark:text-purple-400 text-4xl">{calculateScore()} / {questions.length}</span></p>
                <div className="mt-6 flex justify-center gap-4">
                   <div className="px-6 py-2 bg-white dark:bg-white/5 border-2 border-black dark:border-white/10 rounded-xl font-black text-sm dark:text-white">
                     Accuracy: {Math.round((calculateScore() / questions.length) * 100)}%
                   </div>
                   <div className="px-6 py-2 bg-white dark:bg-white/5 border-2 border-black dark:border-white/10 rounded-xl font-black text-sm dark:text-white">
                     Time Left: {timeLeft}s
                   </div>
                </div>
              </div>

              <div className="space-y-6 text-left">
                <h5 className="text-2xl font-black italic flex items-center gap-2 dark:text-white">
                  <ShieldCheck className="text-green-600" />
                  Review Performance
                </h5>
                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                  {questions.map((q, idx) => (
                    <div key={idx} className="p-6 border-4 border-black dark:border-white/10 rounded-2xl bg-white dark:bg-white/5">
                      <div className="flex items-start gap-4 mb-4">
                        <span className="font-black text-lg dark:text-white">Q{idx + 1}.</span>
                        <p className="font-bold dark:text-gray-300">{q.question}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-2 pl-10">
                        {q.options.map((opt: string, optIdx: number) => (
                          <div 
                            key={optIdx}
                            className={`p-3 rounded-xl border-2 border-black dark:border-white/10 flex items-center justify-between text-sm ${
                              optIdx === q.answer 
                                ? 'bg-green-100 dark:bg-green-900/20 border-green-600 dark:border-green-400 text-green-700 dark:text-green-400' 
                                : selectedAnswers[idx] === optIdx 
                                  ? 'bg-red-100 dark:bg-red-900/20 border-red-600 dark:border-red-400 text-red-700 dark:text-red-400' 
                                  : 'bg-gray-50 dark:bg-white/5 dark:text-gray-400'
                            }`}
                          >
                            <span className="font-bold">{opt}</span>
                            {optIdx === q.answer && <CheckCircle2 size={16} />}
                            {selectedAnswers[idx] === optIdx && optIdx !== q.answer && <XCircle size={16} />}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setIsStarted(false)}
                className="w-full py-6 bg-black dark:bg-white text-white dark:text-black border-4 border-black dark:border-white/10 rounded-[2rem] font-black text-2xl hover:bg-gray-900 dark:hover:bg-gray-100 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]"
              >
                Back to Arena
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
