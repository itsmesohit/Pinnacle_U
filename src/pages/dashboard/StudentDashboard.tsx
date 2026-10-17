import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CalendarCheck, Award, Clock, Megaphone, ArrowUpRight } from 'lucide-react';
import { StatCard, Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import {
  getStudents, getCourses, getEnrollments, getStudentAttendance,
  getGradesByStudent, getAnnouncements, getDepartmentById
} from '@/lib/dataService';
import { GRADE_BANDS } from '@/lib/seedData';
import { format } from 'date-fns';

export function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Find linked student
  const students = getStudents();
  const currentStudent = students.find(s => s.id === user?.linkedEntityId || s.email === user?.email) || students[0];

  const department = currentStudent ? getDepartmentById(currentStudent.departmentId) : undefined;
  const enrollments = currentStudent ? getEnrollments().filter(e => e.studentId === currentStudent.id && e.status === 'enrolled') : [];

  const allCourses = getCourses();
  const enrolledCourses = enrollments.map(e => allCourses.find(c => c.id === e.courseId)).filter(Boolean);

  // Student Attendance
  const attendance = currentStudent ? getStudentAttendance(currentStudent.id) : { total: 0, percentage: 100, present: 0, absent: 0, late: 0, excused: 0 };

  // Student Grades & GPA
  const grades = currentStudent ? getGradesByStudent(currentStudent.id) : [];
  const gpaStats = useMemo(() => {
    if (grades.length === 0) return { gpa: '3.80', avgPct: 88 };
    const totalPct = grades.reduce((acc, g) => acc + g.percentage, 0);
    const avgPct = Math.round(totalPct / grades.length);

    // Calculate GPA based on grade points
    let points = 0;
    grades.forEach(g => {
      const band = GRADE_BANDS.find(b => g.percentage >= b.minPercentage && g.percentage <= b.maxPercentage);
      points += band ? band.gradePoints : 2.0;
    });
    const gpa = (points / grades.length).toFixed(2);
    return { gpa, avgPct };
  }, [grades]);

  // Announcements targeted for student
  const announcements = getAnnouncements().filter(a => a.audience === 'all' || a.audience === 'students');

  return (
    <div className="space-y-6 text-left">
      {/* Personalized Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-indigo-700 text-primary-foreground p-6 sm:p-8 shadow-lg">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-3">
              <span>{currentStudent?.studentId}</span>
              <span>•</span>
              <span>{department?.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentStudent?.firstName || 'Student'}!
            </h1>
            <p className="text-xs sm:text-sm text-primary-foreground/80 mt-1 max-w-xl">
              {currentStudent?.program} • Academic Year {currentStudent?.academicYear}, Semester {currentStudent?.semester}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center min-w-[90px]">
              <span className="text-[11px] font-medium text-primary-foreground/70 block uppercase tracking-wider">Attendance</span>
              <span className="text-2xl font-bold">{attendance.percentage}%</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center min-w-[90px]">
              <span className="text-[11px] font-medium text-primary-foreground/70 block uppercase tracking-wider">Est. GPA</span>
              <span className="text-2xl font-bold">{gpaStats.gpa}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Enrolled Courses"
          value={enrolledCourses.length}
          subtitle="Current semester"
          icon={BookOpen}
          color="primary"
          onClick={() => navigate('/courses')}
        />
        <StatCard
          title="Attendance Rate"
          value={`${attendance.percentage}%`}
          subtitle={`${attendance.present} present of ${attendance.total} lectures`}
          icon={CalendarCheck}
          color={attendance.percentage >= 75 ? 'success' : 'warning'}
          onClick={() => navigate('/attendance')}
        />
        <StatCard
          title="Academic Standing"
          value={gpaStats.gpa >= '3.0' ? 'Good Standing' : 'Academic Alert'}
          subtitle={`Average score: ${gpaStats.avgPct}%`}
          icon={Award}
          color={gpaStats.gpa >= '3.0' ? 'success' : 'warning'}
          onClick={() => navigate('/grades')}
        />
        <StatCard
          title="Campus Notices"
          value={announcements.length}
          subtitle="Recent announcements"
          icon={Megaphone}
          color="info"
          onClick={() => navigate('/announcements')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrolled Courses */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Courses</CardTitle>
              <p className="text-xs text-muted-foreground">Courses you are enrolled in for the current academic term</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/courses')}>
              View Catalog <ArrowUpRight size={14} className="ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {enrolledCourses.map(course => {
              if (!course) return null;
              return (
                <div
                  key={course.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                      {course.code}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{course.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{course.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-xs font-semibold text-muted-foreground">{course.credits} Credits</span>
                    <Badge variant="outline">Semester {course.semester}</Badge>
                  </div>
                </div>
              );
            })}
            {enrolledCourses.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-6">You are not currently enrolled in any courses.</p>
            )}
          </CardContent>
        </Card>

        {/* Academic Performance & Grade Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Assessments</CardTitle>
            <p className="text-xs text-muted-foreground">Evaluation marks and feedback</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 text-xs">
              {grades.slice(0, 6).map(g => {
                const c = allCourses.find(item => item.id === g.courseId);
                return (
                  <div key={g.id} className="p-3.5 flex items-center justify-between hover:bg-muted/30">
                    <div>
                      <p className="font-semibold text-foreground">{g.assessmentName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{c?.code} • {g.marksObtained}/{g.maxMarks} marks</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-primary block">{g.gradeLetter}</span>
                      <span className="text-[10px] text-muted-foreground">{g.percentage}%</span>
                    </div>
                  </div>
                );
              })}
              {grades.length === 0 && (
                <p className="text-center text-xs text-muted-foreground p-6">No grades posted yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements Stream */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Academic & Campus Announcements</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/announcements')}>
            All Notices <ArrowUpRight size={14} className="ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.slice(0, 4).map(a => (
            <div key={a.id} className="p-4 rounded-xl border border-border/80 bg-muted/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-foreground truncate">{a.title}</span>
                <span className="text-[10px] text-muted-foreground">{format(new Date(a.createdAt), 'MMM d')}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{a.message}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
