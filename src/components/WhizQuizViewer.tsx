import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, CheckCircle2, XCircle, ArrowRight, Trophy, Share2, MessageCircle, Copy, Home } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

interface Question {
  question: string;
  options: string[];
  answer: number;
}

interface WhizQuizViewerProps {
  quizId: string;
  onClose: () => void;
}

export function WhizQuizViewer({ quizId, onClose }: WhizQuizViewerProps) {
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const docRef = doc(db, 'whiz_quizzes', quizId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setQuiz(snap.data());
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `whiz_quizzes/${quizId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === quiz.questions[currentQuestion].answer) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(c => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Brain size={64} className="text-purple-500" />
        </motion.div>
        <p className="font-black text-xl italic">Loading AI Quiz...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-20 space-y-6">
        <XCircle size={64} className="text-red-500 mx-auto" />
        <h3 className="text-3xl font-black italic">Quiz Not Found</h3>
        <p className="font-bold text-gray-400">This quiz might have been deleted or the link is invalid.</p>
        <button onClick={onClose} className="bg-black text-white px-8 py-4 rounded-2xl font-black">GO BACK</button>
      </div>
    );
  }

  if (showResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-8 py-10"
      >
        <div className="relative inline-block">
          <Trophy size={120} className="text-yellow-400 mx-auto" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-4 -right-4 bg-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl border-4 border-black"
          >
            {score}/5
          </motion.div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-4xl font-black italic">Challenge Complete!</h3>
          <p className="text-xl font-bold text-gray-500">
            You scored {score} out of {quiz.questions.length} on "{quiz.topic}"
          </p>
        </div>

        <div className="bg-purple-50 border-4 border-black rounded-[2.5rem] p-8 max-w-md mx-auto">
          <p className="font-bold text-purple-800 mb-4 italic">"{quiz.creatorName} challenged you to this quiz. Think you can do better on another topic?"</p>
          <div className="flex flex-col gap-4">
            <button 
              onClick={onClose}
              className="w-full bg-purple-600 text-white border-2 border-black py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
            >
              <Home size={20} />
              JOIN NEXTEXT
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const question = quiz.questions[currentQuestion];

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-3 rounded-2xl border-2 border-black">
            <Brain size={24} className="text-purple-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Topic</p>
            <p className="text-lg font-black italic">{quiz.topic}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Question</p>
          <p className="text-lg font-black">{currentQuestion + 1}/{quiz.questions.length}</p>
        </div>
      </div>

      <div className="bg-white border-4 border-black rounded-[3rem] p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-2xl font-black mb-8 leading-tight">{question.question}</h3>
        
        <div className="grid grid-cols-1 gap-4">
          {question.options.map((option: string, index: number) => {
            const isCorrect = index === question.answer;
            const isSelected = selectedOption === index;
            
            let bgColor = 'bg-white';
            let borderColor = 'border-black';
            
            if (isAnswered) {
              if (isCorrect) {
                bgColor = 'bg-green-100';
                borderColor = 'border-green-600';
              } else if (isSelected) {
                bgColor = 'bg-red-100';
                borderColor = 'border-red-600';
              }
            } else if (isSelected) {
              bgColor = 'bg-purple-50';
              borderColor = 'border-purple-600';
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                disabled={isAnswered}
                className={`w-full text-left p-6 rounded-2xl border-2 ${borderColor} ${bgColor} font-bold transition-all flex items-center justify-between group ${!isAnswered && 'hover:border-purple-600 hover:bg-purple-50'}`}
              >
                <span>{option}</span>
                {isAnswered && isCorrect && <CheckCircle2 className="text-green-600" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="text-red-600" />}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={nextQuestion}
            className="w-full mt-10 bg-black text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-[6px_6px_0px_0px_rgba(126,34,206,1)] hover:-translate-y-1 transition-all"
          >
            {currentQuestion === quiz.questions.length - 1 ? 'FINISH QUIZ' : 'NEXT QUESTION'}
            <ArrowRight size={24} />
          </motion.button>
        )}
      </div>
    </div>
  );
}
