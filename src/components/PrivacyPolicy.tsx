import React from 'react';
import { motion } from 'motion/react';
import { Shield, ArrowLeft, Lock, Eye, FileText, Globe, Mail } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b-2 border-black px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 font-black text-sm uppercase tracking-widest hover:text-blue-600 transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to App
          </button>
          <div className="flex items-center gap-2">
            <Shield className="text-blue-600" size={24} />
            <h1 className="font-black text-xl italic tracking-tighter">Privacy Policy</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-[2rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
              <Lock className="text-white" size={32} />
            </div>
            <h2 className="text-5xl font-black italic tracking-tighter">Your Privacy Matters.</h2>
            <p className="text-xl text-gray-500 font-bold max-w-2xl mx-auto">
              At NexText, we believe your data is your property. We've built our platform with security and transparency at its core.
            </p>
            <p className="text-sm text-gray-400 font-black uppercase tracking-widest">Last Updated: March 26, 2026</p>
          </section>

          {/* Policy Content */}
          <div className="grid gap-8">
            <PolicyCard 
              icon={<Eye size={24} />}
              title="Information We Collect"
              content="We collect information you provide directly to us, such as when you create an account, upload study materials, or interact with our AI. This includes your name, email address, and the content you process through NexText."
            />
            
            <PolicyCard 
              icon={<FileText size={24} />}
              title="How We Use Your Data"
              content="Your data is used exclusively to provide and improve NexText services. We use your study materials to generate summaries, quizzes, and insights. We do not sell your personal information to third parties."
            />

            <PolicyCard 
              icon={<Globe size={24} />}
              title="Data Storage & Security"
              content="We use industry-standard encryption and secure cloud infrastructure (Firebase) to protect your data. Your academic materials are stored securely and are only accessible by you unless you explicitly choose to share them."
            />

            <PolicyCard 
              icon={<Shield size={24} />}
              title="AI Processing"
              content="NexText uses advanced AI models to process your text. While we use your input to generate responses, we do not use your private study materials to train global AI models without your explicit consent."
            />
          </div>

          {/* Contact Section */}
          <section className="bg-black text-white p-12 rounded-[3rem] shadow-[16px_16px_0px_0px_rgba(59,130,246,0.5)] relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-3xl font-black italic mb-6">Questions?</h3>
              <p className="text-gray-400 font-bold mb-8 max-w-lg">
                If you have any questions about this Privacy Policy or how we handle your data, please reach out to our privacy team.
              </p>
              <a 
                href="mailto:privacy@nextext.ai" 
                className="inline-flex items-center gap-3 bg-blue-600 px-8 py-4 rounded-2xl font-black hover:bg-blue-700 transition-all active:scale-95"
              >
                <Mail size={20} />
                Contact Support
              </a>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          </section>
        </motion.div>
      </main>

      <footer className="border-t-2 border-black py-12 px-6 text-center">
        <p className="text-gray-400 font-bold text-sm">
          &copy; 2026 NexText AI. All rights reserved. Built for students, by students.
        </p>
      </footer>
    </div>
  );
}

function PolicyCard({ icon, title, content }: { icon: React.ReactNode, title: string, content: string }) {
  return (
    <div className="bg-white border-4 border-black p-8 rounded-[2.5rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
      <div className="flex items-start gap-6">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 border-2 border-black">
          {icon}
        </div>
        <div className="space-y-2">
          <h4 className="text-xl font-black italic">{title}</h4>
          <p className="text-gray-500 font-bold leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
}
