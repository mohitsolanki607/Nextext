import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  Book, 
  Sparkles, 
  Zap, 
  Search, 
  ExternalLink, 
  Loader2, 
  ChevronRight,
  Smile,
  Brain,
  Rocket,
  Palette,
  Lightbulb,
  Languages
} from 'lucide-react';
import { fetchExamResourcesStream, generateMnemonicExplanationStream } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

const CLASSES = Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);
const SUBJECTS = [
  "Mathematics",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Geography",
  "Civics",
  "Economics",
  "English",
  "Hindi"
];

const LANGUAGES = [
  "English",
  "Hindi",
  "Marathi",
  "Gujarati",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Bengali",
  "Punjabi",
  "Odia",
  "Assamese",
  "Urdu",
  "Sanskrit",
  "French",
  "German",
  "Spanish"
];

export default function SchoolCorner() {
  const [selectedClass, setSelectedClass] = useState(CLASSES[9]); // Default Class 10
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [activeMode, setActiveMode] = useState<'books' | 'made-easy'>('books');
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [topic, setTopic] = useState('');

  const handleFetchBooks = async () => {
    setIsLoading(true);
    setContent("");
    try {
      await fetchExamResourcesStream(`NCERT ${selectedClass}`, selectedSubject, (text) => {
        setContent(text);
      });
    } catch (err) {
      console.error(err);
      setContent("Failed to fetch Book links. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMadeEasy = async () => {
    if (!topic) return;
    setIsLoading(true);
    setContent(""); // Clear previous content
    try {
      await generateMnemonicExplanationStream(selectedSubject, topic, selectedLanguage, (text) => {
        setContent(text);
      });
    } catch (err) {
      console.error(err);
      setContent("Failed to generate explanation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tight mb-2 italic">School Student Corner</h2>
          <p className="text-gray-400 font-medium">Class 1 to 12 NCERT eBooks and AI-powered "Made Easy" learning.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => { setActiveMode('books'); setContent(null); }}
            className={`px-6 py-3 rounded-2xl font-black border-2 border-black transition-all flex items-center gap-2 ${activeMode === 'books' ? 'bg-blue-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black hover:bg-gray-50'}`}
          >
            <Book size={20} />
            NCERT Books
          </button>
          <button 
            onClick={() => { setActiveMode('made-easy'); setContent(null); }}
            className={`px-6 py-3 rounded-2xl font-black border-2 border-black transition-all flex items-center gap-2 ${activeMode === 'made-easy' ? 'bg-purple-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black hover:bg-gray-50'}`}
          >
            <Smile size={20} />
            Made Easy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Selection Panel */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white border-4 border-black rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <GraduationCap className="text-blue-600" />
              Select Class
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {CLASSES.map(cls => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-2 py-3 rounded-xl font-black text-xs border-2 border-black transition-all ${
                    selectedClass === cls ? 'bg-blue-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {cls.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border-4 border-black rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <Palette className="text-purple-600" />
              Select Subject
            </h3>
            <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
              {SUBJECTS.map(subject => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`text-left px-4 py-3 rounded-xl font-bold text-sm border-2 border-black transition-all ${
                    selectedSubject === subject ? 'bg-purple-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          {activeMode === 'made-easy' && (
            <>
              <div className="bg-white border-4 border-black rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                  <Languages className="text-green-600" />
                  Select Language
                </h3>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`text-left px-4 py-3 rounded-xl font-bold text-sm border-2 border-black transition-all ${
                        selectedLanguage === lang ? 'bg-green-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white border-4 border-black rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                  <Lightbulb className="text-yellow-500" />
                  Topic to Simplify
                </h3>
                <input 
                  type="text"
                  placeholder="e.g., Newton's 3rd Law"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-black rounded-xl font-bold focus:ring-4 focus:ring-blue-500/10 transition-all mb-4"
                />
                <button
                  onClick={handleGenerateMadeEasy}
                  disabled={isLoading || !topic}
                  className="w-full py-4 bg-black text-white rounded-2xl font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-900 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <Brain />}
                  Make it Easy!
                </button>
              </div>
            </>
          )}

          {activeMode === 'books' && (
            <button
              onClick={handleFetchBooks}
              disabled={isLoading}
              className="w-full py-5 bg-black text-white rounded-[2rem] font-black text-xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-900 transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Search />}
              Find Books
            </button>
          )}
        </div>

        {/* Content Display */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {(isLoading && !content) ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border-4 border-black rounded-[3rem] p-12 flex flex-col items-center justify-center h-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] min-h-[600px]"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full mb-8"
                />
                <h3 className="text-2xl font-black italic">AI is working...</h3>
                <p className="text-gray-400 font-bold mt-2">
                  {activeMode === 'books' ? `Finding NCERT ${selectedClass} ${selectedSubject} Books` : `Simplifying ${topic} with mnemonics`}
                </p>
              </motion.div>
            ) : content ? (
              <motion.div
                key="content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border-4 border-black rounded-[3rem] p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] h-full overflow-y-auto custom-scrollbar min-h-[600px]"
              >
                <div className="flex items-center justify-between gap-4 mb-10 pb-6 border-b-4 border-black">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl border-2 border-black ${activeMode === 'books' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                      {activeMode === 'books' ? <Book size={32} /> : <Smile size={32} />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tight italic">
                        {activeMode === 'books' ? `${selectedClass} Books` : `${selectedSubject} Made Easy`}
                      </h3>
                      <p className="text-gray-400 font-bold">{selectedSubject}</p>
                    </div>
                  </div>
                  {isLoading && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">AI is typing...</span>
                    </div>
                  )}
                </div>
                <div className="prose prose-blue max-w-none font-bold text-gray-700">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              </motion.div>
            ) : (
              <div className="bg-gray-50 border-4 border-dashed border-black rounded-[3rem] p-12 flex flex-col items-center justify-center h-full text-center opacity-50 min-h-[600px]">
                {activeMode === 'books' ? (
                  <>
                    <Rocket size={80} className="text-gray-300 mb-6" />
                    <h3 className="text-3xl font-black italic">NCERT Library</h3>
                    <p className="text-gray-400 font-bold mt-2 max-w-md mx-auto">
                      Select your class and subject to get direct links to the official NCERT Books.
                    </p>
                  </>
                ) : (
                  <>
                    <Brain size={80} className="text-gray-300 mb-6" />
                    <h3 className="text-3xl font-black italic">Learning Made Fun</h3>
                    <p className="text-gray-400 font-bold mt-2 max-w-md mx-auto">
                      Enter a topic like "Photosynthesis" or "Trigonometry" and let the AI explain it with cartoons and mnemonics.
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
