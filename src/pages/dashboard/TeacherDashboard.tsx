import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, CalendarCheck, Award, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { StatCard, Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import {
  getCourses, getEnrollments, getAttendanceSessions,
  getGrades, getTeachers, getCourseAttendanceStats
} from '@/lib/dataService';
import { format } from 'date-fns';

export function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Find linked teacher record
  const teachers = getTeachers();
  const currentTeacher = teachers.find(t => t.id === user?.linkedEntityId || t.email === user?.email);

  const teacherId = currentTeacher?.id || 'teacher-1';
  const allCourses = getCourses();
  const assignedCourses = allCourses.filter(c => c.teacherId === teacherId);

  const enrollments = getEnrollments();
  const teacherCourseIds = new Set(assignedCourses.map(c => c.id));
  const assignedEnrollments = enrollments.filter(e => teacherCourseIds.has(e.courseId) && e.status === 'enrolled');

  // Total unique students taught
  const totalStudentsTaught = new Set(assignedEnrollments.map(e => e.studentId)).size;

  // Recent attendance sessions for teacher's courses
  const sessions = getAttendanceSessions().filter(s => teacherCourseIds.has(s.courseId));
  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [sessions]);

  // Today's classes simulation
  const todayClasses = useMemo(() => {
    return assignedCourses.map((c, i) => ({
      course: c,
      time: ['09:00 AM - 10:30 AM', '11:00 AM - 12:30 PM', '02:00 PM - 03:30 PM'][i % 3],
      room: `Hall ${101 + i * 2}`,
      attended: sessions.some(s => s.courseId === c.id && s.date === format(new Date(), 'yyyy-MM-dd')),
    }));
  }, [assignedCourses, sessions]);

  // Attendance pending
  const attendancePendingCount = todayClasses.filter(c => !c.attended).length;

  // Recent grades entered
  const teacherGrades = getGrades().filter(g => g.teacherId === teacherId || teacherCourseIds.has(g.courseId));

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Welcome back, {currentTeacher?.firstName || 'Professor'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {currentTeacher?.designation} • {currentTeacher?.specialization}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/grades')}>
            <Award size={15} /> Enter Grades
          </Button>
          <Button size="sm" variant="primary" onClick={() => navigate('/attendance')}>
            <CalendarCheck size={15} /> Mark Attendance
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Courses"
          value={assignedCourses.length}
          subtitle="Teaching this semester"
          icon={BookOpen}
          color="primary"
          onClick={() => navigate('/courses')}
        />
        <StatCard
          title="Students Taught"
          value={totalStudentsTaught}
          subtitle="Unique enrollments"
          icon={Users}
          color="info"
          onClick={() => navigate('/students')}
        />
        <StatCard
          title="Classes Today"
          value={todayClasses.length}
          subtitle="Scheduled lectures"
          icon={Clock}
          color="warning"
        />
        <StatCard
          title="Attendance Pending"
          value={attendancePendingCount}
          subtitle="Requires submission"
          icon={CalendarCheck}
          color={attendancePendingCount > 0 ? 'warning' : 'success'}
          onClick={() => navigate('/attendance')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule & Classes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today's Academic Schedule</CardTitle>
            <p className="text-xs text-muted-foreground">Lectures and student cohort sessions scheduled for today</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayClasses.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                    {item.course.code}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{item.course.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.time} • Room {item.room} • {item.course.credits} Credits
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {item.attended ? (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 size={12} /> Attendance Taken
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="subtle"
                      onClick={() => navigate(`/attendance?course=${item.course.id}`)}
                    >
                      Take Attendance
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {todayClasses.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-6">No classes assigned yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Assigned Courses Quick Overview */}
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
            <p className="text-xs text-muted-foreground">Classroom capacity & enrollment</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignedCourses.map(course => {
              const enrolledCount = enrollments.filter(e => e.courseId === course.id && e.status === 'enrolled').length;
              const stats = getCourseAttendanceStats(course.id);
              const percentage = Math.round((enrolledCount / course.maxEnrollment) * 100);

              return (
                <div key={course.id} className="p-3 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary font-mono">{course.code}</span>
                    <span className="text-[11px] font-semibold text-muted-foreground">Avg Att: {stats.percentage}%</span>
                  </div>
                  <h4 className="text-xs font-semibold text-foreground truncate mt-1">{course.name}</h4>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                    <span>{enrolledCount} enrolled</span>
                    <span>{course.maxEnrollment} max</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance & Grades History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Attendance Submissions</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/attendance')}>
              View All <ArrowRight size={14} className="ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 text-xs">
              {recentSessions.map(session => {
                const course = allCourses.find(c => c.id === session.courseId);
                return (
                  <div key={session.id} className="p-3.5 flex items-center justify-between hover:bg-muted/30">
                    <div>
                      <p className="font-semibold text-foreground">{course?.name || session.courseId}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{course?.code} • {session.date}</p>
                    </div>
                    <Badge variant="success">Saved</Badge>
                  </div>
                );
              })}
              {recentSessions.length === 0 && (
                <p className="text-center text-xs text-muted-foreground p-6">No recent attendance sessions.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Grade Entries</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/grades')}>
              View All <ArrowRight size={14} className="ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 text-xs">
              {teacherGrades.slice(0, 5).map(grade => {
                const course = allCourses.find(c => c.id === grade.courseId);
                return (
                  <div key={grade.id} className="p-3.5 flex items-center justify-between hover:bg-muted/30">
                    <div>
                      <p className="font-semibold text-foreground">{grade.assessmentName}</p>
                      <p className="text-[11px] text-muted-foreground">{course?.code} • {grade.marksObtained}/{grade.maxMarks} marks</p>
                    </div>
                    <span className="font-bold text-sm text-primary">{grade.percentage}% ({grade.gradeLetter})</span>
                  </div>
                );
              })}
              {teacherGrades.length === 0 && (
                <p className="text-center text-xs text-muted-foreground p-6">No grades entered yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
