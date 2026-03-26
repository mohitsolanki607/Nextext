import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { 
  Plus, 
  Book as BookIcon, 
  GraduationCap, 
  Search, 
  Trash2, 
  ExternalLink, 
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List as ListIcon,
  LogIn,
  LogOut,
  User as UserIcon,
  Sparkles,
  FileUp,
  FileText,
  BarChart3,
  CreditCard,
  History,
  Send,
  Loader2,
  Download,
  Swords,
  Zap,
  Flame,
  Trophy,
  Timer,
  ShieldCheck,
  Camera,
  Library,
  School,
  Backpack,
  Menu,
  X,
  MessageCircle,
  Gift,
  Facebook,
  Twitter,
  Phone,
  Moon,
  Sun,
  Settings,
  Share2,
  HelpCircle,
  Coins,
  ShieldAlert,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, googleProvider, facebookProvider, twitterProvider, OperationType, handleFirestoreError, RecaptchaVerifier, signInWithPhoneNumber } from './firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, orderBy, limit, getDoc, getDocs, setDoc, increment } from 'firebase/firestore';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { Toaster, toast } from 'sonner';
import { useGameEngine } from './hooks/useGameEngine';
import { summarizeStudyMaterialStream, askAiAssistantStream, findStudyResourcesStream } from './services/geminiService';
import { AudioSummarizeButton } from './components/AudioSummarizeButton';
import ReactMarkdown from 'react-markdown';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format, isAfter, addDays } from 'date-fns';

// Lazy load heavy components
const WhizLink = lazy(() => import('./components/WhizLink').then(m => ({ default: m.WhizLink })));
const BountySystem = lazy(() => import('./components/BountySystem').then(m => ({ default: m.BountySystem })));
const WhizQuizViewer = lazy(() => import('./components/WhizQuizViewer').then(m => ({ default: m.WhizQuizViewer })));
const DoubtBusterFeed = lazy(() => import('./components/DoubtBusterFeed').then(m => ({ default: m.DoubtBusterFeed })));
const BattleSystem = lazy(() => import('./components/BattleSystem'));
const SnapTools = lazy(() => import('./components/SnapTools'));
const StudyNotes = lazy(() => import('./components/StudyNotes'));
const ExamResources = lazy(() => import('./components/ExamResources'));
const WeeklyExam = lazy(() => import('./components/WeeklyExam'));
const SchoolCorner = lazy(() => import('./components/SchoolCorner'));
const LibraryCorner = lazy(() => import('./components/LibraryCorner'));
const TimedChallenge = lazy(() => import('./components/TimedChallenge'));
const ComplaintBox = lazy(() => import('./components/ComplaintBox').then(m => ({ default: m.ComplaintBox })));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));

// --- Types ---
interface Semester {
  id: string;
  uid: string;
  name: string;
  year: string;
  createdAt: any;
}

interface Book {
  id: string;
  uid: string;
  semesterId: string;
  title: string;
  author: string;
  status: 'to-read' | 'reading' | 'completed';
  link?: string;
  notes?: string;
  createdAt: any;
}

interface MediaFile {
  id: string;
  uid: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: any;
}

interface Activity {
  id: string;
  uid: string;
  action: string;
  details: string;
  timestamp: any;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 rounded-full blur-[120px]" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative mb-12">
          <motion.div
            animate={{ 
              rotate: 360,
              boxShadow: ["0 0 20px rgba(37, 99, 235, 0.2)", "0 0 60px rgba(37, 99, 235, 0.5)", "0 0 20px rgba(37, 99, 235, 0.2)"]
            }}
            transition={{ 
              rotate: { duration: 10, repeat: Infinity, ease: "linear" },
              boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center border border-white/20"
          >
            <GraduationCap className="w-16 h-16 text-white" />
          </motion.div>
          
          {/* Decorative Rings */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-20px] border border-white/5 rounded-full"
          />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-40px] border border-white/5 rounded-full"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center"
        >
          <h2 className="text-5xl font-black text-white italic tracking-tighter mb-4">
            NEXTEXT
          </h2>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity, 
                  delay: i * 0.2 
                }}
                className="w-2 h-2 bg-blue-500 rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function MaintenanceScreen() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-red-600/20 rounded-[2rem] flex items-center justify-center mb-8 border-2 border-red-600/50"
      >
        <ShieldAlert className="w-12 h-12 text-red-600" />
      </motion.div>
      <h1 className="text-4xl font-black text-white mb-4 italic tracking-tighter">UNDER MAINTENANCE</h1>
      <p className="text-gray-400 max-w-md font-medium leading-relaxed">
        We're currently upgrading our AI systems to provide you with a better experience. 
        Please check back in a few minutes.
      </p>
    </div>
  );
}

