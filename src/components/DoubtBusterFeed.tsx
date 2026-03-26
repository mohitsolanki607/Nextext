import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2, 
  Search, 
  Filter, 
  MoreVertical, 
  Send, 
  User,
  Clock,
  BookOpen,
  GraduationCap,
  Sparkles,
  Loader2,
  Trash2
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  arrayUnion, 
  arrayRemove, 
  deleteDoc,
  where,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';

interface DoubtPost {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string;
  imageUrl: string;
  solution: string;
  subject: string;
  exam: string;
  likes: string[];
  saves: string[];
  commentCount: number;
  createdAt: any;
}

interface Comment {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string;
  text: string;
  createdAt: any;
}

export function DoubtBusterFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<DoubtPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterExam, setFilterExam] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'doubt_posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as DoubtPost)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!activePostId) {
      setComments([]);
      return;
    }

    const q = query(
      collection(db, `doubt_posts/${activePostId}/comments`),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment)));
    });
    return () => unsubscribe();
  }, [activePostId]);

  const handleLike = async (post: DoubtPost) => {
    if (!user) return;
    const postRef = doc(db, 'doubt_posts', post.id);
    const isLiked = post.likes?.includes(user.uid);
    
    await updateDoc(postRef, {
      likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  const handleSave = async (post: DoubtPost) => {
    if (!user) return;
    const postRef = doc(db, 'doubt_posts', post.id);
    const isSaved = post.saves?.includes(user.uid);
    
    await updateDoc(postRef, {
      saves: isSaved ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activePostId || !newComment.trim()) return;

    setIsCommenting(true);
    try {
      await addDoc(collection(db, `doubt_posts/${activePostId}/comments`), {
        postId: activePostId,
        authorUid: user.uid,
        authorName: user.displayName || 'Student',
        authorPhoto: user.photoURL || '',
        text: newComment,
        createdAt: serverTimestamp()
      });
      
      await updateDoc(doc(db, 'doubt_posts', activePostId), {
        commentCount: increment(1)
      });
      
      setNewComment('');
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deleteDoc(doc(db, 'doubt_posts', postId));
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const subjects = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Economics', 'Polity', 'English', 'Aptitude'];
  const exams = ['All', 'UPSC', 'SSC', 'JEE', 'NEET', 'CAT', 'GATE', 'School Boards', 'CLAT'];

  const filteredPosts = posts.filter(p => {
    const matchesSubject = filterSubject === 'All' || p.subject === filterSubject;
    const matchesExam = filterExam === 'All' || p.exam === filterExam;
    const matchesSearch = p.authorName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.exam.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesExam && matchesSearch;
  });

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-5xl font-black tracking-tighter mb-2 italic flex items-center gap-4">
            <Sparkles size={48} className="text-blue-500" />
            Doubt-Buster
          </h2>
          <p className="text-gray-400 font-bold text-lg">Community feed for solved doubts and study insights.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search posts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white border-2 border-black rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all w-full sm:w-64 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-4 py-3 bg-white border-2 border-black rounded-2xl text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
            >
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select 
              value={filterExam}
              onChange={(e) => setFilterExam(e.target.value)}
              className="px-4 py-3 bg-white border-2 border-black rounded-2xl text-sm font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
            >
              {exams.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={64} className="text-blue-600 animate-spin mb-4" />
          <p className="font-black text-xl italic">Loading Community Feed...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white border-4 border-black rounded-[3rem] p-20 text-center shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <BookOpen size={80} className="text-gray-200 mx-auto mb-6" />
          <h3 className="text-3xl font-black italic">No doubts found</h3>
          <p className="text-gray-400 font-bold">Be the first to post a solved doubt from Snap & Learn!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {filteredPosts.map((post) => (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-4 border-black rounded-[2.5rem] overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col"
            >
              {/* Post Header */}
              <div className="p-6 border-b-2 border-black flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-black overflow-hidden bg-white">
                    {post.authorPhoto ? (
                      <img src={post.authorPhoto} alt={post.authorName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600">
                        <User size={24} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-lg italic leading-none">{post.authorName}</h4>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 flex items-center gap-1">
                      <Clock size={10} />
                      {post.createdAt ? formatDistanceToNow(post.createdAt.toDate()) + ' ago' : 'Just now'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 border-2 border-black rounded-full text-[10px] font-black uppercase">
                    {post.subject}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-600 border-2 border-black rounded-full text-[10px] font-black uppercase">
                    {post.exam}
                  </span>
                </div>
              </div>

              {/* Post Content */}
              <div className="flex-1">
                <div className="aspect-video bg-black relative">
                  <img src={post.imageUrl} alt="Doubt" className="w-full h-full object-contain" />
                </div>
                <div className="p-8">
                  <div className="prose prose-blue max-w-none line-clamp-6 font-bold text-gray-700 mb-6">
                    <ReactMarkdown>{post.solution}</ReactMarkdown>
                  </div>
                  <button 
                    onClick={() => setActivePostId(post.id)}
                    className="text-blue-600 font-black text-sm hover:underline italic"
                  >
                    Read Full Solution & Comments
                  </button>
                </div>
              </div>

              {/* Post Actions */}
              <div className="p-6 border-t-2 border-black bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => handleLike(post)}
                    className={`flex items-center gap-2 font-black transition-all ${post.likes?.includes(user?.uid || '') ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                  >
                    <Heart size={24} fill={post.likes?.includes(user?.uid || '') ? 'currentColor' : 'none'} />
                    <span>{post.likes?.length || 0}</span>
                  </button>
                  <button 
                    onClick={() => setActivePostId(post.id)}
                    className="flex items-center gap-2 text-gray-400 hover:text-blue-500 font-black transition-all"
                  >
                    <MessageCircle size={24} />
                    <span>{post.commentCount || 0}</span>
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleSave(post)}
                    className={`transition-all ${post.saves?.includes(user?.uid || '') ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                  >
                    <Bookmark size={24} fill={post.saves?.includes(user?.uid || '') ? 'currentColor' : 'none'} />
                  </button>
                  {user?.uid === post.authorUid && (
                    <button 
                      onClick={() => handleDeletePost(post.id)}
                      className="text-gray-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={24} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Post Modal */}
      <AnimatePresence>
        {activePostId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePostId(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white border-4 border-black rounded-[3rem] w-full max-w-6xl max-h-full overflow-hidden flex flex-col shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]"
            >
              <button 
                onClick={() => setActivePostId(null)}
                className="absolute top-6 right-6 z-10 bg-white border-2 border-black p-2 rounded-xl hover:bg-gray-100 transition-all"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col lg:flex-row h-full overflow-hidden">
                {/* Left: Image & Solution */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-12 border-b-4 lg:border-b-0 lg:border-r-4 border-black custom-scrollbar">
                  {posts.find(p => p.id === activePostId) && (
                    <div className="space-y-8">
                      <div className="aspect-video bg-black rounded-3xl border-2 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <img src={posts.find(p => p.id === activePostId)?.imageUrl} alt="Doubt" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full border-2 border-black overflow-hidden bg-white">
                          <img src={posts.find(p => p.id === activePostId)?.authorPhoto} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-black text-2xl italic leading-none">{posts.find(p => p.id === activePostId)?.authorName}</h4>
                          <p className="font-bold text-gray-400 mt-1">Posted in {posts.find(p => p.id === activePostId)?.subject} for {posts.find(p => p.id === activePostId)?.exam}</p>
                        </div>
                      </div>
                      <div className="prose prose-blue max-w-none font-bold text-gray-700 bg-gray-50 p-8 rounded-[2rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <ReactMarkdown>{posts.find(p => p.id === activePostId)?.solution || ''}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Comments */}
                <div className="w-full lg:w-[400px] flex flex-col bg-gray-50">
                  <div className="p-8 border-b-2 border-black bg-white">
                    <h3 className="text-2xl font-black italic flex items-center gap-2">
                      <MessageCircle size={24} className="text-blue-500" />
                      Comments
                    </h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    {comments.map(comment => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-black overflow-hidden bg-white shrink-0">
                          {comment.authorPhoto ? (
                            <img src={comment.authorPhoto} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                              <User size={16} />
                            </div>
                          )}
                        </div>
                        <div className="bg-white border-2 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-black text-xs italic">{comment.authorName}</span>
                            <span className="text-[8px] font-bold text-gray-400">
                              {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate()) + ' ago' : 'now'}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-gray-600">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <div className="text-center py-10">
                        <p className="text-gray-400 font-bold italic">No comments yet. Start the conversation!</p>
                      </div>
                    )}
                  </div>

                  <div className="p-8 border-t-2 border-black bg-white">
                    <form onSubmit={handleAddComment} className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Add a comment..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 bg-gray-50 border-2 border-black p-4 rounded-xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      />
                      <button 
                        type="submit"
                        disabled={isCommenting || !newComment.trim()}
                        className="bg-blue-600 text-white border-2 border-black p-4 rounded-xl font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all disabled:opacity-50"
                      >
                        {isCommenting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={20} />}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const X = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
