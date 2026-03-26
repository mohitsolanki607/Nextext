import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Share2, Trophy, Zap, Swords, Copy, CheckCircle2, Brain, Loader2, Send } from 'lucide-react';
import { generateBattleQuestions } from '../services/geminiService';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

interface WhizLinkProps {
  userDisplayName: string;
  streak: number;
  uid: string;
}

export function WhizLink({ userDisplayName, streak, uid }: WhizLinkProps) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizTopic, setQuizTopic] = useState('');
  const [showQuizInput, setShowQuizInput] = useState(false);
  const [generatedQuizId, setGeneratedQuizId] = useState<string | null>(null);
  
  const challenges = [
    {
      id: 'quiz',
      title: 'Quiz Quest',
      description: 'Create an AI quiz on any topic and challenge friends!',
      icon: <Brain className="text-purple-500" />,
      bgColor: 'bg-purple-50',
      action: () => setShowQuizInput(true)
    },
    {
      id: 'battle',
      title: 'Study Battle',
      description: 'Challenge a friend to a 1v1 study battle!',
      icon: <Swords className="text-red-500" />,
      message: `Hey! I challenge you to a Study Battle on NEXTEXT. Let's see who knows more! 📚⚔️`,
      bgColor: 'bg-red-50',
      action: (msg: string) => handleWhatsAppShare(msg)
    },
    {
      id: 'streak',
      title: 'Streak Showoff',
      description: 'Flex your study streak and inspire others.',
      icon: <Flame size={24} className="text-orange-500" />,
      message: `I've been on a ${streak}-day study streak on NEXTEXT! Can you beat my consistency? 🔥📖`,
      bgColor: 'bg-orange-50',
      action: (msg: string) => handleWhatsAppShare(msg)
    }
  ];

  const handleWhatsAppShare = (message: string) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateQuiz = async () => {
    if (!quizTopic.trim()) return;
    
    setIsGenerating(true);
    try {
      const questions = await generateBattleQuestions(quizTopic);
      if (questions && questions.length > 0) {
        try {
          const docRef = await addDoc(collection(db, 'whiz_quizzes'), {
            creatorUid: uid,
            creatorName: userDisplayName,
            topic: quizTopic,
            questions,
            createdAt: serverTimestamp()
          });
          setGeneratedQuizId(docRef.id);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'whiz_quizzes');
        }
      }
    } catch (error) {
      console.error("Error creating whiz quiz:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const quizShareMessage = `Hey! I created a custom AI quiz on "${quizTopic}" using NEXTEXT. Can you score 5/5? 🧠🔥\n\nTake the quiz here: ${window.location.origin}?quizId=${generatedQuizId}`;

  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-5xl font-black tracking-tighter mb-2 italic flex items-center gap-4">
          <MessageCircle size={48} className="text-green-500" />
          Whiz-Link
        </h2>
        <p className="text-gray-400 font-bold text-lg">Challenge your friends and grow your study circle via WhatsApp!</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {challenges.map((challenge, index) => (
          <motion.div
            key={challenge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`border-4 border-black rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full ${challenge.bgColor}`}
          >
            <div className="bg-white border-2 border-black w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {challenge.icon}
            </div>
            <h3 className="text-2xl font-black mb-2 italic">{challenge.title}</h3>
            <p className="font-bold text-gray-500 mb-6 flex-1">{challenge.description}</p>
            
            <div className="space-y-3 mt-auto">
              <button
                onClick={() => challenge.id === 'quiz' ? (challenge.action as () => void)() : (challenge.action as (msg: string) => void)(challenge.message || '')}
                className="w-full bg-black text-white border-2 border-black px-6 py-3 rounded-xl font-black flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                {challenge.id === 'quiz' ? <Zap size={20} className="text-yellow-400" /> : <MessageCircle size={20} className="text-green-400" />}
                {challenge.id === 'quiz' ? 'CREATE QUIZ' : 'SHARE NOW'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showQuizInput && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white border-4 border-black rounded-[3rem] p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
          >
            {!generatedQuizId ? (
              <div className="space-y-6">
                <h3 className="text-3xl font-black italic">What's the topic?</h3>
                <p className="font-bold text-gray-400">AI will generate 5 challenging questions for your friends.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    value={quizTopic}
                    onChange={(e) => setQuizTopic(e.target.value)}
                    placeholder="e.g. Indian History, Quantum Physics, Biology..."
                    className="flex-1 bg-gray-50 border-2 border-black p-4 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-purple-200"
                  />
                  <button
                    onClick={handleCreateQuiz}
                    disabled={isGenerating || !quizTopic.trim()}
                    className="bg-purple-600 text-white border-2 border-black px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Brain size={20} />}
                    {isGenerating ? 'GENERATING...' : 'GENERATE'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                <div className="bg-green-100 w-20 h-20 rounded-full border-2 border-black flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <CheckCircle2 size={40} className="text-green-600" />
                </div>
                <h3 className="text-3xl font-black italic">Quiz Ready!</h3>
                <p className="font-bold text-gray-500">Your AI Quiz on "{quizTopic}" is ready to be shared.</p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <button
                    onClick={() => handleWhatsAppShare(quizShareMessage)}
                    className="bg-[#25D366] text-white border-2 border-black px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
                  >
                    <MessageCircle size={20} />
                    SHARE TO WHATSAPP
                  </button>
                  <button
                    onClick={() => copyToClipboard(quizShareMessage)}
                    className="bg-white border-2 border-black px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
                  >
                    {copied ? <CheckCircle2 size={20} className="text-green-500" /> : <Copy size={20} />}
                    {copied ? 'COPIED!' : 'COPY LINK'}
                  </button>
                </div>
                <button 
                  onClick={() => { setGeneratedQuizId(null); setQuizTopic(''); setShowQuizInput(false); }}
                  className="text-gray-400 font-black text-sm hover:text-black transition-colors"
                >
                  CREATE ANOTHER
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border-4 border-black rounded-[3rem] p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="bg-green-100 p-8 rounded-[2rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Share2 size={64} className="text-green-600" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-3xl font-black mb-4 italic">Why use Whiz-Link?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg border-2 border-black">
                  <Trophy size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-black text-sm italic">Earn Bonus Points</p>
                  <p className="text-xs font-bold text-gray-400">Get 50 XP for every friend who joins.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 p-2 rounded-lg border-2 border-black">
                  <Zap size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="font-black text-sm italic">Boost Motivation</p>
                  <p className="text-xs font-bold text-gray-400">Study is better with friends.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Flame = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.214 1.14-3.027A2.5 2.5 0 0 0 8.5 14.5z" />
  </svg>
);
