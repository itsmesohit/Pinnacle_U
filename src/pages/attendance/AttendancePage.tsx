import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarCheck, CheckCircle2, XCircle, Clock, AlertCircle,
  Save, RotateCcw, AlertTriangle, ShieldCheck, Download,
  History, BarChart3, Users
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import {
  getCourses, getStudents, getEnrollmentsByCourse, getAttendanceSessions,
  getAttendanceRecords, saveAttendance, getCourseAttendanceStats,
  getSessionByCourseAndDate, exportToCSV, getStudentAttendance
} from '@/lib/dataService';
import { AttendanceStatus, Student } from '@/types';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';

const STATUS_COLORS = {
  present: '#10b981',
  absent:  '#ef4444',
  late:    '#f59e0b',
  excused: '#3b82f6',
};

export function AttendancePage() {
  const [searchParams] = useSearchParams();
  const { user, isAdmin, isTeacher, isStudent } = useAuth();

  const courses = getCourses();
  const allStudents = getStudents();

  // Selected course and date
  const [selectedCourseId, setSelectedCourseId] = useState(
    searchParams.get('course') || (courses[0]?.id || '')
  );
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get('date') || format(new Date(), 'yyyy-MM-dd')
  );

  const [activeTab, setActiveTab] = useState<'mark' | 'history' | 'analytics'>('mark');
  const [attendanceState, setAttendanceState] = useState<Record<string, AttendanceStatus>>({});
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const enrolledStudents = useMemo(() => {
    if (!selectedCourseId) return [];
    const enrs = getEnrollmentsByCourse(selectedCourseId);
    return enrs.map(e => allStudents.find(s => s.id === e.studentId)).filter(Boolean) as Student[];
  }, [selectedCourseId, allStudents]);

  // Load existing session if present
  useEffect(() => {
    if (!selectedCourseId || !selectedDate) return;
    const session = getSessionByCourseAndDate(selectedCourseId, selectedDate);
    if (session) {
      const records = getAttendanceRecords().filter(r => r.sessionId === session.id);
      const state: Record<string, AttendanceStatus> = {};
      records.forEach(r => { state[r.studentId] = r.status; });
      enrolledStudents.forEach(s => { if (!state[s.id]) state[s.id] = 'present'; });
      setAttendanceState(state);
    } else {
      const state: Record<string, AttendanceStatus> = {};
      enrolledStudents.forEach(s => { state[s.id] = 'present'; });
      setAttendanceState(state);
    }
  }, [selectedCourseId, selectedDate, enrolledStudents]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    enrolledStudents.forEach(s => { updated[s.id] = 'present'; });
    setAttendanceState(updated);
  };

  const handleSaveAttendance = () => {
    if (!selectedCourseId || !selectedDate) return;
    const teacherId = selectedCourse?.teacherId || user?.linkedEntityId || 'teacher-1';
    const records = Object.entries(attendanceState).map(([studentId, status]) => ({ studentId, status }));
    saveAttendance(selectedCourseId, selectedDate, teacherId, records);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  // Course Stats
  const courseStats = selectedCourseId ? getCourseAttendanceStats(selectedCourseId) : null;
  const allSessions = getAttendanceSessions();
  const allRecords = getAttendanceRecords();
  const sessions = allSessions.filter(s => s.courseId === selectedCourseId);

  const handleExportAttendance = () => {
    const data = enrolledStudents.map(s => ({
      'Student ID': s.studentId,
      'Student Name': `${s.firstName} ${s.lastName}`,
      'Course': selectedCourse?.name,
      'Course Code': selectedCourse?.code,
      'Date': selectedDate,
      'Status': attendanceState[s.id] || 'unmarked',
    }));
    exportToCSV(data, `attendance_${selectedCourse?.code}_${selectedDate}`);
  };

  const canEdit = isAdmin || isTeacher;

  // ── HISTORY TAB DATA ──────────────────────────────────────────
  // All sessions for selected course sorted newest first
  const historySessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions]);

  // For each session build a summary row
  const historyRows = useMemo(() => {
    return historySessions.map(session => {
      const recs = allRecords.filter(r => r.sessionId === session.id);
      const present = recs.filter(r => r.status === 'present').length;
      const absent  = recs.filter(r => r.status === 'absent').length;
      const late    = recs.filter(r => r.status === 'late').length;
      const excused = recs.filter(r => r.status === 'excused').length;
      const denom   = recs.length - excused;
      const pct     = denom > 0 ? Math.round(((present + late) / denom) * 100) : 100;
      return { session, present, absent, late, excused, total: recs.length, pct };
    });
  }, [historySessions, allRecords]);

  const handleExportHistory = () => {
    const data = historyRows.map(r => ({
      'Date': r.session.date,
      'Course': selectedCourse?.name,
      'Present': r.present,
      'Absent': r.absent,
      'Late': r.late,
      'Excused': r.excused,
      'Total Students': r.total,
      'Attendance %': `${r.pct}%`,
    }));
    exportToCSV(data, `attendance_history_${selectedCourse?.code}`);
  };

  // ── ANALYTICS TAB DATA ────────────────────────────────────────

  // 1. Per-session attendance trend (last 10 sessions)
  const trendData = useMemo(() => {
    return [...historySessions]
      .reverse()
      .slice(-10)
      .map(session => {
        const recs = allRecords.filter(r => r.sessionId === session.id);
        const present = recs.filter(r => r.status === 'present').length;
        const absent  = recs.filter(r => r.status === 'absent').length;
        const late    = recs.filter(r => r.status === 'late').length;
        const excused = recs.filter(r => r.status === 'excused').length;
        return {
          date: format(new Date(session.date), 'MMM d'),
          Present: present,
          Absent: absent,
          Late: late,
          Excused: excused,
        };
      });
  }, [historySessions, allRecords]);

  // 2. Overall status distribution pie data for selected course
  const pieData = useMemo(() => {
    if (!courseStats) return [];
    return [
      { name: 'Present',  value: courseStats.present,  color: STATUS_COLORS.present },
      { name: 'Absent',   value: courseStats.absent,   color: STATUS_COLORS.absent },
      { name: 'Late',     value: courseStats.late,     color: STATUS_COLORS.late },
      { name: 'Excused',  value: courseStats.excused,  color: STATUS_COLORS.excused },
    ].filter(d => d.value > 0);
  }, [courseStats]);

  // 3. Per-student attendance % for enrolled students in this course
  const studentAttendanceData = useMemo(() => {
    const threshold = 75;
    return enrolledStudents
      .map(s => {
        // calculate attendance ONLY for this course
        const sessionIds = new Set(sessions.map(s => s.id));
        const recs = allRecords.filter(r => r.studentId === s.id && sessionIds.has(r.sessionId));
        const present = recs.filter(r => r.status === 'present').length;
        const late    = recs.filter(r => r.status === 'late').length;
        const excused = recs.filter(r => r.status === 'excused').length;
        const denom   = recs.length - excused;
        const pct     = denom > 0 ? Math.round(((present + late) / denom) * 100) : 100;
        return {
          name: `${s.firstName} ${s.lastName}`,
          studentId: s.studentId,
          attendance: pct,
          atRisk: pct < threshold,
        };
      })
      .sort((a, b) => a.attendance - b.attendance);
  }, [enrolledStudents, sessions, allRecords]);

  const atRiskCount = studentAttendanceData.filter(s => s.atRisk).length;

  // Tab buttons config
  const tabs = [
    { id: 'mark'      as const, label: 'Mark Attendance', icon: <CalendarCheck size={15} /> },
    { id: 'history'   as const, label: 'History',         icon: <History size={15} /> },
    { id: 'analytics' as const, label: 'Analytics',       icon: <BarChart3 size={15} /> },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Attendance Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Record, track, and audit student classroom attendance and absence logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'mark' && (
            <>
              <Button variant="outline" size="sm" onClick={handleExportAttendance}>
                <Download size={15} /> Export Session
              </Button>
              {canEdit && (
                <Button variant="primary" size="sm" onClick={handleSaveAttendance}>
                  <Save size={15} /> Save Attendance
                </Button>
              )}
            </>
          )}
          {activeTab === 'history' && (
            <Button variant="outline" size="sm" onClick={handleExportHistory}>
              <Download size={15} /> Export History
            </Button>
          )}
        </div>
      </div>

      {isSavedNotice && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <CheckCircle2 size={16} />
          <span>Attendance records successfully saved and persisted!</span>
        </div>
      )}

      {/* Course Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-border bg-card shadow-sm">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Select Course
          </label>
          <select
            value={selectedCourseId}
            onChange={e => setSelectedCourseId(e.target.value)}
            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
            ))}
          </select>
        </div>

        {activeTab === 'mark' && (
          <>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Session Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-end">
              {canEdit && (
                <Button variant="secondary" size="md" className="w-full" onClick={handleMarkAllPresent}>
                  <CheckCircle2 size={16} className="text-emerald-600 mr-1.5" /> Mark All Present
                </Button>
              )}
            </div>
          </>
        )}

        {activeTab !== 'mark' && (
          <div className="md:col-span-2 flex items-end">
            <p className="text-xs text-muted-foreground">
              Showing data for <span className="font-bold text-foreground">{selectedCourse?.name}</span> — {sessions.length} sessions recorded.
            </p>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── MARK ATTENDANCE TAB ─────────────────────────────────── */}
      {activeTab === 'mark' && (
        <>
          {/* Course Attendance Metrics */}
          {courseStats && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Card className="p-3 text-center">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold">Overall Rate</span>
                <p className="text-xl font-bold text-primary mt-0.5">{courseStats.percentage}%</p>
              </Card>
              <Card className="p-3 text-center">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold">Present</span>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">{courseStats.present}</p>
              </Card>
              <Card className="p-3 text-center">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold">Absent</span>
                <p className="text-xl font-bold text-destructive mt-0.5">{courseStats.absent}</p>
              </Card>
              <Card className="p-3 text-center">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold">Late</span>
                <p className="text-xl font-bold text-amber-600 mt-0.5">{courseStats.late}</p>
              </Card>
              <Card className="p-3 text-center">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold">Excused</span>
                <p className="text-xl font-bold text-blue-600 mt-0.5">{courseStats.excused}</p>
              </Card>
            </div>
          )}

          {/* Attendance Sheet */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{selectedCourse?.name} ({selectedCourse?.code})</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Session: {selectedDate} • {enrolledStudents.length} Students Enrolled
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                <strong>Policy:</strong> Excused absences excluded from denominator.
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Student ID</th>
                      <th className="py-2.5 px-4">Student</th>
                      <th className="py-2.5 px-4">Program</th>
                      <th className="py-2.5 px-4 text-center">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {enrolledStudents.map(student => {
                      const currentStatus = attendanceState[student.id] || 'present';
                      return (
                        <tr key={student.id} className="hover:bg-muted/30">
                          <td className="py-3 px-4 font-mono font-semibold text-primary">{student.studentId}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-foreground">{student.firstName} {student.lastName}</div>
                            <div className="text-[11px] text-muted-foreground">{student.email}</div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{student.program}</td>
                          <td className="py-3 px-4">
                            {canEdit ? (
                              <div className="flex items-center justify-center gap-1">
                                {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map(status => (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleStatusChange(student.id, status)}
                                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs capitalize transition-all ${
                                      currentStatus === status
                                        ? status === 'present' ? 'bg-emerald-600 text-white shadow-sm'
                                          : status === 'absent' ? 'bg-destructive text-destructive-foreground shadow-sm'
                                          : status === 'late' ? 'bg-amber-600 text-white shadow-sm'
                                          : 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                  >
                                    {status}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center">
                                <StatusBadge status={currentStatus} />
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {enrolledStudents.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-muted-foreground">
                          No students enrolled in this course.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── HISTORY TAB ─────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {historyRows.length === 0 ? (
            <Card className="p-12 text-center">
              <History size={36} className="mx-auto text-muted-foreground mb-3 opacity-40" />
              <p className="font-semibold text-foreground text-sm">No attendance sessions recorded yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Switch to the <strong>Mark Attendance</strong> tab to record your first session.
              </p>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Past Attendance Sessions — {selectedCourse?.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {historyRows.length} session{historyRows.length !== 1 ? 's' : ''} recorded in total
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4 text-center text-emerald-600">Present</th>
                        <th className="py-2.5 px-4 text-center text-destructive">Absent</th>
                        <th className="py-2.5 px-4 text-center text-amber-600">Late</th>
                        <th className="py-2.5 px-4 text-center text-blue-600">Excused</th>
                        <th className="py-2.5 px-4 text-center">Total</th>
                        <th className="py-2.5 px-4 text-center">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {historyRows.map(({ session, present, absent, late, excused, total, pct }) => (
                        <tr
                          key={session.id}
                          className="hover:bg-muted/30 cursor-pointer"
                          onClick={() => {
                            setSelectedDate(session.date);
                            setActiveTab('mark');
                          }}
                        >
                          <td className="py-3 px-4 font-semibold text-foreground">
                            {format(new Date(session.date), 'EEE, MMM d yyyy')}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-600">{present}</td>
                          <td className="py-3 px-4 text-center font-bold text-destructive">{absent}</td>
                          <td className="py-3 px-4 text-center font-bold text-amber-600">{late}</td>
                          <td className="py-3 px-4 text-center font-bold text-blue-600">{excused}</td>
                          <td className="py-3 px-4 text-center text-muted-foreground">{total}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-bold ${pct >= 75 ? 'text-emerald-600' : 'text-destructive'}`}>
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Per-student attendance summary for this course */}
          {enrolledStudents.length > 0 && sessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Student-wise Attendance Summary</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Individual attendance percentage across all sessions in this course
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-2.5 px-4">Student ID</th>
                        <th className="py-2.5 px-4">Student Name</th>
                        <th className="py-2.5 px-4 text-center">Attendance %</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {studentAttendanceData.map(s => (
                        <tr key={s.studentId} className="hover:bg-muted/30">
                          <td className="py-3 px-4 font-mono font-semibold text-primary">{s.studentId}</td>
                          <td className="py-3 px-4 font-semibold text-foreground">{s.name}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-24 bg-muted rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${s.attendance >= 75 ? 'bg-emerald-500' : 'bg-destructive'}`}
                                  style={{ width: `${Math.min(s.attendance, 100)}%` }}
                                />
                              </div>
                              <span className={`font-bold w-10 ${s.attendance >= 75 ? 'text-emerald-600' : 'text-destructive'}`}>
                                {s.attendance}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {s.atRisk ? (
                              <Badge variant="destructive">At Risk</Badge>
                            ) : (
                              <Badge variant="success">On Track</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── ANALYTICS TAB ───────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {sessions.length === 0 ? (
            <Card className="p-12 text-center">
              <BarChart3 size={36} className="mx-auto text-muted-foreground mb-3 opacity-40" />
              <p className="font-semibold text-foreground text-sm">No data to analyze yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Record at least one attendance session to see analytics.
              </p>
            </Card>
          ) : (
            <>
              {/* Summary Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold">Total Sessions</span>
                  <p className="text-2xl font-bold text-primary mt-1">{sessions.length}</p>
                </Card>
                <Card className="p-4 text-center">
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold">Avg Rate</span>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{courseStats?.percentage ?? 0}%</p>
                </Card>
                <Card className="p-4 text-center">
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold">Enrolled</span>
                  <p className="text-2xl font-bold text-foreground mt-1">{enrolledStudents.length}</p>
                </Card>
                <Card className="p-4 text-center border-destructive/30">
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold">At Risk</span>
                  <p className={`text-2xl font-bold mt-1 ${atRiskCount > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                    {atRiskCount}
                  </p>
                </Card>
              </div>

              {/* Session Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trend — Last {trendData.length} Sessions</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Session-by-session breakdown of present, absent, late, and excused counts
                  </p>
                </CardHeader>
                <CardContent>
                  {trendData.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#888888" />
                          <YAxis tick={{ fontSize: 11 }} stroke="#888888" allowDecimals={false} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'var(--color-card)',
                              borderColor: 'var(--color-border)',
                              borderRadius: '0.75rem',
                            }}
                          />
                          <Legend />
                          <Bar dataKey="Present" stackId="a" fill={STATUS_COLORS.present}  radius={[0,0,0,0]} />
                          <Bar dataKey="Late"    stackId="a" fill={STATUS_COLORS.late}     radius={[0,0,0,0]} />
                          <Bar dataKey="Absent"  stackId="a" fill={STATUS_COLORS.absent}   radius={[0,0,0,0]} />
                          <Bar dataKey="Excused" stackId="a" fill={STATUS_COLORS.excused}  radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-8">
                      Not enough session data for trend analysis.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Two column: Pie + At-Risk list */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Overall Status Distribution Pie */}
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Status Distribution</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Aggregate attendance status across all sessions
                    </p>
                  </CardHeader>
                  <CardContent>
                    {pieData.length > 0 ? (
                      <>
                        <div className="h-52 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'var(--color-card)',
                                  borderColor: 'var(--color-border)',
                                  borderRadius: '0.75rem',
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                          {pieData.map(item => (
                            <div key={item.name} className="flex items-center gap-2 text-xs">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="text-muted-foreground">{item.name}:</span>
                              <span className="font-bold text-foreground">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-center text-xs text-muted-foreground py-8">No records yet.</p>
                    )}
                  </CardContent>
                </Card>

                {/* At-Risk Students List */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Students Below 75% Threshold</CardTitle>
                        <p className="text-xs text-muted-foreground">Students at risk of attendance shortage</p>
                      </div>
                      {atRiskCount > 0 && (
                        <Badge variant="destructive">{atRiskCount} At Risk</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {studentAttendanceData.filter(s => s.atRisk).length === 0 ? (
                      <div className="p-8 text-center">
                        <ShieldCheck size={28} className="mx-auto text-emerald-500 mb-2" />
                        <p className="text-xs font-semibold text-emerald-600">All students are on track!</p>
                        <p className="text-[11px] text-muted-foreground mt-1">Everyone is above the 75% threshold.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50 text-xs">
                        {studentAttendanceData
                          .filter(s => s.atRisk)
                          .map(s => (
                            <div key={s.studentId} className="p-3.5 flex items-center justify-between hover:bg-muted/30">
                              <div>
                                <p className="font-semibold text-foreground">{s.name}</p>
                                <p className="text-[11px] text-muted-foreground font-mono">{s.studentId}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-destructive text-sm">{s.attendance}%</span>
                                <AlertTriangle size={14} className="text-destructive" />
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Student Attendance Bar Chart */}
              {studentAttendanceData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Per-Student Attendance Breakdown</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Individual attendance percentage for all enrolled students — red line at 75% threshold
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={studentAttendanceData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis
                            dataKey="studentId"
                            tick={{ fontSize: 10 }}
                            stroke="#888888"
                            angle={-35}
                            textAnchor="end"
                            interval={0}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 11 }}
                            stroke="#888888"
                            tickFormatter={v => `${v}%`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'var(--color-card)',
                              borderColor: 'var(--color-border)',
                              borderRadius: '0.75rem',
                            }}
                            formatter={(value: number) => [`${value}%`, 'Attendance']}
                            labelFormatter={label => {
                              const s = studentAttendanceData.find(x => x.studentId === label);
                              return s ? s.name : label;
                            }}
                          />
                          <Bar
                            dataKey="attendance"
                            name="Attendance %"
                            radius={[4, 4, 0, 0]}
                            fill="#4f46e5"
                          >
                            {studentAttendanceData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.atRisk ? STATUS_COLORS.absent : STATUS_COLORS.present}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
