import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  GraduationCap, Mail, ArrowRight, AlertCircle, KeyRound,
  CheckCircle2, Lock, UserPlus, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type AuthMode = 'password' | 'otp';
type ResetStep = 1 | 2 | 3;

export function LoginPage() {
  const { login, loginWithOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [authMode, setAuthMode] = useState<AuthMode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // OTP Login
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [isOtpSending, setIsOtpSending] = useState(false);

  // Forgot Password Modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtpInput, setResetOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);

  // Register Modal
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [isRegLoading, setIsRegLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  // ---------- 1. Standard Password Login ----------
  const handlePasswordLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email.trim(), password);
      setIsLoading(false);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  // ---------- 2. Real OTP Login via Resend ----------
  const handleSendLoginOtp = async () => {
    setError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setError('Please enter your registered college email.');
      return;
    }

    setIsOtpSending(true);
    try {
      const res = await api.auth.requestLoginOtp(email.trim());
      setIsOtpSending(false);
      if (res.success) {
        setOtpSent(true);
        setOtpInput('');
        setSuccessMsg(res.message || `A 6-digit verification code has been sent to ${email.trim()}.`);
      } else {
        setError(res.message || 'Unable to send OTP.');
      }
    } catch (err: any) {
      setIsOtpSending(false);
      setError(err.message || 'Failed to dispatch OTP. Please check your email and try again.');
    }
  };

  const handleOtpLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanOtp = otpInput.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithOtp(email.trim(), cleanOtp);
      setIsLoading(false);
      if (res.success) {
        navigate(from, { replace: true });
      } else {
        setError(res.error || 'Invalid or expired OTP code.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'OTP verification failed. Please try again.');
    }
  };

  // ---------- 3. Forgot / Reset Password ----------
  const openForgotModal = () => {
    setResetEmail(email.trim());
    setResetStep(1);
    setResetOtpInput('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setResetSuccess('');
    setIsForgotModalOpen(true);
  };

  const closeForgotModal = () => {
    setIsForgotModalOpen(false);
    setResetStep(1);
    setResetError('');
    setResetSuccess('');
  };

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetEmail.trim()) {
      setResetError('Please enter your registered email address.');
      return;
    }

    setIsResetLoading(true);
    try {
      const res = await api.auth.requestForgotPasswordOtp(resetEmail.trim());
      setIsResetLoading(false);
      if (res.success) {
        setResetSuccess(res.message || `Verification code sent to ${resetEmail.trim()}.`);
        setResetStep(2);
      } else {
        setResetError(res.message || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setIsResetLoading(false);
      setResetError(err.message || 'Failed to send reset code. Please check your email.');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetOtpInput.trim() || resetOtpInput.trim().length !== 6) {
      setResetError('Please enter the valid 6-digit OTP code.');
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

    setIsResetLoading(true);
    try {
      const res = await api.auth.verifyResetOtp({
        email: resetEmail.trim(),
        otp: resetOtpInput.trim(),
        newPassword,
      });

      setIsResetLoading(false);
      if (res.success) {
        setResetStep(3);
        setResetSuccess('Password has been successfully updated! You can now log in.');
        setEmail(resetEmail.trim());
        setPassword(newPassword);

        setTimeout(() => {
          closeForgotModal();
          setAuthMode('password');
          setSuccessMsg('Password updated successfully! Sign in with your new password.');
        }, 1500);
      } else {
        setResetError(res.message || 'Password reset failed.');
      }
    } catch (err: any) {
      setIsResetLoading(false);
      setResetError(err.message || 'Invalid or expired OTP code.');
    }
  };

  // ---------- 4. Student Registration with Email OTP ----------
  const openRegisterModal = () => {
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setRegOtp('');
    setRegError('');
    setRegSuccess('');
    setRegisterStep(1);
    setIsRegisterModalOpen(true);
  };

  const closeRegisterModal = () => {
    setIsRegisterModalOpen(false);
    setRegisterStep(1);
    setRegError('');
    setRegSuccess('');
  };

  const handleSendRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegError('Please provide your name, college email, and password.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }

    setIsRegLoading(true);
    try {
      const res = await api.auth.requestRegisterOtp(regEmail.trim(), regName.trim());
      setIsRegLoading(false);
      if (res.success) {
        setRegSuccess(res.message || `Verification code sent to ${regEmail.trim()}.`);
        setRegisterStep(2);
      } else {
        setRegError(res.message || 'Could not send verification OTP.');
      }
    } catch (err: any) {
      setIsRegLoading(false);
      setRegError(err.message || 'Could not send verification email. Please check the address.');
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regOtp.trim() || regOtp.trim().length !== 6) {
      setRegError('Please enter the 6-digit OTP code.');
      return;
    }

    setIsRegLoading(true);
    try {
      const res = await api.auth.registerWithOtp({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: 'student',
        otp: regOtp.trim(),
      });

      setIsRegLoading(false);
      if (res.success) {
        setRegSuccess('Student account created and verified successfully!');
        setEmail(regEmail.trim());
        setPassword(regPassword);
        setTimeout(() => {
          closeRegisterModal();
          setAuthMode('password');
          setSuccessMsg('Account registered and verified! You can now sign in.');
        }, 1500);
      } else {
        setRegError(res.message || 'Verification failed.');
      }
    } catch (err: any) {
      setIsRegLoading(false);
      setRegError(err.message || 'Invalid verification OTP.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-muted/30 px-4 py-8 relative">
      {/* Dynamic ambient backdrop */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-primary/10 blur-3xl opacity-70" />
        <div className="absolute -bottom-[25%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-3xl opacity-60" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground shadow-xl shadow-primary/20 mb-3 ring-4 ring-primary/10">
            <GraduationCap size={36} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Pinnacle University
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 flex items-center justify-center gap-1.5">
            <Sparkles size={14} className="text-primary" />
            Enterprise Student Information System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xl">
          {/* Auth Mode Tabs */}
          <div className="flex p-1 mb-6 rounded-xl bg-muted/60 border border-border/60">
            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setError('');
                setSuccessMsg('');
              }}
              className={cn(
                'flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                authMode === 'password'
                  ? 'bg-card text-foreground shadow-sm font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="inline-flex items-center gap-1.5 justify-center">
                <Lock size={13} /> Password Login
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('otp');
                setError('');
                setSuccessMsg('');
              }}
              className={cn(
                'flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                authMode === 'otp'
                  ? 'bg-card text-foreground shadow-sm font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="inline-flex items-center gap-1.5 justify-center">
                <KeyRound size={13} /> Email OTP Login
              </span>
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium"
            >
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* PASSWORD LOGIN FORM */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <Input
                label="Registered College Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@college.edu or personal email"
                required
                autoComplete="email"
              />

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Password <span className="text-destructive">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={openForgotModal}
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
                  autoComplete="current-password"
                  className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-1.5 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full mt-2 h-10 text-sm font-semibold" isLoading={isLoading}>
                Sign In to Portal <ArrowRight size={16} className="ml-1.5" />
              </Button>

              <div className="pt-3 text-center border-t border-border/60">
                <button
                  type="button"
                  onClick={openRegisterModal}
                  className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus size={14} /> New student? Register with email OTP
                </button>
              </div>
            </form>
          )}

          {/* REAL OTP LOGIN FORM */}
          {authMode === 'otp' && (
            <form onSubmit={handleOtpLogin} className="space-y-4">
              <Input
                label="Registered Email"
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setOtpSent(false);
                  setOtpInput('');
                }}
                placeholder="Enter your registered account email"
                required
                autoComplete="email"
              />

              {!otpSent ? (
                <Button
                  type="button"
                  variant="primary"
                  className="w-full h-10 font-semibold"
                  isLoading={isOtpSending}
                  onClick={handleSendLoginOtp}
                >
                  <KeyRound size={16} className="mr-1.5" /> Send 6-Digit Login Code
                </Button>
              ) : (
                <>
                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground flex items-start gap-2.5">
                    <Mail size={16} className="text-primary shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      Verification code has been sent to <strong className="text-foreground">{email}</strong>. Please check your inbox and enter the 6-digit code below.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Enter 6-Digit OTP <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••••"
                      required
                      autoFocus
                      className="flex h-12 w-full rounded-lg border border-input bg-card px-3 py-1.5 text-center text-xl tracking-[0.45em] font-mono text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>

                  <Button type="submit" variant="primary" className="w-full h-10 font-semibold" isLoading={isLoading}>
                    Verify OTP & Sign In <ArrowRight size={16} className="ml-1.5" />
                  </Button>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpInput('');
                        setSuccessMsg('');
                      }}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Change email
                    </button>
                    <button
                      type="button"
                      disabled={isOtpSending}
                      onClick={handleSendLoginOtp}
                      className="text-primary font-semibold hover:underline cursor-pointer"
                    >
                      Resend code
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </motion.div>

      {/* Forgot / Reset Password Dialog */}
      <Dialog
        isOpen={isForgotModalOpen}
        onClose={closeForgotModal}
        title="Reset Password"
        description="Verify your identity using an email OTP and create a new password."
        maxWidth="md"
      >
        <div className="space-y-4 text-left">
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

          {/* Step 1: Email */}
          {resetStep === 1 && (
            <form onSubmit={handleSendResetOtp} className="space-y-4">
              <Input
                label="Registered College Email"
                type="email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                placeholder="e.g. name@college.edu"
                required
              />

              <div className="p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground flex items-center gap-2">
                <Mail size={15} className="text-primary shrink-0" />
                <span>A secure 6-digit verification code will be sent to your email.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={closeForgotModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isResetLoading}>
                  Send Verification Code
                </Button>
              </div>
            </form>
          )}

          {/* Step 2: OTP + New Password */}
          {resetStep === 2 && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
                Enter the code sent to <strong>{resetEmail}</strong>:
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Enter 6-Digit OTP <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={resetOtpInput}
                  onChange={e => setResetOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  required
                  autoFocus
                  className="flex h-11 w-full rounded-lg border border-input bg-card px-3 py-1.5 text-center text-lg tracking-[0.4em] font-mono text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

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

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-primary cursor-pointer"
                  onClick={() => {
                    setResetStep(1);
                    setResetError('');
                    setResetSuccess('');
                  }}
                >
                  ← Change email
                </button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={closeForgotModal}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isResetLoading}>
                    Verify & Update Password
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Step 3: Success */}
          {resetStep === 3 && (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={28} />
              </div>
              <p className="text-sm font-semibold text-foreground">Password reset successful!</p>
              <p className="text-xs text-muted-foreground">Redirecting you back to sign in…</p>
            </div>
          )}
        </div>
      </Dialog>

      {/* Student Registration Dialog */}
      <Dialog
        isOpen={isRegisterModalOpen}
        onClose={closeRegisterModal}
        title="Student Registration"
        description="Create your student account verified via email OTP."
        maxWidth="md"
      >
        <div className="space-y-4 text-left">
          {regError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold">
              <AlertCircle size={15} />
              <span>{regError}</span>
            </div>
          )}

          {regSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle2 size={15} />
              <span>{regSuccess}</span>
            </div>
          )}

          {registerStep === 1 && (
            <form onSubmit={handleSendRegisterOtp} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                placeholder="e.g. John Doe"
                required
              />
              <Input
                label="College Email Address"
                type="email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                placeholder="e.g. name@college.edu"
                required
              />
              <Input
                label="Create Password"
                type="password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
              />

              <div className="p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground flex items-center gap-2">
                <Mail size={15} className="shrink-0 text-primary" />
                <span>
                  We will send a 6-digit verification code to your email.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={closeRegisterModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isRegLoading}>
                  Send Verification OTP
                </Button>
              </div>
            </form>
          )}

          {registerStep === 2 && (
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
                Verification code sent to <strong>{regEmail}</strong>.
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Enter 6-Digit Verification Code <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={regOtp}
                  onChange={e => setRegOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  required
                  autoFocus
                  className="flex h-11 w-full rounded-lg border border-input bg-card px-3 py-1.5 text-center text-lg tracking-[0.4em] font-mono text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-primary cursor-pointer"
                  onClick={() => setRegisterStep(1)}
                >
                  ← Edit details
                </button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={closeRegisterModal}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isRegLoading}>
                    Verify & Create Account
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </Dialog>
    </div>
  );
}