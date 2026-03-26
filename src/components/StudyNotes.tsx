import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Sparkles, 
  Loader2, 
  Download, 
  FileText, 
  Layout, 
  PenTool, 
  GraduationCap,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Mic
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateStudyNotesStream } from '../services/geminiService';
import { AudioSummarizeButton } from './AudioSummarizeButton';
import VivaTutor from './VivaTutor';

export default function StudyNotes() {
  const [subject, setSubject] = useState('Mathematics');
  const [exam, setExam] = useState('UPSC');
  const [style, setStyle] = useState<'structured' | 'hand-written'>('structured');
  const [isGenerating, setIsGenerating] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showViva, setShowViva] = useState(false);

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Economics', 'Polity', 'English', 'Aptitude'];
  const exams = ['UPSC', 'SSC', 'JEE', 'NEET', 'CAT', 'GATE', 'School Boards', 'CLAT'];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setNotes("");
    try {
      await generateStudyNotesStream(subject, exam, style, (text) => {
        setNotes(text);
      });
    } catch (err) {
      console.error("Notes generation error:", err);
      setError("Failed to generate notes. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!notes) return;
    const blob = new Blob([notes], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${subject}_${exam}_Notes.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-5xl font-black tracking-tighter mb-2 italic flex items-center gap-4 dark:text-white">
            <Sparkles size={48} className="text-blue-500" />
            AI Notes Master
          </h2>
          <p className="text-gray-400 font-bold text-lg">Generate high-quality study notes tailored to your exam and style.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <BookOpen size={14} />
                Select Subject
              </label>
              <div className="grid grid-cols-2 gap-2">
                {subjects.slice(0, 6).map(s => (
                  <button
                    key={s}
                    onClick={() => setSubject(s)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black border-2 transition-all ${
                      subject === s 
                        ? 'bg-blue-600 border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-black dark:hover:border-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
                <select 
                  value={subjects.includes(subject) ? subject : subjects[0]}
                  onChange={(e) => setSubject(e.target.value)}
                  className="col-span-2 px-3 py-2 bg-gray-50 dark:bg-white/5 border-2 border-black dark:border-white/10 rounded-xl text-[10px] font-black dark:text-white"
                >
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <GraduationCap size={14} />
                Target Exam
              </label>
              <div className="grid grid-cols-2 gap-2">
                {exams.slice(0, 4).map(e => (
                  <button
                    key={e}
                    onClick={() => setExam(e)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black border-2 transition-all ${
                      exam === e 
                        ? 'bg-purple-600 border-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-black dark:hover:border-white'
                    }`}
                  >
                    {e}
                  </button>
                ))}
                <select 
                  value={exams.includes(exam) ? exam : exams[0]}
                  onChange={(e) => setExam(e.target.value)}
                  className="col-span-2 px-3 py-2 bg-gray-50 dark:bg-white/5 border-2 border-black dark:border-white/10 rounded-xl text-[10px] font-black dark:text-white"
                >
                  {exams.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <PenTool size={14} />
                Note Style
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setStyle('structured')}
                  className={`flex-1 py-3 rounded-xl font-black border-2 transition-all flex items-center justify-center gap-2 ${
                    style === 'structured' 
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                      : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-black dark:hover:border-white'
                  }`}
                >
                  <Layout size={16} />
                  Structured
                </button>
                <button
                  onClick={() => setStyle('hand-written')}
                  className={`flex-1 py-3 rounded-xl font-black border-2 transition-all flex items-center justify-center gap-2 ${
                    style === 'hand-written' 
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                      : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-black dark:hover:border-white'
                  }`}
                >
                  <PenTool size={16} />
                  Hand-written
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-5 bg-blue-600 text-white border-4 border-black rounded-3xl font-black text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
              {isGenerating ? 'GENIUSING...' : 'GENERATE NOTES'}
            </button>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-4 border-black dark:border-white/10 rounded-[2rem] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
            <h4 className="font-black italic mb-2 flex items-center gap-2 dark:text-white">
              <AlertCircle size={18} className="text-orange-500" />
              Pro Tip
            </h4>
            <p className="text-xs font-bold text-gray-600 dark:text-gray-400 leading-relaxed">
              'Hand-written' style uses bullet points, diagrams descriptions, and mnemonics to make memorization easier. 'Structured' is better for quick revision.
            </p>
          </div>
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {(isGenerating && !notes) ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[3rem] p-20 flex flex-col items-center justify-center h-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]"
              >
                <div className="relative mb-10">
                  <Loader2 size={80} className="text-blue-600 animate-spin" />
                  <Sparkles size={32} className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" />
                </div>
                <h3 className="text-3xl font-black italic mb-4 dark:text-white">Crafting Your Masterpiece...</h3>
                <p className="text-gray-400 font-bold text-lg max-w-md text-center">
                  Our AI is analyzing {subject} syllabus for {exam} to create the perfect {style} notes.
                </p>
              </motion.div>
            ) : notes ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[3rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] flex flex-col h-full overflow-hidden"
              >
                <div className="p-8 border-b-4 border-black dark:border-white/10 flex items-center justify-between bg-gray-50 dark:bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl border-2 border-black dark:border-white/10">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black italic leading-none dark:text-white">{subject} Study Notes</h3>
                      <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">For {exam} • {style} Style</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isGenerating && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-xl font-bold animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">AI is writing...</span>
                      </div>
                    )}
                    <AudioSummarizeButton text={notes || ''} />
                    <button 
                      onClick={() => setShowViva(true)}
                      className="flex items-center gap-2 px-6 py-4 bg-blue-600 text-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black italic"
                    >
                      <Mic size={20} />
                      START VIVA
                    </button>
                    <button 
                      onClick={handleDownload}
                      className="p-4 bg-white dark:bg-white/5 border-2 border-black dark:border-white/10 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:-translate-y-1 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                    >
                      <Download size={24} className="dark:text-white" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-10 overflow-y-auto custom-scrollbar prose prose-blue dark:prose-invert max-w-none font-bold text-gray-700 dark:text-gray-300">
                  <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 border-4 border-black dark:border-white/10 rounded-3xl flex items-center justify-between gap-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-600 text-white rounded-2xl">
                        <Mic size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black italic leading-none dark:text-white">Ready for a quick 2-minute Viva?</h4>
                        <p className="text-xs font-bold text-gray-500 mt-1">Test your confidence and earn +20 NexCoins!</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowViva(true)}
                      className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-black text-sm hover:-translate-y-1 transition-all"
                    >
                      LET'S GO
                    </button>
                  </div>
                  <ReactMarkdown>{notes}</ReactMarkdown>
                </div>
              </motion.div>
            ) : (
              <div className="bg-gray-50 dark:bg-white/5 border-4 border-dashed border-black dark:border-white/10 rounded-[3rem] p-20 flex flex-col items-center justify-center h-full text-center opacity-50">
                <BookOpen size={100} className="text-gray-300 dark:text-gray-600 mb-8" />
                <h3 className="text-4xl font-black italic mb-4 dark:text-white">Ready to Genius?</h3>
                <p className="text-gray-400 font-bold text-xl max-w-md">
                  Select your subject and exam on the left to generate custom AI study notes.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showViva && notes && (
          <VivaTutor 
            notes={notes} 
            onClose={() => setShowViva(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
