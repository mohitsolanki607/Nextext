import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  BookOpen, 
  FileText, 
  Trophy, 
  ExternalLink, 
  Loader2, 
  ChevronRight,
  Globe,
  Library,
  GraduationCap,
  List as ListIcon,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  History
} from 'lucide-react';
import { fetchExamResourcesStream, generateInteractiveMockTest, generateStudyNotesStream, generateAISyllabusStream, fetchPreviousYearPapersStream } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { AudioSummarizeButton } from './AudioSummarizeButton';
import { useGameEngine } from '../hooks/useGameEngine';

const EXAMS = [
  "NEET 2026",
  "JEE Main 2026",
  "JEE Advanced 2026",
  "UPSC (Civil Services) 2026",
  "SSC CGL 2026",
  "SSC CHSL 2026",
  "SSC MTS 2026",
  "IBPS PO 2026",
  "IBPS Clerk 2026",
  "SBI PO 2026",
  "SBI Clerk 2026",
  "RRB NTPC 2026",
  "RRB Group D 2026",
  "State PSC (BPSC/UPPSC/MPSC) 2026",
  "NDA/CDS 2026",
  "GATE 2026",
  "CAT 2026",
  "UGC NET 2026",
  "CTET 2026",
  "RBI Grade B 2026",
  "LIC AAO 2026",
  "CUET 2026",
  "CLAT 2026",
  "AFCAT 2026",
  "CAPF 2026"
];

const SUBJECTS = [
  // NEET Specific
  "NEET Biology (Botany)",
  "NEET Biology (Zoology)",
  "NEET Physics",
  "NEET Chemistry",
  // JEE Specific
  "JEE Mathematics",
  "JEE Physics",
  "JEE Chemistry",
  // UPSC/SSC/Govt Specific
  "General Studies (History/Geo/Polity)",
  "Quantitative Aptitude",
  "Reasoning Ability",
  "English Language",
  "Current Affairs & GK",
  "Indian Economy",
  "General Science",
  "Computer Awareness",
  "Teaching Aptitude",
  "Legal Reasoning",
  "Full Length Paper (All Subjects)"
];

