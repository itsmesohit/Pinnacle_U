import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DEMO_CREDENTIALS } from '@/lib/seedData';
import { getUserByEmail, getStudents, resetUserPassword } from '@/lib/dataService';
import {
  GraduationCap, ShieldCheck, UserCheck, BookOpen, Lock, Mail,
  ArrowRight, AlertCircle, Info, KeyRound, CheckCircle2, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('admin@college.edu');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const res = login(email, password);
      setIsLoading(false);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.error || 'Failed to authenticate');
      }
    }, 250);
  };

  const selectDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setSuccessMsg('');
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetEmail.trim()) {
      setResetError('Please enter your registered student or faculty email address.');
      return;
    }

    if (newPassword.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    const res = resetUserPassword(resetEmail.trim(), newPassword);
    if (!res.success) {
      setResetError(res.error || 'Could not find an account associated with this email.');
      return;
    }

    setResetSuccess('Password has been successfully updated! You can now log in.');
    setEmail(resetEmail.trim());
    setPassword(newPassword);

    setTimeout(() => {
      setIsForgotModalOpen(false);
      setSuccessMsg('Password updated! Ready to log in with your new password.');
      setResetEmail('');
      setNewPassword('');
      setConfirmPassword('');
      setResetSuccess('');
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-muted/30 px-4 py-8">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-[30%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 mb-3">
            <GraduationCap size={32} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Pinnacle College SIS</h1>
          <p className="text-sm text-muted-foreground mt-1">Enterprise Academic Management Platform</p>
        </div>

        {/* Demo Selector Buttons */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Demo Persona</span>
            <span className="text-[11px] font-medium text-primary">Click to prefill</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_CREDENTIALS.map(c => {
              const isSelected = email === c.email;
              const icons = {
                admin: <ShieldCheck size={16} className="text-indigo-500" />,
                teacher: <UserCheck size={16} className="text-emerald-500" />,
                student: <BookOpen size={16} className="text-amber-500" />,
              };
              return (
                <button
                  key={c.role}
                  type="button"
                  onClick={() => selectDemoAccount(c.email, c.password)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                      : "border-border/80 hover:bg-muted/50 hover:border-border"
                  )}
                >
                  <div className="mb-1">{icons[c.role]}</div>
                  <span className="text-xs font-bold capitalize text-foreground">{c.role}</span>
                  <span className="text-[10px] text-muted-foreground truncate w-full mt-0.5">{c.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-md">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. admin@college.edu or student.email"
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password <span className="text-destructive">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setIsForgotModalOpen(true);
                  }}
                  className="text-xs text-primary font-medium hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="flex h-9 w-full rounded-lg border border-input bg-card px-3 py-1.5 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
              Sign In to Portal <ArrowRight size={16} className="ml-1" />
            </Button>
          </form>

          {/* New Student Default Credential Tip */}
          <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10 text-[11px] text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <KeyRound size={13} className="text-primary" /> Student Onboarding Note
            </p>
            <p>
              Newly enrolled students can sign in using their registered email and default initial password: <code className="text-primary font-bold bg-primary/10 px-1 py-0.5 rounded">student123</code>.
            </p>
          </div>

          {/* Educational Disclaimer */}
          <div className="mt-5 pt-4 border-t border-border flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
            <Info size={14} className="shrink-0 text-primary mt-0.5" />
            <p>
              <strong>Notice:</strong> This is an interactive frontend application utilizing <code>localStorage</code>.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Forgot / Reset Password Dialog */}
      <Dialog
        isOpen={isForgotModalOpen}
        onClose={() => {
          setIsForgotModalOpen(false);
          setResetError('');
          setResetSuccess('');
        }}
        title="Student / Faculty Password Reset"
        description="Enter your registered college email address to reset your account password."
        maxWidth="md"
      >
        <form onSubmit={handlePasswordReset} className="space-y-4 text-left">
          {resetError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold">
              <AlertCircle size={15} />
              <span>{resetError}</span>
            </div>
          )}

          {resetSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle2 size={15} />
              <span>{resetSuccess}</span>
            </div>
          )}

          <Input
            label="Registered College Email"
            type="email"
            value={resetEmail}
            onChange={e => setResetEmail(e.target.value)}
            placeholder="e.g. alex.johnson@student.college.edu"
            required
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            required
          />

          <div className="p-3 rounded-xl bg-muted/40 text-[11px] text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">💡 Default Recovery Option</p>
            <p>You can also enter <code className="text-primary font-bold">student123</code> to restore standard student credentials.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsForgotModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Update Password
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
