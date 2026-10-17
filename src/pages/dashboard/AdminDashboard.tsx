import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, BookOpen, Building2, CalendarCheck, AlertTriangle,
  PlusCircle, UserPlus, FileSpreadsheet, ArrowUpRight
} from 'lucide-react';
import { StatCard, Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import {
  getStudents, getTeachers, getCourses, getDepartments,
  getAttendanceRecords, getAttendanceSessions, getActivities,
  getEnrollments, getStudentAttendance
} from '@/lib/dataService';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export function AdminDashboard() {
  const navigate = useNavigate();
  const [enrollmentTimeframe, setEnrollmentTimeframe] = useState<'year' | 'semester'>('year');

  const students = getStudents();
  const teachers = getTeachers();
  const courses = getCourses();
  const departments = getDepartments();
  const activities = getActivities();
  const enrollments = getEnrollments();

  // Metrics calculated from stored data
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalCourses = courses.length;
  const totalDepartments = departments.length;

  // Average attendance across all students
  const attendanceStats = useMemo(() => {
    let sum = 0;
    let count = 0;
    let atRisk = 0;
    students.forEach(s => {
      const att = getStudentAttendance(s.id);
      if (att.total > 0) {
        sum += att.percentage;
        count++;
        if (att.percentage < 75) atRisk++;
      }
    });
    return {
      avg: count > 0 ? Math.round(sum / count) : 85,
      atRisk,
    };
  }, [students]);

  // Department distribution data for Donut Chart
  const deptDistribution = useMemo(() => {
    return departments.map(d => ({
      name: d.code,
      fullName: d.name,
      value: students.filter(s => s.departmentId === d.id).length,
    })).filter(d => d.value > 0);
  }, [departments, students]);

  // Enrollment trend data
  const enrollmentTrendData = useMemo(() => {
    if (enrollmentTimeframe === 'semester') {
      return [
        { name: 'Sem 1', count: students.filter(s => s.semester === 1).length },
        { name: 'Sem 2', count: students.filter(s => s.semester === 2).length },
        { name: 'Sem 3', count: students.filter(s => s.semester === 3).length },
        { name: 'Sem 4', count: students.filter(s => s.semester === 4).length },
        { name: 'Sem 5', count: students.filter(s => s.semester === 5).length },
        { name: 'Sem 6', count: students.filter(s => s.semester === 6).length },
      ];
    }
    // By Year
    return [
      { name: 'Year 1', count: students.filter(s => s.academicYear === 1).length },
      { name: 'Year 2', count: students.filter(s => s.academicYear === 2).length },
      { name: 'Year 3', count: students.filter(s => s.academicYear === 3).length },
      { name: 'Year 4', count: students.filter(s => s.academicYear === 4).length },
    ];
  }, [students, enrollmentTimeframe]);

  // Course attendance comparison
  const courseAttendanceData = useMemo(() => {
    return courses.slice(0, 6).map(c => {
      const courseEnr = enrollments.filter(e => e.courseId === c.id);
      return {
        name: c.code,
        students: courseEnr.length,
        capacity: c.maxEnrollment,
      };
    });
  }, [courses, enrollments]);

  // Recent 5 students
  const recentStudents = useMemo(() => {
    return [...students]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [students]);

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Admin Overview</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time college operations, enrollment statistics, and academic metrics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/students?action=new')}>
            <UserPlus size={15} /> Add Student
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/teachers?action=new')}>
            <PlusCircle size={15} /> Add Teacher
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/courses?action=new')}>
            <BookOpen size={15} /> Create Course
          </Button>
          <Button size="sm" variant="primary" onClick={() => navigate('/attendance')}>
            <CalendarCheck size={15} /> Mark Attendance
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Students"
          value={totalStudents}
          subtitle="Enrolled cohort"
          icon={Users}
          trend={{ value: '+12% YoY', positive: true }}
          color="primary"
          onClick={() => navigate('/students')}
        />
        <StatCard
          title="Faculty Members"
          value={totalTeachers}
          subtitle="Active professors"
          icon={GraduationCap}
          color="info"
          onClick={() => navigate('/teachers')}
        />
        <StatCard
          title="Active Courses"
          value={totalCourses}
          subtitle="Current semester"
          icon={BookOpen}
          color="success"
          onClick={() => navigate('/courses')}
        />
        <StatCard
          title="Departments"
          value={totalDepartments}
          subtitle="Academic units"
          icon={Building2}
          color="warning"
          onClick={() => navigate('/courses')}
        />
        <StatCard
          title="Avg Attendance"
          value={`${attendanceStats.avg}%`}
          subtitle="Institution-wide"
          icon={CalendarCheck}
          color="success"
          onClick={() => navigate('/attendance')}
        />
        <StatCard
          title="Attendance Risk"
          value={attendanceStats.atRisk}
          subtitle="Below 75% threshold"
          icon={AlertTriangle}
          color="warning"
          onClick={() => navigate('/attendance')}
        />
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrollment Trend Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Enrollment Distribution</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Student distribution across academic stages</p>
            </div>
            <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-muted/40">
              <button
                onClick={() => setEnrollmentTimeframe('year')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  enrollmentTimeframe === 'year' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                By Year
              </button>
              <button
                onClick={() => setEnrollmentTimeframe('semester')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  enrollmentTimeframe === 'semester' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                By Semester
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={enrollmentTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#888888" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#888888" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '0.75rem' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#enrollGrad)" name="Students" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Student Distribution Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Students by Department</CardTitle>
            <p className="text-xs text-muted-foreground">Proportion of student body across disciplines</p>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptDistribution}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {deptDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '0.75rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/50">
              {deptDistribution.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-medium text-foreground truncate">{item.name}:</span>
                  <span className="text-muted-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Capacities & Enrollment Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Course Enrollment vs Capacity</CardTitle>
          <p className="text-xs text-muted-foreground">Monitoring course saturation and seat limits</p>
        </CardHeader>
        <CardContent>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#888888" />
                <YAxis tick={{ fontSize: 12 }} stroke="#888888" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '0.75rem' }} />
                <Legend />
                <Bar dataKey="students" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Enrolled" />
                <Bar dataKey="capacity" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Max Capacity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tables & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Students Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recently Enrolled Students</CardTitle>
              <p className="text-xs text-muted-foreground">Latest additions to the academic registry</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/students')}>
              View All <ArrowUpRight size={14} className="ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">ID</th>
                    <th className="py-2.5 px-4">Program</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentStudents.map(student => (
                    <tr
                      key={student.id}
                      onClick={() => navigate(`/students/${student.id}`)}
                      className="hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{student.firstName} {student.lastName}</div>
                        <div className="text-[11px] text-muted-foreground">{student.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">{student.studentId}</td>
                      <td className="py-3 px-4 text-muted-foreground">{student.program}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={student.status} />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{student.enrollmentDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Live System Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <p className="text-xs text-muted-foreground">Audit log of system actions and changes</p>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
              {activities.slice(0, 8).map(act => (
                <div key={act.id} className="flex items-start gap-3 text-xs pb-3 border-b border-border/40 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground leading-snug">{act.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(act.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-6">No recent activities recorded.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
