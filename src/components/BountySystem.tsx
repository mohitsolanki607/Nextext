import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Gift, 
  Users, 
  CreditCard, 
  Copy, 
  CheckCircle2, 
  Share2, 
  Zap, 
  Trophy,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  increment,
  getDoc,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { addDays } from 'date-fns';

export function BountySystem() {
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchReferrals = async () => {
      try {
        const q = query(
          collection(db, 'referrals'),
          where('referrerUid', '==', user.uid)
        );
        const snap = await getDocs(q);
        setReferrals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching referrals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [user]);

  const referralLink = `${window.location.origin}?ref=${profile?.referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const successfulProReferrals = referrals.filter(r => r.status === 'pro').length;
  const totalReferrals = referrals.length;

  const canClaim = successfulProReferrals >= 10;

  const handleClaim = async () => {
    if (!canClaim || !user || !profile) return;
    
    setIsClaiming(true);
    setClaimError(null);
    
    try {
      // Logic: Grant 1 year Pro
      const userRef = doc(db, 'users', user.uid);
      const currentExpiry = profile.subscriptionEndsAt?.toDate() || new Date();
      const newExpiry = addDays(currentExpiry > new Date() ? currentExpiry : new Date(), 365);
      
      await updateDoc(userRef, {
        isPro: true,
        subscriptionEndsAt: newExpiry,
      });
      
      alert('Congratulations! You have been granted 1 YEAR of Pro access! 🎉');
    } catch (err) {
      console.error('Error claiming bounty:', err);
      setClaimError('Failed to claim bounty. Please try again later.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-5xl font-black tracking-tighter mb-2 italic flex items-center gap-4">
          <Gift size={48} className="text-pink-500" />
          Bounty Program
        </h2>
        <p className="text-gray-400 font-bold text-lg">Refer friends and earn free Pro access!</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Referral Code Card */}
        <div className="lg:col-span-2 bg-white border-4 border-black rounded-[3rem] p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-2xl font-black mb-6 italic">Your Referral Link</h3>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1 bg-gray-50 border-2 border-black p-4 rounded-2xl font-mono font-bold text-gray-500 break-all">
              {referralLink}
            </div>
            <button 
              onClick={copyLink}
              className="bg-black text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-105 transition-transform active:scale-95"
            >
              {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
              {copied ? 'COPIED' : 'COPY'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-blue-50 border-2 border-black p-6 rounded-[2rem] flex items-center gap-4">
              <div className="bg-blue-600 text-white p-3 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Referred</p>
                <p className="text-3xl font-black">{totalReferrals}</p>
              </div>
            </div>
            <div className="bg-green-50 border-2 border-black p-6 rounded-[2rem] flex items-center gap-4">
              <div className="bg-green-600 text-white p-3 rounded-xl">
                <CreditCard size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pro Referrals</p>
                <p className="text-3xl font-black">{successfulProReferrals}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bounty Progress Card */}
        <div className="bg-yellow-400 border-4 border-black rounded-[3rem] p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col">
          <h3 className="text-2xl font-black mb-6 italic">Active Bounty</h3>
          <div className="space-y-6 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold">10 Friends Buy Pro</span>
              <span className="font-black">{successfulProReferrals}/10</span>
            </div>
            <div className="h-3 bg-black/10 rounded-full overflow-hidden border-2 border-black">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (successfulProReferrals / 10) * 100)}%` }}
                className="h-full bg-black"
              />
            </div>

            <div className="bg-white/30 p-6 rounded-2xl border-2 border-black/20 mt-8">
              <p className="text-sm font-bold leading-tight">
                Reward: <span className="font-black">1 Year FREE Pro Access</span>
              </p>
            </div>
          </div>

          <button 
            onClick={handleClaim}
            disabled={!canClaim || isClaiming}
            className={`w-full mt-8 py-4 rounded-2xl font-black text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 ${
              canClaim 
                ? 'bg-black text-white hover:-translate-y-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none' 
                : 'bg-white text-black/30 cursor-not-allowed'
            }`}
          >
            {isClaiming ? <Loader2 className="animate-spin" /> : 'CLAIM BOUNTY'}
          </button>
          {claimError && (
            <p className="text-red-600 text-xs font-bold mt-2 text-center flex items-center justify-center gap-1">
              <AlertCircle size={12} />
              {claimError}
            </p>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white border-4 border-black rounded-[3rem] p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-3xl font-black mb-10 italic text-center">How to earn your bounty?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="text-center space-y-4">
            <div className="bg-blue-100 w-20 h-20 rounded-3xl border-2 border-black flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Share2 size={32} className="text-blue-600" />
            </div>
            <h4 className="text-xl font-black italic">1. Share Link</h4>
            <p className="text-sm font-bold text-gray-400">Send your unique link to your study group or friends.</p>
          </div>
          <div className="text-center space-y-4">
            <div className="bg-purple-100 w-20 h-20 rounded-3xl border-2 border-black flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Users size={32} className="text-purple-600" />
            </div>
            <h4 className="text-xl font-black italic">2. Friends Join</h4>
            <p className="text-sm font-bold text-gray-400">Encourage your friends to join and excel in their studies.</p>
          </div>
          <div className="text-center space-y-4">
            <div className="bg-green-100 w-20 h-20 rounded-3xl border-2 border-black flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Zap size={32} className="text-green-600" />
            </div>
            <h4 className="text-xl font-black italic">3. Get Rewarded</h4>
            <p className="text-sm font-bold text-gray-400">Once 10 friends upgrade to Pro, claim your 1 year free!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
