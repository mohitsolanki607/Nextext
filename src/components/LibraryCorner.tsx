import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Library, 
  Search, 
  Book, 
  Globe, 
  ExternalLink, 
  Loader2, 
  ChevronRight,
  Building2,
  Bookmark,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { searchGlobalLibraries } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

const TOP_LIBRARIES = [
  { name: "Project Gutenberg", url: "https://www.gutenberg.org/", desc: "60,000+ free eBooks (Public Domain)" },
  { name: "Open Library", url: "https://openlibrary.org/", desc: "Internet Archive's digital library" },
  { name: "HathiTrust", url: "https://www.hathitrust.org/", desc: "Millions of digitized books" },
  { name: "Google Books", url: "https://books.google.com/", desc: "World's largest book index" },
  { name: "British Library", url: "https://www.bl.uk/digital-collections", desc: "Digital collections of the UK" },
  { name: "Library of Congress", url: "https://www.loc.gov/collections/", desc: "US National Library digital archive" },
  { name: "National Library of India", url: "https://www.nationallibrary.gov.in/", desc: "India's premier digital repository" }
];

export default function LibraryCorner() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    setIsLoading(true);
    setResults(null);
    try {
      const response = await searchGlobalLibraries(query);
      setResults(response);
    } catch (err) {
      console.error(err);
      setResults("Failed to find books. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tight mb-2 italic">Global Library Corner</h2>
          <p className="text-gray-400 font-medium">Access the world's top digital libraries and find any book instantly.</p>
        </div>
        <div className="bg-black text-white px-6 py-3 rounded-2xl font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
          <Globe size={20} className="text-blue-400" />
          World Access
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Search & Quick Links */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white border-4 border-black rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <Search className="text-blue-600" />
              Find a Book
            </h3>
            <form onSubmit={handleSearch} className="space-y-4">
              <input 
                type="text"
                placeholder="Book title, author, or topic..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 border-2 border-black rounded-2xl font-bold focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Book />}
                Search Global Libraries
              </button>
            </form>
          </div>

          <div className="bg-white border-4 border-black rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <Building2 className="text-purple-600" />
              Top World Libraries
            </h3>
            <div className="space-y-3">
              {TOP_LIBRARIES.map((lib) => (
                <a 
                  key={lib.name}
                  href={lib.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-gray-50 border-2 border-black rounded-xl hover:bg-gray-100 transition-all group"
                >
                  <div>
                    <p className="font-black text-sm">{lib.name}</p>
                    <p className="text-[10px] font-bold text-gray-400">{lib.desc}</p>
                  </div>
                  <ArrowUpRight size={16} className="text-gray-400 group-hover:text-black transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border-4 border-black rounded-[3rem] p-12 flex flex-col items-center justify-center h-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] min-h-[600px]"
              >
                <div className="relative mb-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full"
                  />
                  <Library className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black italic">Scanning Global Archives...</h3>
                <p className="text-gray-400 font-bold mt-2 text-center max-w-xs">
                  Connecting to Project Gutenberg, Open Library, and more to find your book.
                </p>
              </motion.div>
            ) : results ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border-4 border-black rounded-[3rem] p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] h-full overflow-y-auto custom-scrollbar min-h-[600px]"
              >
                <div className="flex items-center gap-4 mb-10 pb-6 border-b-4 border-black">
                  <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl border-2 border-black">
                    <Bookmark size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight italic">Search Results</h3>
                    <p className="text-gray-400 font-bold">Found in Global Digital Libraries</p>
                  </div>
                </div>
                <div className="prose prose-blue max-w-none font-bold text-gray-700">
                  <ReactMarkdown>{results}</ReactMarkdown>
                </div>
              </motion.div>
            ) : (
              <div className="bg-gray-50 border-4 border-dashed border-black rounded-[3rem] p-12 flex flex-col items-center justify-center h-full text-center opacity-50 min-h-[600px]">
                <Library size={80} className="text-gray-300 mb-6" />
                <h3 className="text-3xl font-black italic">The Great Library</h3>
                <p className="text-gray-400 font-bold mt-2 max-w-md mx-auto">
                  Search for any book title or author to find digital copies across the world's most prestigious archives.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