// --- Main App Component ---
function NextextApp() {
  const { user, profile, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { awardNexCoins, getShareChallenge } = useGameEngine();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'study' | 'ai' | 'media' | 'analytics' | 'profile' | 'battle' | 'snap' | 'resources' | 'weekly' | 'school' | 'library' | 'timed' | 'whiz' | 'bounty' | 'feed' | 'notes' | 'support'>('dashboard');
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  
  // UI State
  const [isAddSemesterOpen, setIsAddSemesterOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isManualPaymentOpen, setIsManualPaymentOpen] = useState(false);
  const [manualUtr, setManualUtr] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [isPhoneAuthOpen, setIsPhoneAuthOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [globalNotification, setGlobalNotification] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifier = useRef<any>(null);

  // --- Referral Logic ---
  const referralRecorded = useRef(false);
  useEffect(() => {
    // Capture quizId from URL
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quizId');
    if (quizId) {
      setActiveQuizId(quizId);
    }

    if (window.location.pathname === '/NexText2026/nex-admin') {
      setIsAdminMode(true);
    }

    if (!user || !profile || !profile.referredBy || referralRecorded.current) return;

    const recordReferral = async () => {
      try {
        referralRecorded.current = true;
        const q = query(
          collection(db, 'referrals'),
          where('referredUid', '==', user.uid)
        );
        const snap = await getDocs(q);
        
        if (snap.empty) {
          const qRef = query(
            collection(db, 'users'),
            where('referralCode', '==', profile.referredBy),
            limit(1)
          );
          const refSnap = await getDocs(qRef);
          
          if (!refSnap.empty) {
            const referrer = refSnap.docs[0];
            await addDoc(collection(db, 'referrals'), {
              referrerUid: referrer.id,
              referredUid: user.uid,
              status: profile.isPro ? 'pro' : 'joined',
              createdAt: serverTimestamp()
            });
            
            await updateDoc(doc(db, 'users', referrer.id), {
              referralCount: increment(1),
              successfulReferrals: profile.isPro ? increment(1) : increment(0)
            });
          }
        } else {
          const referralDoc = snap.docs[0];
          if (referralDoc.data().status === 'joined' && profile.isPro) {
            await updateDoc(doc(db, 'referrals', referralDoc.id), {
              status: 'pro'
            });
            await updateDoc(doc(db, 'users', referralDoc.data().referrerUid), {
              successfulReferrals: increment(1)
            });
          }
        }
      } catch (err) {
        console.error('Error recording referral:', err);
        referralRecorded.current = false;
      }
    };

    recordReferral();
  }, [user, profile?.referredBy, profile?.isPro]);

  // Form State
  const [newSemName, setNewSemName] = useState('');
  const [newSemYear, setNewSemYear] = useState('');
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookLink, setNewBookLink] = useState('');
  const [newBookNotes, setNewBookNotes] = useState('');

  // --- Data Sync ---
  useEffect(() => {
    if (!user) return;

    const qSem = query(collection(db, 'semesters'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubSem = onSnapshot(qSem, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Semester));
      setSemesters(data);
      if (data.length > 0 && !activeSemesterId) setActiveSemesterId(data[0].id);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'semesters'));

    const qBooks = query(collection(db, 'books'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubBooks = onSnapshot(qBooks, (snap) => {
      setBooks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Book)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'books'));

    const qMedia = query(collection(db, 'media'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubMedia = onSnapshot(qMedia, (snap) => {
      setMedia(snap.docs.map(d => ({ id: d.id, ...d.data() } as MediaFile)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'media'));

    const qAct = query(collection(db, 'activities'), where('uid', '==', user.uid), orderBy('timestamp', 'desc'), limit(10));
    const unsubAct = onSnapshot(qAct, (snap) => {
      setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() } as Activity)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'activities'));

    const unsubConfig = onSnapshot(doc(db, 'app_config', 'settings'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setGlobalNotification(data.globalNotification || '');
        setMaintenanceMode(data.maintenanceMode || false);
      }
    });

    return () => {
      unsubSem();
      unsubBooks();
      unsubMedia();
      unsubAct();
      unsubConfig();
    };
  }, [user]);

  // --- Actions ---
  const logActivity = async (action: string, details: string) => {
    if (!user) return;
    await addDoc(collection(db, 'activities'), {
      uid: user.uid,
      action,
      details,
      timestamp: serverTimestamp()
    });
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await signInWithPopup(auth, facebookProvider);
    } catch (err: any) {
      console.error("Facebook Login failed", err);
      if (err.code === 'auth/operation-not-allowed') {
        alert("Facebook Login is not enabled. Please enable it in Firebase Console > Authentication > Sign-in method.");
      } else {
        alert("Facebook Login failed: " + err.message);
      }
    }
  };

  const handleTwitterLogin = async () => {
    try {
      await signInWithPopup(auth, twitterProvider);
    } catch (err: any) {
      console.error("Twitter Login failed", err);
      if (err.code === 'auth/operation-not-allowed') {
        alert("Twitter Login is not enabled. Please enable it in Firebase Console > Authentication > Sign-in method.");
      } else {
        alert("Twitter Login failed: " + err.message);
      }
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setIsSendingCode(true);
    try {
      if (!recaptchaVerifier.current) {
        recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      }
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier.current);
      setConfirmationResult(confirmation);
    } catch (err: any) {
      console.error("Error sending code:", err);
      alert("Error sending code: " + err.message);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || !confirmationResult) return;
    setIsVerifyingCode(true);
    try {
      await confirmationResult.confirm(verificationCode);
      setIsPhoneAuthOpen(false);
      setConfirmationResult(null);
      setVerificationCode('');
      setPhoneNumber('');
    } catch (err: any) {
      console.error("Error verifying code:", err);
      alert("Error verifying code: " + err.message);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !manualUtr) return;
    setIsSubmittingUtr(true);
    try {
      await addDoc(collection(db, 'pending_payments'), {
        uid: user.uid,
        email: user.email,
        utr: manualUtr,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      // Also save to localStorage as requested
      const existing = JSON.parse(localStorage.getItem('nextext_pending_utrs') || '[]');
      localStorage.setItem('nextext_pending_utrs', JSON.stringify([...existing, manualUtr]));
      
      setManualUtr('');
      setIsManualPaymentOpen(false);
      alert('Payment request submitted! Admin will approve it soon.');
    } catch (err) {
      console.error('Error submitting UTR:', err);
      handleFirestoreError(err, OperationType.CREATE, 'pending_payments');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const addSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newSemName || !newSemYear) return;
    try {
      await addDoc(collection(db, 'semesters'), {
        uid: user.uid,
        name: newSemName,
        year: newSemYear,
        createdAt: serverTimestamp()
      });
      logActivity('Created Semester', newSemName);
      setNewSemName('');
      setNewSemYear('');
      setIsAddSemesterOpen(false);
    } catch (err) { handleFirestoreError(err, OperationType.CREATE, 'semesters'); }
  };

  const addBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeSemesterId || !newBookTitle) return;
    try {
      await addDoc(collection(db, 'books'), {
        uid: user.uid,
        semesterId: activeSemesterId,
        title: newBookTitle,
        author: newBookAuthor,
        status: 'to-read',
        link: newBookLink,
        notes: newBookNotes,
        createdAt: serverTimestamp()
      });
      logActivity('Added Book', newBookTitle);
      setNewBookTitle('');
      setNewBookAuthor('');
      setNewBookLink('');
      setNewBookNotes('');
      setIsAddBookOpen(false);
    } catch (err) { handleFirestoreError(err, OperationType.CREATE, 'books'); }
  };

  const updateBookStatus = async (bookId: string, status: Book['status']) => {
    try {
      await updateDoc(doc(db, 'books', bookId), { status });
      logActivity('Updated Book Status', `Book ${bookId} set to ${status}`);
    } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `books/${bookId}`); }
  };

  const deleteBook = async (bookId: string) => {
    try {
      await deleteDoc(doc(db, 'books', bookId));
      logActivity('Deleted Book', bookId);
    } catch (err) { handleFirestoreError(err, OperationType.DELETE, `books/${bookId}`); }
  };

  const handleAiAsk = async () => {
    if (!aiInput) return;
    setIsAiLoading(true);
    setAiResponse(""); // Clear previous response
    try {
      let fullText = "";
      // If it looks like a search query, use search tool
      if (aiInput.toLowerCase().includes('find') || aiInput.toLowerCase().includes('search') || aiInput.toLowerCase().includes('latest')) {
        fullText = await findStudyResourcesStream(aiInput, selectedLanguage, (text) => {
          setAiResponse(text);
        });
      } else {
        // Otherwise use streaming chat for speed
        fullText = await askAiAssistantStream(aiInput, selectedLanguage, (text) => {
          setAiResponse(text);
        });
      }
      logActivity('AI Query', `${aiInput} (${selectedLanguage})`);
      if (fullText && !fullText.includes("Sorry, I couldn't process")) {
        awardNexCoins(5, 'asking AI assistant');
      }
    } catch (err) {
      setAiResponse("Sorry, I couldn't process that request.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSummarize = async (bookTitle: string, bookNotes?: string) => {
    if (!bookTitle) return;
    setIsSummarizing(true);
    setActiveTab('ai');
    setAiInput(`Summarize: ${bookTitle}`);
    setAiResponse(""); // Clear previous response
    try {
      const content = bookNotes ? `Title: ${bookTitle}\nNotes: ${bookNotes}` : bookTitle;
      const fullText = await summarizeStudyMaterialStream(content, selectedLanguage, (text) => {
        setAiResponse(text);
      });
      logActivity('AI Summarize', `${bookTitle} (${selectedLanguage})`);
      if (fullText && !fullText.includes("Sorry, I couldn't summarize")) {
        awardNexCoins(10, 'summarizing study material');
      }
    } catch (err) {
      setAiResponse("Sorry, I couldn't summarize this material.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleUpgrade = async () => {
    if (!user || !profile) return;
    setIsUpgrading(true);
    try {
      // 1. Create Order on Server
      const res = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: 99, 
          currency: "INR", 
          receipt: `rcpt_${user.uid.substring(0, 10)}_${Date.now() % 1000000}` 
        }),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create payment order");
      }
      
      const order = await res.json();

      // 2. Open Razorpay Checkout
      const razorpayKey = (import.meta as any).env.VITE_RAZORPAY_KEY_ID?.trim();
      console.log("Using Razorpay Key ID on Frontend:", razorpayKey ? `${razorpayKey.substring(0, 8)}...` : "MISSING");
      
      if (!razorpayKey) {
        throw new Error("Razorpay Key ID is missing. Please configure it in Settings.");
      }

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: "Nextext Pro",
        description: "90 Days Premium Access",
        order_id: order.id,
        handler: async (response: any) => {
          console.log("Razorpay Payment Success Response:", response);
          try {
            // 3. Verify Payment on Server
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) throw new Error("Payment verification failed");

            const verifyData = await verifyRes.json();
            if (verifyData.status === 'success') {
              // 4. Update User Profile in Firestore
              const userRef = doc(db, 'users', user.uid);
              const newExpiry = addDays(new Date(), 90);
              await setDoc(userRef, {
                isPro: true,
                subscriptionEndsAt: newExpiry
              }, { merge: true });
              alert("Payment Successful! Welcome to Pro.");
              window.location.reload();
            }
          } catch (err: any) {
            console.error("Verification error:", err);
            alert("Error verifying payment: " + err.message);
          }
        },
        prefill: {
          name: profile.displayName || user.displayName,
          email: user.email,
        },
        theme: {
          color: "#2563eb",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      console.log("Razorpay Instance Created. Opening Checkout...");
      
      rzp.on('payment.failed', function (response: any) {
        console.error("Razorpay Payment Failed Event:", response.error);
        alert("Payment Failed: " + response.error.description);
      });
      rzp.open();
    } catch (error: any) {
      console.error("Upgrade Error:", error);
      if (error.message.includes("Razorpay is not defined")) {
        alert("Razorpay script failed to load. Please check your internet connection or disable ad-blockers.");
      } else {
        alert("Error initiating payment: " + error.message);
      }
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    // Simulate upload (since we don't have Firebase Storage configured in this prompt, we'll use a placeholder URL)
    const mockUrl = `https://example.com/files/${file.name}`;
    try {
      await addDoc(collection(db, 'media'), {
        uid: user.uid,
        name: file.name,
        url: mockUrl,
        type: file.type,
        size: file.size,
        createdAt: serverTimestamp()
      });
      logActivity('Uploaded Media', file.name);
    } catch (err) { handleFirestoreError(err, OperationType.CREATE, 'media'); }
  };

  // --- Render Helpers ---
  if (authLoading) return <LoadingScreen />;

  const isAdmin = user?.email === 'msolanki80979@gmail.com' || profile?.role === 'admin';

  if (maintenanceMode && !isAdmin) {
    return <MaintenanceScreen />;
  }

  if (!user) return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1)_0%,rgba(5,5,5,1)_100%)]" />
        
        {/* Animated Orbs */}
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[100px]" 
        />
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: Math.random() * 0.5,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{ 
              y: [null, "-20%", "120%"],
              opacity: [null, 0.8, 0]
            }}
            transition={{ 
              duration: Math.random() * 10 + 10, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 10
            }}
            className="absolute w-1 h-1 bg-blue-400 rounded-full blur-[1px]"
          />
        ))}
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 text-center max-w-4xl w-full"
      >
        <div className="mb-12 relative inline-block">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="relative z-10"
          >
            {/* Logo Container - Using a stylized version of the provided logo */}
            <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-[#1a2a4a] to-[#0a0a0a] rounded-[2.5rem] border-2 border-white/10 shadow-2xl flex items-center justify-center overflow-hidden group">
              <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-lg">NE</span>
                <div className="h-1 w-12 bg-blue-500 rounded-full mt-1" />
              </div>
            </div>
          </motion.div>
          
          {/* Decorative elements around logo */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-20px] border border-dashed border-white/10 rounded-full"
          />
        </div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-6xl md:text-8xl font-black tracking-tighter mb-6 italic"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
            NEXTEXT
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed"
        >
          The next-generation AI study platform. <br className="hidden md:block" />
          Elevate your academic journey with intelligent precision.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="flex flex-col md:flex-row gap-4 w-full max-w-xl">
            <button 
              onClick={handleLogin}
              className="flex-1 group relative flex items-center justify-center gap-3 bg-white text-black px-8 py-5 rounded-2xl font-black text-lg hover:bg-blue-50 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <LogIn className="w-6 h-6" />
              Continue with Google
            </button>
            
            <button 
              onClick={() => setIsPhoneAuthOpen(true)}
              className="flex-1 flex items-center justify-center gap-3 bg-white/5 backdrop-blur-md text-white border border-white/10 px-8 py-5 rounded-2xl font-black text-lg hover:bg-white/10 transition-all active:scale-95"
            >
              <Phone className="w-6 h-6" />
              Phone Login
            </button>
          </div>
          
          <div className="flex items-center gap-4 w-full max-w-xl">
            <div className="h-[1px] flex-1 bg-white/10" />
            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Social Connect</span>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>

          <div className="flex gap-4">
            <button 
              onClick={handleFacebookLogin}
              className="w-14 h-14 flex items-center justify-center bg-[#1877F2]/10 border border-[#1877F2]/20 text-[#1877F2] rounded-2xl hover:bg-[#1877F2] hover:text-white transition-all active:scale-90"
            >
              <Facebook className="w-6 h-6" />
            </button>
            <button 
              onClick={handleTwitterLogin}
              className="w-14 h-14 flex items-center justify-center bg-[#1DA1F2]/10 border border-[#1DA1F2]/20 text-[#1DA1F2] rounded-2xl hover:bg-[#1DA1F2] hover:text-white transition-all active:scale-90"
            >
              <Twitter className="w-6 h-6" />
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="mt-20 pt-8 border-t border-white/5"
        >
          <button 
            onClick={() => setIsPrivacyOpen(true)}
            className="text-gray-600 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
          >
            Privacy & Terms of Service
          </button>
        </motion.div>
      </motion.div>
      
      <div id="recaptcha-container"></div>

      <Modal isOpen={isPhoneAuthOpen} onClose={() => setIsPhoneAuthOpen(false)} title="Phone Authentication">
        <div className="space-y-6">
          {!confirmationResult ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest text-black">Phone Number</label>
                <input 
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full p-4 bg-gray-50 border-2 border-black rounded-2xl font-bold focus:ring-0 outline-none text-black"
                />
                <p className="text-[10px] text-gray-400 font-bold">Include country code (e.g., +91 for India)</p>
              </div>
              <button 
                type="submit" 
                disabled={isSendingCode}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
              >
                {isSendingCode ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={20} />}
                Send Verification Code
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest text-black">Verification Code</label>
                <input 
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="6-digit code"
                  className="w-full p-4 bg-gray-50 border-2 border-black rounded-2xl font-bold focus:ring-0 outline-none text-center tracking-[1em] text-black"
                  maxLength={6}
                />
              </div>
              <button 
                type="submit" 
                disabled={isVerifyingCode}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                {isVerifyingCode ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 size={20} />}
                Verify & Sign In
              </button>
              <button 
                type="button"
                onClick={() => setConfirmationResult(null)}
                className="w-full py-2 text-gray-400 font-bold text-sm hover:text-black transition-all"
              >
                Change Phone Number
              </button>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );

  if (isPrivacyOpen) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <PrivacyPolicy onBack={() => setIsPrivacyOpen(false)} />
      </Suspense>
    );
  }

  if (isAdminMode) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <AdminPanel onBack={() => {
          setIsAdminMode(false);
          window.history.pushState({}, '', '/');
        }} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0A] text-[#1A1A1A] dark:text-white flex font-sans transition-colors duration-300">
      <Toaster position="top-center" richColors />
      
      {/* Global Notification Bar */}
      <AnimatePresence>
        {globalNotification && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[60] bg-blue-600 text-white py-2 px-4 text-center font-black text-xs flex items-center justify-center gap-2 overflow-hidden"
          >
            <Bell size={14} className="animate-bounce" />
            {globalNotification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-[#111111] border-b-2 border-black dark:border-white/10 p-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <div className="bg-black dark:bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">NE</span>
          </div>
          <h1 className="font-black text-xl tracking-tighter italic">NEXTEXT</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 border-2 border-black dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 border-2 border-black dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-72 bg-white dark:bg-[#111111] border-r-2 border-black dark:border-white/10 flex flex-col fixed h-full z-50 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-black dark:bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
              <span className="text-white font-black text-lg">NE</span>
            </div>
            <h1 className="font-black text-2xl tracking-tighter italic">NEXTEXT</h1>
          </div>

          {/* Persona Switcher */}
          <div className="bg-gray-100 dark:bg-white/5 p-1 rounded-xl border-2 border-black dark:border-white/10 flex">
            <button 
              onClick={async () => {
                if (profile?.uid) {
                  await updateDoc(doc(db, 'users', profile.uid), { persona: 'school' });
                }
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-black text-xs transition-all ${
                profile?.persona === 'school' 
                  ? 'bg-white dark:bg-[#111111] border-2 border-black dark:border-white/20 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]' 
                  : 'text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <School size={14} />
              SCHOOL
            </button>
            <button 
              onClick={async () => {
                if (profile?.uid) {
                  await updateDoc(doc(db, 'users', profile.uid), { persona: 'govt' });
                }
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-black text-xs transition-all ${
                profile?.persona === 'govt' 
                  ? 'bg-white dark:bg-[#111111] border-2 border-black dark:border-white/20 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]' 
                  : 'text-gray-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Backpack size={14} />
              GOVT
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          <NavBtn active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} icon={LayoutGrid} label="Dashboard" />
          
          {profile?.persona === 'school' ? (
            <>
              <NavBtn active={activeTab === 'school'} onClick={() => { setActiveTab('school'); setIsSidebarOpen(false); }} icon={GraduationCap} label="School Corner" />
              <NavBtn active={activeTab === 'library'} onClick={() => { setActiveTab('library'); setIsSidebarOpen(false); }} icon={Library} label="Library Corner" />
              <NavBtn active={activeTab === 'study'} onClick={() => { setActiveTab('study'); setIsSidebarOpen(false); }} icon={BookOpen} label="Study Hub" />
            </>
          ) : (
            <>
              <NavBtn active={activeTab === 'study'} onClick={() => { setActiveTab('study'); setIsSidebarOpen(false); }} icon={BookOpen} label="Study Hub" />
              <NavBtn active={activeTab === 'weekly'} onClick={() => { setActiveTab('weekly'); setIsSidebarOpen(false); }} icon={Trophy} label="Weekly Exam" />
              <NavBtn active={activeTab === 'timed'} onClick={() => { setActiveTab('timed'); setIsSidebarOpen(false); }} icon={Timer} label="Timed Challenge" />
              <NavBtn active={activeTab === 'resources'} onClick={() => { setActiveTab('resources'); setIsSidebarOpen(false); }} icon={FileText} label="Exam Resources" />
            </>
          )}

          <NavBtn active={activeTab === 'snap'} onClick={() => { setActiveTab('snap'); setIsSidebarOpen(false); }} icon={Camera} label="Snap & Learn" />
          <NavBtn active={activeTab === 'notes'} onClick={() => { setActiveTab('notes'); setIsSidebarOpen(false); }} icon={Sparkles} label="AI Notes" />
          <NavBtn active={activeTab === 'feed'} onClick={() => { setActiveTab('feed'); setIsSidebarOpen(false); }} icon={MessageCircle} label="Doubt-Buster" />
          <NavBtn active={activeTab === 'battle'} onClick={() => { setActiveTab('battle'); setIsSidebarOpen(false); }} icon={Swords} label="Battle Arena" />
          <NavBtn active={activeTab === 'whiz'} onClick={() => { setActiveTab('whiz'); setIsSidebarOpen(false); }} icon={MessageCircle} label="Whiz-Link" />
          <NavBtn active={activeTab === 'bounty'} onClick={() => { setActiveTab('bounty'); setIsSidebarOpen(false); }} icon={Gift} label="Bounty Program" />
          <NavBtn active={activeTab === 'ai'} onClick={() => { setActiveTab('ai'); setIsSidebarOpen(false); }} icon={Sparkles} label="AI Assistant" />
          <NavBtn active={activeTab === 'media'} onClick={() => { setActiveTab('media'); setIsSidebarOpen(false); }} icon={FileUp} label="Media Library" />
          <NavBtn active={activeTab === 'analytics'} onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }} icon={BarChart3} label="Analytics" />
          <NavBtn active={activeTab === 'support'} onClick={() => { setActiveTab('support'); setIsSidebarOpen(false); }} icon={HelpCircle} label="Support" />
          <NavBtn active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }} icon={UserIcon} label="Profile" />
          
          <div className="pt-8 pb-4 px-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Semesters</span>
              <button onClick={() => setIsAddSemesterOpen(true)} className="p-1 border-2 border-black hover:bg-black hover:text-white rounded-md transition-all">
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {semesters.map(sem => (
                <button
                  key={sem.id}
                  onClick={() => { setActiveSemesterId(sem.id); setActiveTab('study'); }}
                  className={`w-full text-left px-4 py-3 border-2 transition-all flex items-center justify-between group ${
                    activeSemesterId === sem.id 
                      ? 'bg-blue-600 border-black text-white font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                      : 'border-transparent text-gray-500 hover:border-black hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">{sem.name}</span>
                  <ChevronRight size={14} className={activeSemesterId === sem.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'} />
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-6 border-t-2 border-black dark:border-white/10">
          <div className="flex items-center gap-3 p-4 border-2 border-black dark:border-white/10 rounded-xl bg-yellow-50 dark:bg-yellow-900/10">
            <div className="relative">
              <img src={profile?.photoURL || user.photoURL || ''} alt="" className="w-10 h-10 rounded-lg object-cover border-2 border-black dark:border-white/10" />
              <div className="absolute -top-2 -right-2 bg-orange-500 text-white p-1 rounded-md border-2 border-black dark:border-white/10">
                <Flame size={10} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black truncate dark:text-white">{profile?.displayName || user.displayName}</p>
              <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">{profile?.streak || 0} Day Streak</p>
            </div>
            <button onClick={handleLogout} className="text-black dark:text-white hover:text-red-500 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
          <div className="mt-4 text-center">
            <button 
              onClick={() => setIsPrivacyOpen(true)}
              className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-6 lg:p-12 max-w-7xl mx-auto w-full mt-16 lg:mt-0">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-12 h-12 animate-spin text-blue-600" /></div>}>
        {activeQuizId ? (
          <WhizQuizViewer quizId={activeQuizId} onClose={() => {
            setActiveQuizId(null);
            const url = new URL(window.location.href);
            url.searchParams.delete('quizId');
            window.history.replaceState({}, '', url.toString());
          }} />
        ) : (
          <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="dashboard" className="space-y-10">
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-5xl font-black tracking-tighter mb-2 italic">
                    {profile?.persona === 'school' ? 'Hey Student! 🎒' : 'Welcome back, ' + (profile?.displayName?.split(' ')[0] || user.displayName?.split(' ')[0]) + '!'}
                  </h2>
                  <p className="text-gray-400 font-bold text-lg">
                    {profile?.persona === 'school' ? 'Ready to learn something new today?' : 'Ready to crush your 2026 goals today?'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {profile?.isPro ? (
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 font-black italic">
                      <Sparkles size={18} />
                      PRO MEMBER
                    </div>
                  ) : profile?.trialEndsAt && (
                    <div className="bg-orange-100 text-orange-600 px-6 py-3 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 font-black">
                      <Timer size={18} />
                      TRIAL: {Math.max(0, Math.ceil((new Date(profile.trialEndsAt.toDate()).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} DAYS
                    </div>
                  )}
                  <div className="bg-white dark:bg-[#111111] border-2 border-black dark:border-white/10 p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] flex items-center gap-3">
                    <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 p-2 rounded-xl">
                      <Flame size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Streak</p>
                      <p className="text-xl font-black">{profile?.streak || 0} Days</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#111111] border-2 border-black dark:border-white/10 p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] flex items-center gap-3">
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 p-2 rounded-xl">
                      <Coins size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">NexCoins</p>
                      <p className="text-xl font-black">{profile?.nexCoins || 0}</p>
                    </div>
                  </div>
                </div>
              </header>

              {/* Level Progress Bar */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 border-4 border-black rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl border border-white/30">
                      <Trophy size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Current Level</p>
                      <h4 className="text-xl font-black italic uppercase">{profile?.level || 'Aspirant'}</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Progress to Next Level</p>
                    <p className="font-black">{(profile?.nexCoins || 0) % 100} / 100 Coins</p>
                  </div>
                </div>
                <div className="h-4 bg-white/20 border-2 border-white/30 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(profile?.nexCoins || 0) % 100}%` }}
                    className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                  />
                </div>
              </div>

              {/* Daily Goal Bar */}
              <div className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="text-yellow-500" size={20} />
                    <span className="font-black italic">Daily Study Goal</span>
                  </div>
                  <span className="font-black text-blue-600 dark:text-blue-400">75%</span>
                </div>
                <div className="h-4 bg-gray-100 dark:bg-white/5 border-2 border-black dark:border-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '75%' }}
                    className="h-full bg-blue-600"
                  />
                </div>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {profile?.persona === 'govt' ? (
                  <>
                    {/* Stats Card */}
                    <div className="md:col-span-2 bg-blue-600 border-4 border-black rounded-[3rem] p-10 text-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform" />
                      <div className="relative z-10">
                        <h3 className="text-2xl font-black mb-8 flex items-center gap-2">
                          <BarChart3 size={28} />
                          Weekly Progress
                        </h3>
                        <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                              { day: 'Mon', count: 4 },
                              { day: 'Tue', count: 7 },
                              { day: 'Wed', count: 5 },
                              { day: 'Thu', count: 12 },
                              { day: 'Fri', count: 8 },
                              { day: 'Sat', count: 3 },
                              { day: 'Sun', count: 6 },
                            ]}>
                              <defs>
                                <linearGradient id="dashboardGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#fff" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="count" stroke="#fff" strokeWidth={4} fillOpacity={1} fill="url(#dashboardGradient)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* School Specific Card: NCERT Corner */}
                    <div className="md:col-span-2 bg-green-600 border-4 border-black rounded-[3rem] p-10 text-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-110 transition-transform" />
                      <div className="relative z-10">
                        <h3 className="text-2xl font-black mb-4 flex items-center gap-2">
                          <School size={28} />
                          NCERT Quick Access
                        </h3>
                        <p className="font-bold text-white/80 mb-8">Access all NCERT books from Class 1 to 12 instantly.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {['Class 10', 'Class 11', 'Class 12', 'Science', 'Maths', 'History'].map(item => (
                            <button key={item} className="bg-white/20 hover:bg-white/30 border-2 border-white/40 p-3 rounded-2xl font-black text-sm transition-all">
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Quick Action: Snap & Learn */}
                <button 
                  onClick={() => setActiveTab('snap')}
                  className="bg-yellow-400 border-4 border-black rounded-[3rem] p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-left group"
                >
                  <div className="bg-black text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] group-hover:rotate-12 transition-transform">
                    <Camera size={32} />
                  </div>
                  <h3 className="text-2xl font-black mb-2 italic">Snap & Learn</h3>
                  <p className="font-bold text-black/60 leading-tight">Solve problems instantly with AI.</p>
                </button>

                {/* Quick Action: AI Assistant */}
                <button 
                  onClick={() => setActiveTab('ai')}
                  className="bg-purple-600 border-4 border-black rounded-[3rem] p-10 text-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-left group"
                >
                  <div className="bg-white text-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] group-hover:scale-110 transition-transform">
                    <Sparkles size={32} />
                  </div>
                  <h3 className="text-2xl font-black mb-2 italic">AI Tutor</h3>
                  <p className="font-bold text-white/60 leading-tight">Ask anything, anytime.</p>
                </button>

                {/* Recent Books */}
                <div className="md:col-span-2 bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[3rem] p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black flex items-center gap-2">
                      <BookOpen size={28} />
                      Recent Books
                    </h3>
                    <button onClick={() => setActiveTab('study')} className="text-blue-600 dark:text-blue-400 font-black text-sm hover:underline">View All</button>
                  </div>
                  <div className="space-y-4">
                    {books.slice(0, 3).map(book => (
                      <div key={book.id} className="flex items-center justify-between p-4 border-2 border-black dark:border-white/10 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-600 text-white p-2 rounded-lg">
                            <BookIcon size={20} />
                          </div>
                          <div>
                            <p className="font-black italic">{book.title}</p>
                            <p className="text-xs font-bold text-gray-400">{book.author}</p>
                          </div>
                        </div>
                        <StatusBadge status={book.status} />
                      </div>
                    ))}
                    {books.length === 0 && (
                      <p className="text-center text-gray-400 font-bold py-8">No books added yet.</p>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[3rem] p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]">
                  <h3 className="text-2xl font-black mb-8 flex items-center gap-2 dark:text-white">
                    <History size={28} />
                    Activity
                  </h3>
                  <div className="space-y-6">
                    {activities.slice(0, 4).map(act => (
                      <div key={act.id} className="flex gap-4">
                        <div className="w-1 bg-blue-600 rounded-full" />
                        <div>
                          <p className="text-sm font-black italic dark:text-white">{act.action}</p>
                          <p className="text-xs font-bold text-gray-400">{act.details}</p>
                        </div>
                      </div>
                    ))}
                    {activities.length === 0 && (
                      <p className="text-center text-gray-400 font-bold py-8">No activity yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'study' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="study">
              <header className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-4xl font-black tracking-tight mb-2">
                    {semesters.find(s => s.id === activeSemesterId)?.name || 'Study Hub'}
                  </h2>
                  <p className="text-gray-400 font-medium">Manage your textbooks and academic resources.</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                      type="text" 
                      placeholder="Search books..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-6 py-3 bg-white dark:bg-[#111111] border-2 border-black dark:border-white/10 rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all w-64 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] font-bold dark:text-white"
                    />
                  </div>
                  <button 
                    onClick={() => setIsAddBookOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 border-2 border-black rounded-2xl font-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-2"
                  >
                    <Plus size={20} />
                    Add Book
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {books.filter(b => b.semesterId === activeSemesterId && b.title.toLowerCase().includes(searchQuery.toLowerCase())).map(book => (
                  <div key={book.id} className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[2rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] hover:-translate-y-1 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-b-4 border-black dark:border-white/10 rounded-bl-[4rem] -mr-16 -mt-16 z-0 group-hover:scale-110 transition-transform" />
                    <div className="relative z-10">
                      <div className="bg-blue-600 border-2 border-black dark:border-blue-500 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                        <BookOpen className="text-white w-7 h-7" />
                      </div>
                      <h4 className="text-xl font-black mb-1 truncate italic">{book.title}</h4>
                      <p className="text-gray-400 text-sm mb-6 font-bold">{book.author}</p>
                      
                      <div className="flex items-center justify-between pt-4 border-t-2 border-black dark:border-white/10">
                        <StatusBadge status={book.status} onClick={() => {
                          const next: Book['status'] = book.status === 'to-read' ? 'reading' : book.status === 'reading' ? 'completed' : 'to-read';
                          updateBookStatus(book.id, next);
                        }} />
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleSummarize(book.title, book.notes)} className="p-2 border-2 border-black dark:border-white/10 bg-yellow-50 dark:bg-yellow-900/10 text-black dark:text-yellow-400 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black rounded-xl transition-all" title="Summarize with AI">
                            <Sparkles size={18} />
                          </button>
                          {book.link && (
                            <a href={book.link} target="_blank" className="p-2 border-2 border-black dark:border-white/10 bg-blue-50 dark:bg-blue-900/10 text-black dark:text-blue-400 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black rounded-xl transition-all">
                              <ExternalLink size={18} />
                            </a>
                          )}
                          <button onClick={() => deleteBook(book.id)} className="p-2 border-2 border-black dark:border-white/10 bg-red-50 dark:bg-red-900/10 text-black dark:text-red-400 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black rounded-xl transition-all">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'battle' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="battle">
              <BattleSystem />
            </motion.div>
          )}

          {activeTab === 'snap' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="snap">
              <SnapTools />
            </motion.div>
          )}

          {activeTab === 'resources' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="resources">
              {profile?.isPro ? (
                <ExamResources />
              ) : (
                <ProLockScreen feature="Govt Exam Resources" onUpgrade={() => setActiveTab('profile')} />
              )}
            </motion.div>
          )}

          {activeTab === 'weekly' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="weekly">
              <WeeklyExam />
            </motion.div>
          )}

          {activeTab === 'timed' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="timed">
              <TimedChallenge />
            </motion.div>
          )}

          {activeTab === 'school' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="school">
              <SchoolCorner />
            </motion.div>
          )}

          {activeTab === 'library' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="library">
              <LibraryCorner />
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="ai" className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="bg-purple-100 dark:bg-purple-900/30 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/10 border-2 border-black dark:border-white/10">
                  <Sparkles className="text-purple-600 dark:text-purple-400 w-10 h-10" />
                </div>
                <h2 className="text-4xl font-black tracking-tight mb-4 dark:text-white">AI Superagent</h2>
                <p className="text-gray-400 font-medium">Ask me to find resources, summarize concepts, or create study guides.</p>
              </div>

              <div className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[2.5rem] p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]">
                <div className="flex flex-col gap-6 mb-10">
                  <div className="flex flex-wrap gap-2">
                    {['English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Spanish', 'French', 'German'].map(lang => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`px-4 py-2 rounded-xl text-xs font-black border-2 transition-all ${
                          selectedLanguage === lang 
                            ? 'bg-purple-600 border-black dark:border-white/20 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]' 
                            : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-black dark:hover:border-white/20'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      placeholder="Ask anything... e.g. 'Find latest tech news about quantum computing'"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()}
                      className="flex-1 px-8 py-5 bg-gray-50 dark:bg-white/5 border-2 border-black dark:border-white/10 rounded-3xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-lg font-medium dark:text-white"
                    />
                    <button 
                      onClick={handleAiAsk}
                      disabled={isAiLoading}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-5 rounded-3xl font-bold transition-all flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] border-2 border-black dark:border-white/10 disabled:opacity-50"
                    >
                      {isAiLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send size={24} />}
                      Ask AI
                    </button>
                  </div>
                </div>

                {aiResponse && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-blue dark:prose-invert max-w-none bg-gray-50 dark:bg-white/5 p-10 rounded-[2rem] border-2 border-black dark:border-white/10 relative">
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <button
                        onClick={() => {
                          const challenge = getShareChallenge(aiInput || 'General Knowledge');
                          navigator.clipboard.writeText(challenge);
                          toast.success('Challenge copied to clipboard! 🚀');
                        }}
                        className="p-2 bg-white dark:bg-white/5 border-2 border-black dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-purple-600 dark:text-purple-400 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                        title="Share Challenge"
                      >
                        <Share2 size={14} />
                        Share
                      </button>
                      <AudioSummarizeButton text={aiResponse} variant="minimal" />
                    </div>
                    <ReactMarkdown>{aiResponse}</ReactMarkdown>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'media' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="media">
              <header className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-4xl font-black tracking-tight mb-2 dark:text-white">Media Library</h2>
                  <p className="text-gray-400 font-medium">Securely store and manage your study documents.</p>
                </div>
                <label className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] border-2 border-black dark:border-white/10 flex items-center gap-3 cursor-pointer">
                  <FileUp size={20} />
                  Upload File
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {media.map(file => (
                  <div key={file.id} className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] group">
                    <div className="bg-gray-50 dark:bg-white/5 w-full aspect-square rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 transition-colors border-2 border-black dark:border-white/10">
                      <FileUp className="text-gray-300 dark:text-gray-600 w-12 h-12 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <h5 className="font-bold text-gray-900 dark:text-white truncate mb-1">{file.name}</h5>
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <a href={file.url} className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-xl font-bold text-sm hover:bg-blue-600 hover:text-white transition-all border-2 border-black dark:border-white/10">
                      <Download size={16} />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="analytics">
              <h2 className="text-4xl font-black tracking-tight mb-12 dark:text-white">Creator Dashboard</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-2 bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[2.5rem] p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]">
                  <h3 className="text-xl font-black mb-8 dark:text-white">Study Activity (Last 7 Days)</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { day: 'Mon', count: 4 },
                        { day: 'Tue', count: 7 },
                        { day: 'Wed', count: 5 },
                        { day: 'Thu', count: 12 },
                        { day: 'Fri', count: 8 },
                        { day: 'Sat', count: 3 },
                        { day: 'Sun', count: 6 },
                      ]}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#333' : '#f1f5f9'} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: theme === 'dark' ? '#111' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }} />
                        <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[2.5rem] p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] dark:shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)]">
                  <h3 className="text-xl font-black mb-8 dark:text-white">Recent Activity</h3>
                  <div className="space-y-6">
                    {activities.map(act => (
                      <div key={act.id} className="flex gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/30 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 border-black dark:border-white/10">
                          <History className="text-blue-600 dark:text-blue-400 w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate dark:text-white">{act.action}</p>
                          <p className="text-xs text-gray-400 truncate">{act.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'support' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="support">
              <div className="max-w-2xl mx-auto">
                <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-black dark:text-white" /></div>}>
                  <ComplaintBox />
                </Suspense>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="profile" className="max-w-2xl mx-auto">
              <div className="bg-white dark:bg-[#111111] border-2 border-black dark:border-white/10 rounded-[3rem] p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] text-center">
                <div className="flex justify-end mb-4">
                  <button 
                    onClick={toggleTheme}
                    className="p-3 border-2 border-black dark:border-white/10 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest"
                  >
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                  </button>
                </div>
                <div className="relative inline-block mb-8">
                  <img src={profile?.photoURL || user.photoURL || ''} alt="" className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-black dark:border-white/20 shadow-2xl mx-auto" />
                  {profile?.isPro && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-black p-2 rounded-xl border-2 border-black shadow-lg">
                      <Trophy size={16} />
                    </div>
                  )}
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-2">{profile?.displayName || user.displayName}</h2>
                <p className="text-gray-400 font-medium mb-10">{user.email}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                  <div className="bg-gray-50 dark:bg-white/5 border-2 border-black dark:border-white/10 p-6 rounded-3xl text-center">
                    <p className="text-3xl font-black text-blue-600 mb-1">{semesters.length}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Semesters</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 border-2 border-black dark:border-white/10 p-6 rounded-3xl text-center">
                    <p className="text-3xl font-black text-green-600 mb-1">{books.filter(b => b.status === 'completed').length}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Books</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/10 border-2 border-black dark:border-orange-500/20 p-6 rounded-3xl text-center">
                    <p className="text-3xl font-black text-orange-600 mb-1">{profile?.streak || 0}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Streak</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/10 border-2 border-black dark:border-yellow-500/20 p-6 rounded-3xl text-center">
                    <p className="text-3xl font-black text-yellow-600 mb-1">{profile?.nexCoins || 0}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">NexCoins</p>
                  </div>
                </div>

                <div className="mb-10 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-2xl border border-white/30">
                      <Trophy size={24} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Current Level</p>
                      <h4 className="text-xl font-black italic uppercase">{profile?.level || 'Aspirant'}</h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Next Level at</p>
                    <p className="font-black">{(Math.floor((profile?.nexCoins || 0) / 100) + 1) * 100} Coins</p>
                  </div>
                </div>

                {/* Settings Section */}
                <div className="mb-10 text-left p-8 border-2 border-black dark:border-white/10 rounded-[2rem] bg-gray-50 dark:bg-white/5">
                  <h4 className="text-lg font-black mb-6 flex items-center gap-2">
                    <Settings className="text-blue-600" />
                    App Settings
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1A1A1A] border-2 border-black dark:border-white/10 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          {theme === 'light' ? <Sun className="text-blue-600" size={18} /> : <Moon className="text-blue-400" size={18} />}
                        </div>
                        <div>
                          <p className="font-black text-sm">Theme Mode</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Current: {theme}</p>
                        </div>
                      </div>
                      <button 
                        onClick={toggleTheme}
                        className="px-4 py-2 bg-black dark:bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
                      >
                        Switch
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subscription Status */}
                <div className="mb-10 text-left p-8 border-2 border-black dark:border-white/10 rounded-[2rem] bg-gray-50 dark:bg-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-black flex items-center gap-2">
                      <ShieldCheck className="text-green-600" />
                      Status: {profile?.isPro ? 'Pro Member' : 'Free Trial'}
                    </h4>
                    {!profile?.isPro && profile?.trialEndsAt && (
                      <span className="text-xs font-black text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-500/20">
                        Ends in {Math.max(0, Math.ceil((new Date(profile.trialEndsAt.toDate()).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
                      </span>
                    )}
                  </div>
                  {profile?.subscriptionEndsAt && (
                    <p className="text-sm text-gray-500 font-bold">Expires: {format(new Date(profile.subscriptionEndsAt.toDate()), 'PPP')}</p>
                  )}
                </div>

                {!profile?.isPro && (
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-10 rounded-[2.5rem] text-white text-left relative overflow-hidden border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <h4 className="text-2xl font-black mb-2 flex items-center gap-2">
                      <Zap size={24} />
                      Upgrade to Pro
                    </h4>
                    <p className="text-blue-100 text-sm mb-8 leading-relaxed font-medium">
                      Get 90 days of unlimited access for only ₹99. 
                      Includes AI Superagent, Multiplayer Battles, and Unlimited Media.
                    </p>
                    <button 
                      onClick={handleUpgrade}
                      disabled={isUpgrading}
                      className="w-full py-5 bg-white text-blue-600 rounded-2xl font-black text-xl hover:bg-blue-50 transition-all active:scale-95 shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isUpgrading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Pay ₹99 for 90 Days'}
                    </button>
                    <button 
                      onClick={() => window.open('https://rzp.io/rzp/MuBQ98E4', '_blank')}
                      className="w-full mt-4 py-4 bg-white/20 text-white border-2 border-white/40 rounded-2xl font-black text-lg hover:bg-white/30 transition-all flex items-center justify-center gap-3"
                    >
                      <CreditCard size={20} />
                      Pay via Direct Link
                    </button>
                    <button 
                      onClick={() => setIsManualPaymentOpen(true)}
                      className="w-full mt-4 py-3 bg-transparent text-white border-2 border-white/30 rounded-2xl font-black text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <History size={18} />
                      Pay via UPI (Manual)
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'whiz' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="whiz">
              <WhizLink uid={user.uid} userDisplayName={profile?.displayName || user.displayName || 'Student'} streak={profile?.streak || 0} />
            </motion.div>
          )}

          {activeTab === 'bounty' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="bounty">
              <BountySystem />
            </motion.div>
          )}

          {activeTab === 'feed' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="feed">
              <DoubtBusterFeed />
            </motion.div>
          )}

          {activeTab === 'notes' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} key="notes">
              {profile?.isPro ? (
                <StudyNotes />
              ) : (
                <ProLockScreen feature="AI Study Notes" onUpgrade={() => setActiveTab('profile')} />
              )}
            </motion.div>
          )}
          </AnimatePresence>
        )}
        </Suspense>
      </main>

      {/* Modals */}
      <Modal isOpen={isAddSemesterOpen} onClose={() => setIsAddSemesterOpen(false)} title="New Semester">
        <form onSubmit={addSemester} className="space-y-6">
          <Input label="Semester Name" placeholder="e.g. Fall 2024" value={newSemName} onChange={setNewSemName} required />
          <Input label="Academic Year" placeholder="e.g. 2024-2025" value={newSemYear} onChange={setNewSemYear} required />
          <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">Create Semester</button>
        </form>
      </Modal>

      <Modal isOpen={isAddBookOpen} onClose={() => setIsAddBookOpen(false)} title="Add Textbook">
        <form onSubmit={addBook} className="space-y-6">
          <Input label="Book Title" placeholder="e.g. Introduction to Algorithms" value={newBookTitle} onChange={setNewBookTitle} required />
          <Input label="Author" placeholder="e.g. Thomas H. Cormen" value={newBookAuthor} onChange={setNewBookAuthor} />
          <Input label="Resource Link" placeholder="https://..." value={newBookLink} onChange={setNewBookLink} type="url" />
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Notes</label>
            <textarea 
              value={newBookNotes} 
              onChange={(e) => setNewBookNotes(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all min-h-[120px]"
            />
          </div>
          <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">Add to Semester</button>
        </form>
      </Modal>

      <Modal isOpen={isManualPaymentOpen} onClose={() => setIsManualPaymentOpen(false)} title="Manual Payment">
        <div className="space-y-6">
          <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl text-center">
            <p className="text-sm font-bold text-blue-800 mb-2">Scan QR or pay to UPI ID:</p>
            <p className="text-2xl font-black text-blue-600">nextext@upi</p>
            <p className="text-xs font-bold text-blue-400 mt-2">Amount: ₹99</p>
            
            <div className="mt-4 pt-4 border-t border-blue-100">
              <p className="text-xs font-bold text-gray-400 mb-2">OR USE DIRECT LINK</p>
              <a 
                href="https://rzp.io/rzp/MuBQ98E4" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 font-black hover:underline"
              >
                <ExternalLink size={14} />
                rzp.io/rzp/MuBQ98E4
              </a>
            </div>
          </div>
          
          <form onSubmit={handleManualPayment} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">UTR / Transaction ID</label>
              <input 
                type="text"
                required
                value={manualUtr}
                onChange={(e) => setManualUtr(e.target.value)}
                placeholder="Enter 12-digit UTR number"
                className="w-full p-4 bg-gray-50 border-2 border-black rounded-2xl font-bold focus:ring-0 outline-none"
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmittingUtr}
              className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
            >
              {isSubmittingUtr ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 size={20} />}
              Submit for Approval
            </button>
          </form>
          <p className="text-[10px] text-gray-400 font-bold text-center">
            Manual approval usually takes 2-4 hours. Once approved, your Pro features will be unlocked automatically.
          </p>
        </div>
      </Modal>

      <Modal isOpen={isPhoneAuthOpen} onClose={() => setIsPhoneAuthOpen(false)} title="Phone Authentication">
        <div className="space-y-6">
          {!confirmationResult ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                <input 
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full p-4 bg-gray-50 border-2 border-black rounded-2xl font-bold focus:ring-0 outline-none"
                />
                <p className="text-[10px] text-gray-400 font-bold">Include country code (e.g., +91 for India)</p>
              </div>
              <button 
                type="submit" 
                disabled={isSendingCode}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
              >
                {isSendingCode ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send size={20} />}
                Send Verification Code
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Verification Code</label>
                <input 
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="6-digit code"
                  className="w-full p-4 bg-gray-50 border-2 border-black rounded-2xl font-bold focus:ring-0 outline-none text-center tracking-[1em]"
                  maxLength={6}
                />
              </div>
              <button 
                type="submit" 
                disabled={isVerifyingCode}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                {isVerifyingCode ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 size={20} />}
                Verify & Sign In
              </button>
              <button 
                type="button"
                onClick={() => setConfirmationResult(null)}
                className="w-full py-2 text-gray-400 font-bold text-sm hover:text-black transition-all"
              >
                Change Phone Number
              </button>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}

// --- UI Components ---
function NavBtn({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-6 py-4 border-2 transition-all group ${
        active 
          ? 'bg-black dark:bg-blue-600 text-white border-black dark:border-blue-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] font-black' 
          : 'text-gray-500 border-transparent hover:border-black dark:hover:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
      }`}
    >
      <Icon size={20} className={active ? 'text-white' : 'text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors'} />
      <span className="text-sm">{label}</span>
    </button>
  );
}

function StatusBadge({ status, onClick }: { status: Book['status'], onClick?: () => void }) {
  const config = {
    'to-read': { label: 'To Read', color: 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400' },
    'reading': { label: 'Reading', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    'completed': { label: 'Completed', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  };
  return (
    <button onClick={onClick} className={`px-4 py-1.5 border-2 border-black dark:border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${config[status].color}`}>
      {config[status].label}
    </button>
  );
}

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 rounded-[3rem] p-12 w-full max-w-xl relative z-10 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_rgba(255,255,255,0.1)]">
            <h3 className="text-3xl font-black tracking-tight mb-8 italic dark:text-white">{title}</h3>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Input({ label, value, onChange, ...props }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</label>
      <input 
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-2 border-black dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] dark:text-white"
      />
    </div>
  );
}

function ProLockScreen({ feature, onUpgrade }: { feature: string, onUpgrade: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-[#111111] border-4 border-black dark:border-white/10 p-12 rounded-[3rem] shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] dark:shadow-[16px_16px_0px_0px_rgba(255,255,255,0.1)] text-center">
        <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-black dark:border-white/10">
          <Zap size={48} className="text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="text-3xl font-black mb-4 italic">Pro Feature</h3>
        <p className="text-gray-500 dark:text-gray-400 font-bold mb-10 leading-relaxed">
          <span className="text-black dark:text-white font-black">{feature}</span> is only available for Pro Members. 
          Upgrade now to unlock unlimited access!
        </p>
        <button 
          onClick={onUpgrade}
          className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
        >
          <Sparkles size={24} />
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NextextApp />
    </AuthProvider>
  );
}
