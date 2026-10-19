import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, ShieldCheck, Trash2, Tag, Calendar, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Complaint {
  id: string;
  category: string;
  subject: string;
  message: string;
  createdAt: string;
}

const LOCAL_STORAGE_KEY = 'college_sis_v1_complaints';

export default function ComplaintsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [category, setCategory] = useState('General');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Load complaints from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setComplaints(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse complaints', e);
      }
    }
  }, []);

  const saveComplaints = (updated: Complaint[]) => {
    setComplaints(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    const newComplaint: Complaint = {
      id: 'cmp_' + Date.now(),
      category,
      subject,
      message,
      createdAt: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const updated = [newComplaint, ...complaints];
    saveComplaints(updated);

    // Reset Form
    setSubject('');
    setMessage('');
    setCategory('General');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const handleDelete = (id: string) => {
    const updated = complaints.filter((c) => c.id !== id);
    saveComplaints(updated);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-indigo-600/10 text-indigo-600 rounded-xl">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Anonymous Complaint & Suggestion Box
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isAdmin
              ? 'Admin Portal — Review and manage all anonymous feedback submitted by students and faculty.'
              : 'Submit feedback completely anonymously. Your identity is never stored.'}
          </p>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-3' : 'max-w-2xl mx-auto'} gap-8`}>
        {/* Submission Form Section */}
        <div className={`${isAdmin ? 'lg:col-span-1' : 'w-full'} bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm`}>
          <div className="flex items-center space-x-2 text-emerald-600 mb-4 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Encrypted & Anonymous</span>
          </div>

          {submitted && (
            <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm rounded-xl">
              Thank you! Your suggestion has been submitted anonymously to administration.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="General">General Suggestion</option>
                <option value="Academics">Academics & Teaching</option>
                <option value="Campus Facilities">Campus Facilities</option>
                <option value="Hostel & Food">Hostel & Food</option>
                <option value="Safety & Harassment">Safety & Harassment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                required
                placeholder="Brief summary of your feedback"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message / Details
              </label>
              <textarea
                required
                rows={5}
                placeholder="Describe your suggestion or complaint in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Submit Anonymously</span>
            </button>
          </form>
        </div>

        {/* ADMIN-ONLY Complaints List Section */}
        {isAdmin && (
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-between">
              <span>Submitted Feedback ({complaints.length})</span>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Admin View Only
              </span>
            </h2>

            {complaints.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No complaints or suggestions submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 mb-2">
                          <Tag className="w-3 h-3 mr-1" />
                          {item.category}
                        </span>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          {item.subject}
                        </h3>
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                      {item.message}
                    </p>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center text-xs text-gray-400 space-x-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Submitted on {item.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}