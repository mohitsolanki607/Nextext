import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  Zap, 
  Sparkles, 
  Loader2, 
  X, 
  CheckCircle2, 
  BrainCircuit,
  FileText,
  ChevronRight,
  Share2,
  Globe,
  Check,
  Send,
  Volume2,
  Video
} from 'lucide-react';
import { useGameEngine } from '../hooks/useGameEngine';
import { toast } from 'sonner';
import { solveProblemFromImageStream, generateQuizFromImageStream, translateImageTextStream, solveDiagramProblemStream, generateReelContentStream } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { AudioSummarizeButton } from './AudioSummarizeButton';

export default function SnapTools() {
  const { user } = useAuth();
  const { awardNexCoins, getShareChallenge } = useGameEngine();
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [mode, setMode] = useState<'solve' | 'quiz' | 'translate' | 'diagram' | 'reel' | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isPosting, setIsPosting] = useState(false);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [postSubject, setPostSubject] = useState('Mathematics');
  const [postExam, setPostExam] = useState('UPSC');
  const [postSuccess, setPostSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Economics', 'Polity', 'English', 'Aptitude'];
  const exams = ['UPSC', 'SSC', 'JEE', 'NEET', 'CAT', 'GATE', 'School Boards', 'CLAT'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setImage(reader.result as string);
        setMimeType(file.type);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (action: 'solve' | 'quiz' | 'translate' | 'diagram' | 'reel') => {
    if (!image) return;
    setIsLoading(true);
    setMode(action);
    setResult(""); // Start with empty string for streaming
    
    try {
      const base64Data = image.split(',')[1];
      let fullText = "";
      if (action === 'solve') {
        fullText = await solveProblemFromImageStream(base64Data, mimeType, selectedLanguage, (text) => {
          setResult(text);
        });
      } else if (action === 'quiz') {
        fullText = await generateQuizFromImageStream(base64Data, mimeType, selectedLanguage, (text) => {
          setResult(text);
        });
      } else if (action === 'translate') {
        fullText = await translateImageTextStream(base64Data, mimeType, selectedLanguage, (text) => {
          setResult(text);
        });
      } else if (action === 'diagram') {
        fullText = await solveDiagramProblemStream(base64Data, mimeType, selectedLanguage, (text) => {
          setResult(text);
        });
      } else if (action === 'reel') {
        fullText = await generateReelContentStream(base64Data, mimeType, (text) => {
          setResult(text);
        });
      }

      if (fullText && !fullText.includes("Failed to process image")) {
        const reason = action === 'solve' ? 'solving a doubt' : action === 'quiz' ? 'generating a quiz' : action === 'diagram' ? 'analyzing a diagram' : action === 'reel' ? 'creating a reel' : 'translating text';
        awardNexCoins(10, reason);

        // Log snap for admin monitoring
        if (user) {
          await addDoc(collection(db, 'snaps'), {
            uid: user.uid,
            email: user.email,
            mode: action,
            imageUrl: image,
            result: fullText,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (err) {
      console.error("Snap error:", err);
      setResult("Failed to process image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostToFeed = async () => {
    if (!user || !image || !result) return;
    setIsPosting(true);
    try {
      await addDoc(collection(db, 'doubt_posts'), {
        authorUid: user.uid,
        authorName: user.displayName || 'Student',
        authorPhoto: user.photoURL || '',
        imageUrl: image,
        solution: result,
        subject: postSubject,
        exam: postExam,
        likes: [],
        saves: [],
        commentCount: 0,
        createdAt: serverTimestamp()
      });
      setPostSuccess(true);
      setTimeout(() => {
        setPostSuccess(false);
        setShowPostOptions(false);
      }, 3000);
    } catch (err) {
      console.error("Error posting to feed:", err);
    } finally {
      setIsPosting(false);
    }
  };

  const clear = () => {
    setImage(null);
    setResult(null);
    setMode(null);
    setShowPostOptions(false);
    setPostSuccess(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-4xl font-black tracking-tight mb-2 italic">Snap & Learn</h2>
          <p className="text-gray-400 font-medium">Upload a photo of your textbook or problem to solve it instantly.</p>
        </div>
        <div className="flex flex-wrap gap-2 max-w-md justify-end">
          {[
            'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 
            'Odia', 'Assamese', 'Maithili', 'Sanskrit', 'Urdu',
            'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Chinese', 'Russian', 'Arabic', 'Portuguese', 'Italian'
          ].map(lang => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black border-2 transition-all ${
                selectedLanguage === lang 
                  ? 'bg-blue-600 border-black dark:border-white/20 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]' 
                  : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-black dark:hover:border-white/20'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Upload/Preview */}
        <div className="space-y-8">
          {!image ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white dark:bg-[#111111] border-4 border-dashed border-black dark:border-white/10 rounded-[3rem] p-12 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-all group shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]"
            >
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform border-2 border-black dark:border-white/10">
                <Camera size={40} />
              </div>
              <h3 className="text-xl font-black mb-2 dark:text-white">Snap or Upload</h3>
              <p className="text-gray-400 font-bold">Click to select an image</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          ) : (
            <div className="relative">
              <img 
                src={image} 
                alt="Preview" 
                className="w-full rounded-[3rem] border-4 border-black dark:border-white/10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] object-cover max-h-[400px]" 
              />
              <button 
                onClick={clear}
                className="absolute -top-4 -right-4 bg-red-500 text-white p-3 rounded-2xl border-2 border-black dark:border-white/10 shadow-lg hover:bg-red-600 transition-all"
              >
                <X size={24} />
              </button>
            </div>
          )}

          {image && !isLoading && !result && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => processImage('solve')}
                className="flex flex-col items-center gap-3 p-6 bg-blue-600 text-white border-4 border-black rounded-[2.5rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <BrainCircuit size={32} />
                <span className="font-black text-sm">Snap & Solve</span>
              </button>
              <button
                onClick={() => processImage('diagram')}
                className="flex flex-col items-center gap-3 p-6 bg-orange-600 text-white border-4 border-black rounded-[2.5rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <Zap size={32} />
                <span className="font-black text-sm">Diagram Solver</span>
              </button>
              <button
                onClick={() => processImage('quiz')}
                className="flex flex-col items-center gap-3 p-6 bg-purple-600 text-white border-4 border-black rounded-[2.5rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <FileText size={32} />
                <span className="font-black text-sm">Snap & Quiz</span>
              </button>
              <button
                onClick={() => processImage('translate')}
                className="flex flex-col items-center gap-3 p-6 bg-green-600 text-white border-4 border-black rounded-[2.5rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <Globe size={32} />
                <span className="font-black text-sm">Snap & Translate</span>
              </button>
              <button
                onClick={() => processImage('reel')}
                className="flex flex-col items-center gap-3 p-6 bg-pink-600 text-white border-4 border-black rounded-[2.5rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none col-span-2"
              >
                <Video size={32} />
                <span className="font-black text-sm">Snap & Reel (Story Mode)</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Result */}
        <div className="flex flex-col">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[3rem] p-12 flex flex-col items-center justify-center h-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]"
              >
                <Loader2 size={64} className="text-blue-600 animate-spin mb-6" />
                <h3 className="text-2xl font-black italic dark:text-white">Analyzing Image...</h3>
                <p className="text-gray-400 font-bold mt-2">Our AI Superagent is thinking</p>
              </motion.div>
            ) : result ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[3rem] p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] h-full overflow-y-auto custom-scrollbar"
              >
                <div className="flex items-center justify-between gap-3 mb-8">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl border-2 border-black dark:border-white/10 ${
                      mode === 'solve' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 
                      mode === 'quiz' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 
                      mode === 'reel' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' :
                      'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    }`}>
                      {mode === 'solve' ? <BrainCircuit size={24} /> : mode === 'quiz' ? <FileText size={24} /> : mode === 'reel' ? <Video size={24} /> : <Globe size={24} />}
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight dark:text-white">
                      {mode === 'solve' ? 'Solution Found' : mode === 'quiz' ? 'Quiz Generated' : mode === 'diagram' ? 'Diagram Analyzed' : mode === 'reel' ? 'Reel Story Ready' : 'Translation Complete'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const challenge = getShareChallenge(mode === 'solve' ? 'Math' : mode === 'quiz' ? 'Quiz' : 'Science');
                        navigator.clipboard.writeText(challenge);
                        toast.success('Challenge copied to clipboard! 🚀');
                      }}
                      className="p-3 bg-white dark:bg-white/5 border-2 border-black dark:border-white/10 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-purple-600 dark:text-purple-400 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      title="Share Challenge"
                    >
                      <Share2 size={16} />
                      Share
                    </button>
                    <AudioSummarizeButton text={result || ''} variant="minimal" className="p-3" />
                  </div>
                </div>
                {isLoading && (
                  <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">AI is thinking & writing...</span>
                  </div>
                )}
                <div className="prose prose-blue dark:prose-invert max-w-none font-bold text-gray-700 dark:text-gray-300">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>

                {(mode === 'solve' || mode === 'diagram') && (
                  <div className="mt-10 pt-10 border-t-2 border-black space-y-6">
                    {!showPostOptions ? (
                      <button 
                        onClick={() => setShowPostOptions(true)}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                      >
                        <Globe size={24} />
                        Post to Community Feed
                      </button>
                    ) : (
                      <div className="bg-gray-50 border-2 border-black rounded-3xl p-6 space-y-4">
                        <h4 className="font-black italic text-lg flex items-center gap-2">
                          <Sparkles size={20} className="text-blue-500" />
                          Share with Community
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400">Subject</label>
                            <select 
                              value={postSubject}
                              onChange={(e) => setPostSubject(e.target.value)}
                              className="w-full p-3 bg-white border-2 border-black rounded-xl font-bold text-xs"
                            >
                              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400">Exam</label>
                            <select 
                              value={postExam}
                              onChange={(e) => setPostExam(e.target.value)}
                              className="w-full p-3 bg-white border-2 border-black rounded-xl font-bold text-xs"
                            >
                              {exams.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={handlePostToFeed}
                            disabled={isPosting || postSuccess}
                            className={`flex-1 py-3 rounded-xl font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 ${
                              postSuccess ? 'bg-green-500 text-white' : 'bg-black text-white hover:-translate-y-1'
                            }`}
                          >
                            {isPosting ? <Loader2 size={20} className="animate-spin" /> : postSuccess ? <Check size={20} /> : <Send size={20} />}
                            {postSuccess ? 'Posted!' : 'Confirm Post'}
                          </button>
                          <button 
                            onClick={() => setShowPostOptions(false)}
                            className="px-4 py-3 bg-white border-2 border-black rounded-xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button 
                  onClick={() => setResult(null)}
                  className="mt-6 w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-black border-2 border-black hover:bg-gray-200 transition-all"
                >
                  Try Another
                </button>
              </motion.div>
            ) : (
              <div className="bg-gray-50 border-4 border-dashed border-black rounded-[3rem] p-12 flex flex-col items-center justify-center h-full text-center opacity-50">
                <Sparkles size={64} className="text-gray-300 mb-6" />
                <h3 className="text-2xl font-black italic">Result Area</h3>
                <p className="text-gray-400 font-bold mt-2">Upload an image to see the magic</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
