import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User as UserIcon,
  Mail,
  Hash,
  ArrowLeft,
  Loader2,
  AlertCircle,
  MessageSquare,
  Users,
  TrendingUp,
  Camera,
  Bell,
  Settings,
  ShieldAlert,
  Eye,
  CreditCard
} from 'lucide-react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp, getDocs, orderBy, limit, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface PendingPayment {
  id: string;
  uid: string;
  email: string;
  utr: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

interface Complaint {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved';
  createdAt: any;
}

interface Student {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  isPro: boolean;
  role?: 'user' | 'admin';
  subscriptionEndsAt?: any;
  createdAt: any;
}

interface Snap {
  id: string;
  uid: string;
  email: string;
  mode: string;
  imageUrl: string;
  result: string;
  createdAt: any;
}

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const { user, profile } = useAuth();
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'payments' | 'complaints' | 'snaps' | 'controls'>('dashboard');
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [topSubject, setTopSubject] = useState('N/A');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [editingUser, setEditingUser] = useState<Student | null>(null);
  
  // Pagination
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 10;
  const [snapPage, setSnapPage] = useState(1);
  const snapsPerPage = 9;
  
  // Controls state
  const [globalNotification, setGlobalNotification] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isSavingControls, setIsSavingControls] = useState(false);

  const isAdmin = user?.email === 'msolanki80979@gmail.com' || profile?.role === 'admin';

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    setLoading(true);
    
    // Payments
    const qPayments = query(
      collection(db, 'pending_payments'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const unsubPayments = onSnapshot(qPayments, (snap) => {
      setPendingPayments(snap.docs.map(d => ({ id: d.id, ...d.data() } as PendingPayment)));
    });

    // Complaints
    const qComplaints = query(
      collection(db, 'complaints'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const unsubComplaints = onSnapshot(qComplaints, (snap) => {
      setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() } as Complaint)));
    });

    // Students
    const qStudents = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Student)));
      setLoading(false);
    });

    // Snaps
    const qSnaps = query(collection(db, 'snaps'), orderBy('createdAt', 'desc'), limit(100));
    const unsubSnaps = onSnapshot(qSnaps, (snap) => {
      setSnaps(snap.docs.map(d => ({ id: d.id, ...d.data() } as Snap)));
    });

    // Top Subject from Doubt Posts
    const qDoubt = query(collection(db, 'doubt_posts'), limit(100));
    const unsubDoubt = onSnapshot(qDoubt, (snap) => {
      const subjects: Record<string, number> = {};
      snap.docs.forEach(d => {
        const sub = d.data().subject;
        if (sub) subjects[sub] = (subjects[sub] || 0) + 1;
      });
      const top = Object.entries(subjects).sort((a, b) => b[1] - a[1])[0];
      if (top) setTopSubject(top[0]);
    });

    // Config
    const unsubConfig = onSnapshot(doc(db, 'app_config', 'settings'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setGlobalNotification(data.globalNotification || '');
        setMaintenanceMode(data.maintenanceMode || false);
      }
    });

    return () => {
      unsubPayments();
      unsubComplaints();
      unsubStudents();
      unsubSnaps();
      unsubDoubt();
      unsubConfig();
    };
  }, [isAuthenticated]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('Access Denied. You do not have admin privileges.');
      return;
    }
    if (pin === '2600') {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Invalid PIN. Access Denied.');
      setPin('');
    }
  };

  const approvePayment = async (payment: PendingPayment) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'pending_payments', payment.id), {
        status: 'approved',
        approvedAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'users', payment.uid), {
        isPro: true,
        subscriptionEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      });
      setLoading(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pending_payments/${payment.id}`);
      setLoading(false);
    }
  };

  const rejectPayment = async (paymentId: string) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'pending_payments', paymentId), {
        status: 'rejected',
        rejectedAt: serverTimestamp()
      });
      setLoading(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pending_payments/${paymentId}`);
      setLoading(false);
    }
  };

  const resolveComplaint = async (complaintId: string) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'complaints', complaintId), {
        status: 'resolved',
        resolvedAt: serverTimestamp()
      });
      setLoading(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `complaints/${complaintId}`);
      setLoading(false);
    }
  };

  const saveControls = async () => {
    setIsSavingControls(true);
    try {
      await setDoc(doc(db, 'app_config', 'settings'), {
        globalNotification,
        maintenanceMode,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setIsSavingControls(false);
    } catch (err) {
      console.error('Error saving controls:', err);
      setIsSavingControls(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
    (s.displayName || '').toLowerCase().includes(searchEmail.toLowerCase())
  );

  const paginatedStudents = filteredStudents.slice(
    (userPage - 1) * usersPerPage,
    userPage * usersPerPage
  );

  const paginatedSnaps = snaps.slice(
    (snapPage - 1) * snapsPerPage,
    snapPage * snapsPerPage
  );

  const updateUser = async (uid: string, data: Partial<Student>) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', uid), data);
      setEditingUser(null);
      setLoading(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      setLoading(false);
    }
  };

  const totalPro = students.filter(s => s.isPro).length;
  const totalRevenue = totalPro * 99;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white border-4 border-black p-10 rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center"
        >
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-black">
            <ShieldCheck size={40} className="text-blue-600" />
          </div>
          <h2 className="text-3xl font-black mb-2">Admin Access</h2>
          <p className="text-gray-500 font-bold mb-8">Enter Master Key to continue</p>
          
          <form onSubmit={handlePinSubmit} className="space-y-6">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              maxLength={4}
              className="w-full text-center text-4xl tracking-[1rem] font-black py-6 border-4 border-black rounded-2xl focus:ring-0 focus:border-blue-600 outline-none"
              autoFocus
            />
            {error && (
              <p className="text-red-500 font-black flex items-center justify-center gap-2">
                <ShieldAlert size={18} />
                {error}
              </p>
            )}
            <button 
              type="submit"
              className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl hover:bg-gray-800 transition-all active:scale-95"
            >
              Unlock Panel
            </button>
          </form>
          
          <button 
            onClick={onBack}
            className="mt-8 text-gray-400 font-black hover:text-black transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft size={18} />
            Back to App
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-black flex items-center gap-4">
              <ShieldCheck size={40} className="text-blue-600" />
              NexText Admin
            </h1>
            <p className="text-gray-500 font-bold mt-2">Comprehensive Management Dashboard</p>
          </div>
          <button 
            onClick={onBack}
            className="px-6 py-3 border-4 border-black rounded-2xl font-black hover:bg-gray-100 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Exit Admin
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white border-4 border-black p-6 rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-2">
              <Users className="text-blue-600" size={20} />
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Total Users</p>
            </div>
            <p className="text-4xl font-black">{students.length}</p>
          </div>
          <div className="bg-white border-4 border-black p-6 rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-green-600" size={20} />
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Total Revenue</p>
            </div>
            <p className="text-4xl font-black text-green-600">₹{totalRevenue}</p>
          </div>
          <div className="bg-white border-4 border-black p-6 rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-2">
              <Search className="text-purple-600" size={20} />
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Top Subject</p>
            </div>
            <p className="text-4xl font-black text-purple-600">{topSubject}</p>
          </div>
          <div className="bg-white border-4 border-black p-6 rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="text-orange-600" size={20} />
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Pro Users</p>
            </div>
            <p className="text-4xl font-black text-orange-600">{totalPro}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { id: 'dashboard', label: 'Overview', icon: TrendingUp },
            { id: 'users', label: 'Students', icon: Users },
            { id: 'payments', label: 'Payments', icon: CreditCard, count: pendingPayments.length },
            { id: 'complaints', label: 'Complaints', icon: MessageSquare, count: complaints.length },
            { id: 'snaps', label: 'Latest Snaps', icon: Camera },
            { id: 'controls', label: 'Controls', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl font-black text-sm border-4 border-black transition-all flex items-center gap-2 ${
                activeTab === tab.id 
                  ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]' 
                  : 'bg-white text-black hover:bg-gray-50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="bg-white border-4 border-black p-8 rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                  <Clock className="text-blue-600" />
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {students.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 border-2 border-black rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border-2 border-black">
                          <UserIcon size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-black text-sm">{s.displayName || s.email.split('@')[0]}</p>
                          <p className="text-[10px] text-gray-400 font-bold">Joined {s.createdAt?.toDate ? new Date(s.createdAt.toDate()).toLocaleDateString() : 'Recently'}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border-2 border-black ${s.isPro ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {s.isPro ? 'Pro' : 'Trial'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border-4 border-black p-8 rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
                  <ShieldAlert className="text-red-600" />
                  Urgent Actions
                </h3>
                <div className="space-y-4">
                  {pendingPayments.length > 0 && (
                    <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-xl flex items-center justify-between">
                      <p className="font-black text-orange-700">{pendingPayments.length} Pending Payments</p>
                      <button onClick={() => setActiveTab('payments')} className="text-xs font-black underline">Review Now</button>
                    </div>
                  )}
                  {complaints.length > 0 && (
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center justify-between">
                      <p className="font-black text-red-700">{complaints.length} Unresolved Complaints</p>
                      <button onClick={() => setActiveTab('complaints')} className="text-xs font-black underline">Review Now</button>
                    </div>
                  )}
                  {pendingPayments.length === 0 && complaints.length === 0 && (
                    <div className="text-center py-12">
                      <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                      <p className="font-black text-gray-400">Everything is under control!</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div 
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-4 border-black rounded-[2.5rem] overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="p-8 border-b-4 border-black bg-gray-50 flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <Users className="text-blue-600" />
                  Student Directory ({filteredStudents.length})
                </h3>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search by email..."
                    value={searchEmail}
                    onChange={(e) => {
                      setSearchEmail(e.target.value);
                      setUserPage(1);
                    }}
                    className="pl-12 pr-6 py-3 border-4 border-black rounded-xl font-bold focus:ring-0 outline-none w-64"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b-4 border-black">
                      <th className="px-8 py-6 font-black text-sm uppercase tracking-widest text-gray-400">Student</th>
                      <th className="px-8 py-6 font-black text-sm uppercase tracking-widest text-gray-400">Email</th>
                      <th className="px-8 py-6 font-black text-sm uppercase tracking-widest text-gray-400">Join Date</th>
                      <th className="px-8 py-6 font-black text-sm uppercase tracking-widest text-gray-400">Status</th>
                      <th className="px-8 py-6 font-black text-sm uppercase tracking-widest text-gray-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-4 divide-black">
                    {paginatedStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-8 py-6 font-black">
                          <div className="flex items-center gap-2">
                            {s.displayName || 'Anonymous'}
                            {s.role === 'admin' && <ShieldCheck size={14} className="text-blue-600" />}
                          </div>
                        </td>
                        <td className="px-8 py-6 font-bold text-gray-500">{s.email}</td>
                        <td className="px-8 py-6 font-bold text-gray-500">
                          {s.createdAt?.toDate ? new Date(s.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase border-2 border-black ${s.isPro ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {s.isPro ? 'Pro' : 'Trial'}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button 
                            onClick={() => setEditingUser(s)}
                            className="px-4 py-2 bg-black text-white rounded-xl font-black text-xs hover:bg-gray-800 transition-all"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              <div className="p-6 bg-gray-50 border-t-4 border-black flex items-center justify-between">
                <p className="text-sm font-bold text-gray-500">
                  Showing {(userPage - 1) * usersPerPage + 1} to {Math.min(userPage * usersPerPage, filteredStudents.length)} of {filteredStudents.length}
                </p>
                <div className="flex gap-2">
                  <button 
                    disabled={userPage === 1}
                    onClick={() => setUserPage(p => p - 1)}
                    className="px-4 py-2 border-2 border-black rounded-lg font-black disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button 
                    disabled={userPage * usersPerPage >= filteredStudents.length}
                    onClick={() => setUserPage(p => p + 1)}
                    className="px-4 py-2 border-2 border-black rounded-lg font-black disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* User Edit Modal */}
          <AnimatePresence>
            {editingUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white border-4 border-black p-8 rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md"
                >
                  <h3 className="text-2xl font-black mb-6">Edit Student</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">Display Name</label>
                      <p className="font-black text-lg">{editingUser.displayName || 'Anonymous'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">Email</label>
                      <p className="font-bold text-gray-500">{editingUser.email}</p>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-black rounded-xl">
                      <div>
                        <p className="font-black">Pro Status</p>
                        <p className="text-xs text-gray-500 font-bold">Access to all AI features</p>
                      </div>
                      <button 
                        onClick={() => setEditingUser({ ...editingUser, isPro: !editingUser.isPro })}
                        className={`w-12 h-6 rounded-full border-2 border-black transition-all relative ${editingUser.isPro ? 'bg-green-500' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white border-2 border-black rounded-full transition-all ${editingUser.isPro ? 'left-7' : 'left-0.5'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-black rounded-xl">
                      <div>
                        <p className="font-black">Admin Role</p>
                        <p className="text-xs text-gray-500 font-bold">Access to this panel</p>
                      </div>
                      <button 
                        onClick={() => setEditingUser({ ...editingUser, role: editingUser.role === 'admin' ? 'user' : 'admin' })}
                        className={`w-12 h-6 rounded-full border-2 border-black transition-all relative ${editingUser.role === 'admin' ? 'bg-blue-500' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white border-2 border-black rounded-full transition-all ${editingUser.role === 'admin' ? 'left-7' : 'left-0.5'}`} />
                      </button>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button 
                        onClick={() => setEditingUser(null)}
                        className="flex-1 py-4 border-4 border-black rounded-xl font-black hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => updateUser(editingUser.id, { 
                          isPro: editingUser.isPro, 
                          role: editingUser.role || 'user',
                          subscriptionEndsAt: editingUser.isPro ? (editingUser.subscriptionEndsAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) : null
                        })}
                        className="flex-1 py-4 bg-black text-white rounded-xl font-black hover:bg-gray-800 transition-all"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {activeTab === 'payments' && (
            <motion.div 
              key="payments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-4 border-black rounded-[2.5rem] overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="p-8 border-b-4 border-black bg-orange-50 flex items-center justify-between">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <CreditCard className="text-orange-600" />
                  Pending Approvals
                </h3>
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 border-2 border-yellow-400 rounded-xl text-yellow-800 font-black text-xs animate-pulse">
                  <ShieldAlert size={16} />
                  CHECK PHONEPE BEFORE APPROVING
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b-4 border-black">
                      <th className="px-8 py-6 font-black text-sm uppercase tracking-widest text-gray-400">User</th>
                      <th className="px-8 py-6 font-black text-sm uppercase tracking-widest text-gray-400">UTR Number</th>
                      <th className="px-8 py-6 font-black text-sm uppercase tracking-widest text-gray-400">Date</th>
                      <th className="px-8 py-6 font-black text-sm uppercase tracking-widest text-gray-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-4 divide-black">
                    {pendingPayments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                          <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                          <p className="text-xl font-black text-gray-400">No pending payments to verify.</p>
                        </td>
                      </tr>
                    ) : (
                      pendingPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-6 font-black">{p.email}</td>
                          <td className="px-8 py-6">
                            <span className="font-mono font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-lg border-2 border-blue-100">
                              {p.utr}
                            </span>
                          </td>
                          <td className="px-8 py-6 font-bold text-gray-500">
                            {p.createdAt?.toDate ? new Date(p.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center justify-end gap-3">
                              <button 
                                onClick={() => rejectPayment(p.id)}
                                className="p-3 text-red-600 hover:bg-red-50 rounded-xl border-2 border-transparent hover:border-red-200 transition-all"
                              >
                                <XCircle size={24} />
                              </button>
                              <button 
                                onClick={() => approvePayment(p)}
                                className="px-6 py-3 bg-green-600 text-white rounded-xl font-black flex items-center gap-2 hover:bg-green-700 transition-all active:scale-95"
                              >
                                <CheckCircle2 size={20} />
                                Approve Payment
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'complaints' && (
            <motion.div 
              key="complaints"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-4 border-black rounded-[2.5rem] overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="p-8 border-b-4 border-black bg-red-50">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <MessageSquare className="text-red-600" />
                  Student Complaints
                </h3>
              </div>
              <div className="divide-y-4 divide-black">
                {complaints.length === 0 ? (
                  <div className="px-8 py-20 text-center">
                    <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                    <p className="text-xl font-black text-gray-400">No pending complaints!</p>
                  </div>
                ) : (
                  complaints.map((c) => (
                    <div key={c.id} className="p-8 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-red-100 text-red-700 border-2 border-red-200 rounded-full text-[10px] font-black uppercase">
                              {c.subject}
                            </span>
                            <span className="text-xs text-gray-400 font-bold">
                              {c.createdAt?.toDate ? new Date(c.createdAt.toDate()).toLocaleString() : 'Just now'}
                            </span>
                          </div>
                          <h4 className="text-xl font-black mb-2">{c.displayName} ({c.email})</h4>
                          <p className="bg-gray-100 border-2 border-black p-6 rounded-2xl font-medium text-gray-700">
                            {c.message}
                          </p>
                        </div>
                        <button
                          onClick={() => resolveComplaint(c.id)}
                          className="px-6 py-3 bg-black text-white rounded-xl font-black flex items-center gap-2 hover:bg-gray-800 transition-all active:scale-95"
                        >
                          <CheckCircle2 size={20} />
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'snaps' && (
            <div className="space-y-8">
              <motion.div 
                key="snaps"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {paginatedSnaps.map((snap) => (
                  <div key={snap.id} className="bg-white border-4 border-black rounded-[2rem] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group">
                    <div className="relative h-48 overflow-hidden border-b-4 border-black">
                      <img src={snap.imageUrl} alt="Snap" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase rounded-full">
                          {snap.mode}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="font-black text-sm mb-1">{snap.email.split('@')[0]}</p>
                      <p className="text-[10px] text-gray-400 font-bold mb-4">
                        {snap.createdAt?.toDate ? new Date(snap.createdAt.toDate()).toLocaleString() : 'Recently'}
                      </p>
                      <div className="text-xs text-gray-600 line-clamp-3 font-medium bg-gray-50 p-3 rounded-xl border-2 border-black/5">
                        {snap.result}
                      </div>
                    </div>
                  </div>
                ))}
                {snaps.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white border-4 border-black rounded-[2rem]">
                    <Camera size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="font-black text-gray-400">No snaps recorded yet.</p>
                  </div>
                )}
              </motion.div>

              {/* Snaps Pagination */}
              {snaps.length > snapsPerPage && (
                <div className="flex items-center justify-center gap-4">
                  <button 
                    disabled={snapPage === 1}
                    onClick={() => setSnapPage(p => p - 1)}
                    className="px-6 py-3 border-4 border-black rounded-xl font-black disabled:opacity-50 hover:bg-gray-50 transition-all"
                  >
                    Previous
                  </button>
                  <span className="font-black">Page {snapPage} of {Math.ceil(snaps.length / snapsPerPage)}</span>
                  <button 
                    disabled={snapPage * snapsPerPage >= snaps.length}
                    onClick={() => setSnapPage(p => p + 1)}
                    className="px-6 py-3 border-4 border-black rounded-xl font-black disabled:opacity-50 hover:bg-gray-50 transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'controls' && (
            <motion.div 
              key="controls"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="bg-white border-4 border-black p-8 rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                  <Bell className="text-blue-600" />
                  Emergency Controls
                </h3>
                
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-sm font-black uppercase tracking-widest text-gray-400">Global Notification</label>
                    <textarea 
                      value={globalNotification}
                      onChange={(e) => setGlobalNotification(e.target.value)}
                      placeholder="Type a message for all students..."
                      className="w-full p-6 border-4 border-black rounded-2xl font-bold focus:ring-0 outline-none h-32 resize-none"
                    />
                    <p className="text-xs text-gray-400 font-bold italic">This will appear at the top of every student's app.</p>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-red-50 border-4 border-black rounded-2xl">
                    <div>
                      <h4 className="font-black text-lg text-red-700 flex items-center gap-2">
                        <ShieldAlert size={20} />
                        Maintenance Mode
                      </h4>
                      <p className="text-sm text-red-600 font-bold">Temporarily pause AI features for updates.</p>
                    </div>
                    <button 
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                      className={`w-16 h-8 rounded-full border-2 border-black transition-all relative ${maintenanceMode ? 'bg-red-500' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white border-2 border-black rounded-full transition-all ${maintenanceMode ? 'left-9' : 'left-1'}`} />
                    </button>
                  </div>

                  <button 
                    onClick={saveControls}
                    disabled={isSavingControls}
                    className="w-full py-5 bg-black text-white rounded-2xl font-black text-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    {isSavingControls ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                    Save All Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
