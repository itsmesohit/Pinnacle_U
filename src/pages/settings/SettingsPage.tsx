import React, { useState } from 'react';
import {
  Settings, Database, RotateCcw, Shield, Moon, Sun, Monitor,
  AlertTriangle, CheckCircle2, User, Building
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getSettings, updateSettings, resetData } from '@/lib/dataService';

export function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();

  const settings = getSettings();
  const [collegeName, setCollegeName] = useState(settings.collegeName);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [attendanceThreshold, setAttendanceThreshold] = useState(settings.attendanceThreshold);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      collegeName,
      academicYear: Number(academicYear),
      attendanceThreshold: Number(attendanceThreshold),
    });
    setSuccessNotice('System configuration updated successfully.');
    setTimeout(() => setSuccessNotice(''), 3000);
  };

  const handleResetData = () => {
    resetData();
    setIsResetConfirmOpen(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-4xl text-left">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Application Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Configure institutional preferences, system thresholds, and local storage data.
        </p>
      </div>

      {successNotice && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <CheckCircle2 size={16} />
          <span>{successNotice}</span>
        </div>
      )}

      {/* User Session Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current User Session</CardTitle>
          <p className="text-xs text-muted-foreground">Authenticated persona and active permission boundaries</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">{user?.name}</h3>
                <Badge variant="default" className="capitalize">{user?.role}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Preference */}
      <Card>
        <CardHeader>
          <CardTitle>Interface Appearance</CardTitle>
          <p className="text-xs text-muted-foreground">Select preferred visual theme mode for this device</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                theme === 'light'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:bg-muted/40'
              }`}
            >
              <Sun size={20} className="mb-2 text-amber-500" />
              <span className="text-xs font-bold text-foreground">Light Theme</span>
              <span className="text-[10px] text-muted-foreground">Crisp clean surfaces</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                theme === 'dark'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:bg-muted/40'
              }`}
            >
              <Moon size={20} className="mb-2 text-indigo-400" />
              <span className="text-xs font-bold text-foreground">Dark Theme</span>
              <span className="text-[10px] text-muted-foreground">High contrast dark</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                theme === 'system'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:bg-muted/40'
              }`}
            >
              <Monitor size={20} className="mb-2 text-primary" />
              <span className="text-xs font-bold text-foreground">System Match</span>
              <span className="text-[10px] text-muted-foreground">Follows OS setting</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* College Configuration (Admin Only) */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Institutional Academic Settings</CardTitle>
            <p className="text-xs text-muted-foreground">College identifiers and policy thresholds</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="College / Institution Name"
                  value={collegeName}
                  onChange={e => setCollegeName(e.target.value)}
                  required
                />
                <Input
                  label="Current Academic Year"
                  type="number"
                  value={academicYear}
                  onChange={e => setAcademicYear(Number(e.target.value))}
                  required
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Minimum Attendance Threshold (%)"
                    type="number"
                    min={50}
                    max={100}
                    value={attendanceThreshold}
                    onChange={e => setAttendanceThreshold(Number(e.target.value))}
                    helperText="Students whose attendance falls below this percent trigger warning indicators."
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="sm">
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Data Persistence and Reset */}
      {isAdmin && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Database size={18} /> Storage & Data Reset
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              This prototype stores records in browser <code>localStorage</code> under <code>college_sis_v1_*</code> keys.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Resetting will clear all manual changes and re-seed the standard demo dataset (40 students, 8 faculty members, 6 departments, 10 courses, and sample attendance/grades).
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsResetConfirmOpen(true)}
              className="gap-1.5"
            >
              <RotateCcw size={15} /> Reset Demo Data
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetData}
        title="Reset All Application Data"
        description="Are you sure you want to reset all stored records to the default demo state? Any students, courses, grades, or attendance records created will be permanently cleared."
        confirmLabel="Reset Everything"
      />
    </div>
  );
}
