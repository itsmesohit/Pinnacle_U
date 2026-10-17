import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarCheck, CheckCircle2, XCircle, Clock, AlertCircle,
  Save, RotateCcw, AlertTriangle, ShieldCheck, Download
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import {
  getCourses, getStudents, getEnrollmentsByCourse, getAttendanceSessions,
  getAttendanceRecords, saveAttendance, getCourseAttendanceStats,
  getSessionByCourseAndDate, exportToCSV
} from '@/lib/dataService';
import { AttendanceStatus, Student } from '@/types';
import { format } from 'date-fns';

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
      records.forEach(r => {
        state[r.studentId] = r.status;
      });
      // Fill defaults for any missing enrolled student
      enrolledStudents.forEach(s => {
        if (!state[s.id]) state[s.id] = 'present';
      });
      setAttendanceState(state);
    } else {
      // Default all to 'present'
      const state: Record<string, AttendanceStatus> = {};
      enrolledStudents.forEach(s => {
        state[s.id] = 'present';
      });
      setAttendanceState(state);
    }
  }, [selectedCourseId, selectedDate, enrolledStudents]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    enrolledStudents.forEach(s => {
      updated[s.id] = 'present';
    });
    setAttendanceState(updated);
  };

  const handleSaveAttendance = () => {
    if (!selectedCourseId || !selectedDate) return;
    const teacherId = selectedCourse?.teacherId || user?.linkedEntityId || 'teacher-1';
    const records = Object.entries(attendanceState).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    saveAttendance(selectedCourseId, selectedDate, teacherId, records);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  // Course Stats
  const courseStats = selectedCourseId ? getCourseAttendanceStats(selectedCourseId) : null;
  const sessions = getAttendanceSessions().filter(s => s.courseId === selectedCourseId);
  const allRecords = getAttendanceRecords();

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

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Attendance Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Record, track, and audit student classroom attendance and absence logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportAttendance}>
            <Download size={15} /> Export Session
          </Button>
          {canEdit && (
            <Button variant="primary" size="sm" onClick={handleSaveAttendance}>
              <Save size={15} /> Save Attendance
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

      {/* Selectors Bar */}
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
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

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
      </div>

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
            <CardTitle>
              {selectedCourse?.name} ({selectedCourse?.code})
            </CardTitle>
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
                        <div className="font-semibold text-foreground">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{student.email}</div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{student.program}</td>
                      <td className="py-3 px-4">
                        {canEdit ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.id, 'present')}
                              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                                currentStatus === 'present'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.id, 'absent')}
                              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                                currentStatus === 'absent'
                                  ? 'bg-destructive text-destructive-foreground shadow-sm'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.id, 'late')}
                              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                                currentStatus === 'late'
                                  ? 'bg-amber-600 text-white shadow-sm'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              Late
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.id, 'excused')}
                              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                                currentStatus === 'excused'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              Excused
                            </button>
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
    </div>
  );
}