export default function ExamResources() {
  const { awardNexCoins } = useGameEngine();
  const [selectedExam, setSelectedExam] = useState(EXAMS[0]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [resources, setResources] = useState<string | null>(null);
  const [mockQuestions, setMockQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [activeMode, setActiveMode] = useState<'search' | 'mock' | 'notes' | 'syllabus' | 'pyq'>('search');

  const handleFetch = async () => {
    setIsLoading(true);
    setResources(null);
    setMockQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    try {
      let fullText = "";
      if (activeMode === 'search') {
        fullText = await fetchExamResourcesStream(selectedExam, selectedSubject, (text) => {
          setResources(text);
        });
      } else if (activeMode === 'mock') {
        const result = await generateInteractiveMockTest(selectedExam, selectedSubject);
        setMockQuestions(result);
      } else if (activeMode === 'notes') {
        fullText = await generateStudyNotesStream(selectedSubject, selectedExam, 'structured', (text) => {
          setResources(text);
        });
      } else if (activeMode === 'pyq') {
        fullText = await fetchPreviousYearPapersStream(selectedExam, selectedSubject, (text) => {
          setResources(text);
        });
      } else {
        fullText = await generateAISyllabusStream(selectedExam, selectedSubject, (text) => {
          setResources(text);
        });
      }

      if (fullText && !fullText.includes("Failed to fetch")) {
        const reason = activeMode === 'search' ? 'finding resources' : activeMode === 'notes' ? 'generating notes' : activeMode === 'syllabus' ? 'extracting syllabus' : 'fetching PYQs';
        awardNexCoins(10, reason);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setResources("Failed to fetch resources. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const calculateScore = () => {
    let score = 0;
    mockQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) score++;
    });
    return score;
  };

  const handleFinishMock = () => {
    setShowResults(true);
    const score = calculateScore();
    if (score > 0) {
      awardNexCoins(score * 5, `scoring ${score} in mock test`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-4xl font-black tracking-tight mb-2 italic">Exam Resource Hub 2026</h2>
          <p className="text-gray-400 font-medium">Latest 2026 syllabus, AI mock tests, and hand-written notes.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { setActiveMode('syllabus'); setResources(null); }}
            className={`px-6 py-3 rounded-2xl font-black border-2 border-black dark:border-white/10 transition-all flex items-center gap-2 ${activeMode === 'syllabus' ? 'bg-orange-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]' : 'bg-white dark:bg-white/5 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-white/10'}`}
          >
            <ListIcon size={20} />
            2026 Syllabus
          </button>
          <button 
            onClick={() => { setActiveMode('pyq'); setResources(null); }}
            className={`px-6 py-3 rounded-2xl font-black border-2 border-black dark:border-white/10 transition-all flex items-center gap-2 ${activeMode === 'pyq' ? 'bg-red-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]' : 'bg-white dark:bg-white/5 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-white/10'}`}
          >
            <History size={20} />
            Last 5Y PYQs
          </button>
          <button 
            onClick={() => { setActiveMode('search'); setResources(null); }}
            className={`px-6 py-3 rounded-2xl font-black border-2 border-black dark:border-white/10 transition-all flex items-center gap-2 ${activeMode === 'search' ? 'bg-blue-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]' : 'bg-white dark:bg-white/5 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-white/10'}`}
          >
            <Globe size={20} />
            Search Web
          </button>
          <button 
            onClick={() => { setActiveMode('mock'); setResources(null); }}
            className={`px-6 py-3 rounded-2xl font-black border-2 border-black dark:border-white/10 transition-all flex items-center gap-2 ${activeMode === 'mock' ? 'bg-purple-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]' : 'bg-white dark:bg-white/5 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-white/10'}`}
          >
            <Trophy size={20} />
            AI Mock Test
          </button>
          <button 
            onClick={() => { setActiveMode('notes'); setResources(null); }}
            className={`px-6 py-3 rounded-2xl font-black border-2 border-black dark:border-white/10 transition-all flex items-center gap-2 ${activeMode === 'notes' ? 'bg-green-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]' : 'bg-white dark:bg-white/5 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-white/10'}`}
          >
            <FileText size={20} />
            AI Notes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Selection Panel */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
              <GraduationCap className="text-blue-600 dark:text-blue-400" />
              Target Exam
            </h3>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {EXAMS.map(exam => (
                <button
                  key={exam}
                  onClick={() => setSelectedExam(exam)}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-between group ${
                    selectedExam === exam ? 'bg-blue-600 text-white border-2 border-black dark:border-white/10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]' : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  <span className="text-sm">{exam}</span>
                  <ChevronRight size={14} className={selectedExam === exam ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
              <BookOpen className="text-purple-600 dark:text-purple-400" />
              Subject
            </h3>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {SUBJECTS.map(subject => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-between group ${
                    selectedSubject === subject ? 'bg-purple-600 text-white border-2 border-black dark:border-white/10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]' : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  <span className="text-sm">{subject}</span>
                  <ChevronRight size={14} className={selectedSubject === subject ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleFetch}
            disabled={isLoading}
            className="w-full py-5 bg-black dark:bg-blue-600 text-white rounded-[2rem] font-black text-xl hover:bg-gray-900 dark:hover:bg-blue-700 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 border-2 border-black dark:border-white/10"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
            {activeMode === 'search' ? 'Fetch 2026 Materials' : activeMode === 'mock' ? 'Generate 2026 Mock Test' : activeMode === 'notes' ? 'Generate 2026 Notes' : 'Get 2026 Syllabus'}
          </button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {(isLoading && !resources && mockQuestions.length === 0) ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[3rem] p-12 flex flex-col items-center justify-center h-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] min-h-[600px]"
              >
                <div className="relative mb-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 border-4 border-blue-100 dark:border-blue-900/30 border-t-blue-600 rounded-full"
                  />
                  {activeMode === 'search' ? (
                    <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 w-10 h-10" />
                  ) : activeMode === 'mock' ? (
                    <Trophy className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-600 dark:text-purple-400 w-10 h-10" />
                  ) : activeMode === 'notes' ? (
                    <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-600 dark:text-green-400 w-10 h-10" />
                  ) : activeMode === 'pyq' ? (
                    <History className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-600 dark:text-red-400 w-10 h-10" />
                  ) : (
                    <ListIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-600 dark:text-orange-400 w-10 h-10" />
                  )}
                </div>
                <h3 className="text-2xl font-black italic dark:text-white">
                  {activeMode === 'search' ? 'Searching the Web...' : activeMode === 'mock' ? 'AI is Creating 2026 Mock Test...' : activeMode === 'notes' ? 'AI is Writing 2026 Notes...' : activeMode === 'pyq' ? 'AI is Fetching Last 5Y Papers...' : 'AI is Fetching 2026 Syllabus...'}
                </h3>
                <p className="text-gray-400 font-bold mt-2">
                  {activeMode === 'search' ? `Aggregating 2026 mock tests and notes for ${selectedExam}` : `Creating custom 2026 ${activeMode} for ${selectedExam}`}
                </p>
              </motion.div>
            ) : (mockQuestions.length > 0 || resources) ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[3rem] p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] h-full overflow-y-auto custom-scrollbar min-h-[600px]"
              >
                <div className="flex items-center justify-between gap-4 mb-10 pb-6 border-b-4 border-black">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl border-2 border-black ${activeMode === 'search' ? 'bg-blue-100 text-blue-600' : activeMode === 'mock' ? 'bg-purple-100 text-purple-600' : activeMode === 'notes' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {activeMode === 'search' ? <Library size={32} /> : activeMode === 'mock' ? <Trophy size={32} /> : activeMode === 'notes' ? <FileText size={32} /> : <ListIcon size={32} />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight italic">{selectedExam}</h3>
                      <p className="text-gray-400 font-bold">{selectedSubject} {activeMode === 'search' ? '2026 Resources' : activeMode === 'mock' ? '2026 AI Mock Test' : activeMode === 'notes' ? '2026 AI Study Notes' : activeMode === 'pyq' ? 'Last 5Y Previous Papers' : '2026 AI Syllabus'}</p>
                    </div>
                  </div>
                  {(activeMode === 'mock' || resources) && (
                    <div className="flex gap-2">
                      {isLoading && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold animate-pulse">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs">AI is typing...</span>
                        </div>
                      )}
                      {resources && (
                        <AudioSummarizeButton text={resources} variant="minimal" className="p-4" />
                      )}
                      {activeMode === 'mock' && (
                        <button
                          onClick={handleFetch}
                          disabled={isLoading}
                          className="p-4 bg-purple-600 text-white border-2 border-black rounded-2xl font-black hover:bg-purple-700 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-2"
                          title="Refresh Questions"
                        >
                          <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                          <span className="hidden sm:inline">Refresh Questions</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {activeMode === 'mock' && mockQuestions.length > 0 ? (
                  <div className="space-y-8">
                    {!showResults ? (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-black text-sm uppercase tracking-wider text-gray-400">Question {currentQuestionIndex + 1} of {mockQuestions.length}</span>
                          <div className="w-48 h-3 bg-gray-100 border-2 border-black rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-purple-600 transition-all duration-500" 
                              style={{ width: `${((currentQuestionIndex + 1) / mockQuestions.length) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-8 bg-gray-50 border-4 border-black rounded-[2rem] mb-8">
                          <h4 className="text-xl font-black leading-tight">{mockQuestions[currentQuestionIndex].question}</h4>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {mockQuestions[currentQuestionIndex].options.map((option: string, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => handleAnswerSelect(currentQuestionIndex, idx)}
                              className={`p-6 text-left border-4 border-black rounded-2xl font-black transition-all flex items-center justify-between group ${
                                selectedAnswers[currentQuestionIndex] === idx 
                                  ? 'bg-purple-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                                  : 'bg-white hover:bg-gray-50'
                              }`}
                            >
                              <span>{option}</span>
                              <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center ${selectedAnswers[currentQuestionIndex] === idx ? 'bg-white text-black' : 'bg-gray-100'}`}>
                                {selectedAnswers[currentQuestionIndex] === idx && <div className="w-4 h-4 bg-black rounded-full" />}
                              </div>
                            </button>
                          ))}
                        </div>

                        <div className="flex justify-between pt-8">
                          <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="px-8 py-4 border-4 border-black rounded-2xl font-black disabled:opacity-50 hover:bg-gray-50 transition-all"
                          >
                            Previous
                          </button>
                          {currentQuestionIndex === mockQuestions.length - 1 ? (
                            <button
                              onClick={handleFinishMock}
                              disabled={Object.keys(selectedAnswers).length < mockQuestions.length}
                              className="px-8 py-4 bg-black text-white border-4 border-black rounded-2xl font-black hover:bg-gray-900 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                            >
                              Finish Test
                            </button>
                          ) : (
                            <button
                              onClick={() => setCurrentQuestionIndex(prev => Math.min(mockQuestions.length - 1, prev + 1))}
                              className="px-8 py-4 bg-purple-600 text-white border-4 border-black rounded-2xl font-black hover:bg-purple-700 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            >
                              Next Question
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="space-y-8">
                        <div className="text-center p-12 bg-purple-50 border-4 border-black rounded-[3rem]">
                          <Trophy size={64} className="mx-auto text-purple-600 mb-4" />
                          <h4 className="text-4xl font-black italic mb-2">Test Completed!</h4>
                          <p className="text-xl font-bold text-gray-600">Your Score: <span className="text-purple-600">{calculateScore()} / {mockQuestions.length}</span></p>
                        </div>

                        <div className="space-y-6">
                          <h5 className="text-2xl font-black italic">Review Answers</h5>
                          {mockQuestions.map((q, idx) => (
                            <div key={idx} className="p-8 border-4 border-black rounded-[2rem] bg-white space-y-4">
                              <div className="flex items-start gap-4">
                                <span className="font-black text-lg">Q{idx + 1}.</span>
                                <p className="font-bold text-lg">{q.question}</p>
                              </div>
                              <div className="grid grid-cols-1 gap-2 pl-10">
                                {q.options.map((opt: string, optIdx: number) => (
                                  <div 
                                    key={optIdx}
                                    className={`p-4 rounded-xl border-2 border-black flex items-center justify-between ${
                                      optIdx === q.answer 
                                        ? 'bg-green-100 border-green-600 text-green-700' 
                                        : selectedAnswers[idx] === optIdx 
                                          ? 'bg-red-100 border-red-600 text-red-700' 
                                          : 'bg-gray-50'
                                    }`}
                                  >
                                    <span className="font-bold">{opt}</span>
                                    {optIdx === q.answer && <CheckCircle2 size={18} />}
                                    {selectedAnswers[idx] === optIdx && optIdx !== q.answer && <XCircle size={18} />}
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl flex gap-3">
                                <AlertCircle className="text-blue-600 shrink-0" size={20} />
                                <div>
                                  <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-1">
                                    {selectedAnswers[idx] === q.answer ? 'Correct!' : 'Close! But here is the secret trick to getting it right next time...'}
                                  </p>
                                  <p className="text-sm font-bold text-blue-800 italic">
                                    {q.explanation}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={handleFetch}
                          className="w-full py-6 bg-black text-white border-4 border-black rounded-[2rem] font-black text-xl hover:bg-gray-900 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                        >
                          Try Another Test
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="prose prose-blue max-w-none font-bold text-gray-700">
                    <ReactMarkdown>{resources || ''}</ReactMarkdown>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="bg-gray-50 border-4 border-dashed border-black rounded-[3rem] p-12 flex flex-col items-center justify-center h-full text-center opacity-50 min-h-[600px]">
                {activeMode === 'search' ? (
                  <>
                    <FileText size={80} className="text-gray-300 mb-6" />
                    <h3 className="text-3xl font-black italic">Resource Library</h3>
                    <p className="text-gray-400 font-bold mt-2 max-w-md mx-auto">
                      Select an exam and subject to find the best study materials from across the internet.
                    </p>
                  </>
                ) : activeMode === 'mock' ? (
                  <>
                    <Trophy size={80} className="text-gray-300 mb-6" />
                    <h3 className="text-3xl font-black italic">AI Mock Test 2026</h3>
                    <p className="text-gray-400 font-bold mt-2 max-w-md mx-auto">
                      Let AI create a custom 10-question mock test specifically for the 2026 exam pattern.
                    </p>
                  </>
                ) : activeMode === 'notes' ? (
                  <>
                    <BookOpen size={80} className="text-gray-300 mb-6" />
                    <h3 className="text-3xl font-black italic">AI Notes 2026</h3>
                    <p className="text-gray-400 font-bold mt-2 max-w-md mx-auto">
                      AI will write structured study notes based on the latest 2026 syllabus.
                    </p>
                  </>
                ) : activeMode === 'pyq' ? (
                  <>
                    <History size={80} className="text-gray-300 mb-6" />
                    <h3 className="text-3xl font-black italic">Last 5Y PYQs</h3>
                    <p className="text-gray-400 font-bold mt-2 max-w-md mx-auto">
                      Get official previous year question papers from 2021-2025 for your target exam.
                    </p>
                  </>
                ) : (
                  <>
                    <ListIcon size={80} className="text-gray-300 mb-6" />
                    <h3 className="text-3xl font-black italic">2026 Syllabus</h3>
                    <p className="text-gray-400 font-bold mt-2 max-w-md mx-auto">
                      Get the most up-to-date syllabus breakdown for your 2026 target exam.
                    </p>
                  </>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
