import React, { useState } from 'react';
import { Send, MessageSquare, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const ComplaintBox: React.FC = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to submit a complaint');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter your message');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'complaints'), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Anonymous',
        subject: subject.trim() || 'General Complaint',
        message: message.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      
      setIsSuccess(true);
      setSubject('');
      setMessage('');
      toast.success('Complaint submitted successfully!');
      
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border-4 border-black dark:border-zinc-800 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-100 dark:bg-red-900/30 border-2 border-black dark:border-zinc-800 rounded-lg">
          <MessageSquare className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-black dark:text-white uppercase tracking-tight">Complain Box</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Have a problem or suggestion? Let us know!</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 border-2 border-black dark:border-zinc-800 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-black dark:text-white mb-2">Submitted!</h3>
            <p className="text-zinc-600 dark:text-zinc-400">Our team will review your complaint soon.</p>
            <button
              onClick={() => setIsSuccess(false)}
              className="mt-6 px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-bold border-2 border-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Send Another
            </button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-bold text-black dark:text-white uppercase mb-1">Subject (Optional)</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., App Update, Technical Issue"
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 font-medium focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black dark:text-white uppercase mb-1">Your Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your problem or suggestion in detail..."
                rows={4}
                required
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 font-medium focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all resize-none"
              />
            </div>
            <div className="flex items-start gap-2 p-3 bg-zinc-100 dark:bg-zinc-800/50 border-2 border-black dark:border-zinc-700 rounded-lg">
              <AlertCircle className="w-5 h-5 text-zinc-600 dark:text-zinc-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Your complaint will be visible only to the administrators. We value your privacy and aim to resolve issues within 24-48 hours.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Complaint
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};
