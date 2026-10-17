import React, { useState, useMemo } from 'react';
import {
  BarChart3, Download, Users, BookOpen, CalendarCheck, Award,
  Filter, FileSpreadsheet, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  getStudents, getTeachers, getCourses, getDepartments,
  getAttendanceRecords, getAttendanceSessions, getGrades,
  getEnrollments, getStudentAttendance, getCourseAttendanceStats,
  exportToCSV
} from '@/lib/dataService';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from 'recharts';

export function ReportsPage() {
  const [selectedDept, setSelectedDept] = useState('all');

  const students = getStudents();
  const teachers = getTeachers();
  const courses = getCourses();
  const departments = getDepartments();
  const enrollments = getEnrollments();
  const grades = getGrades();

  const deptMap = useMemo(() => new Map(departments.map(d => [d.id, d.name])), [departments]);

  // Department comparative metrics
  const deptAnalytics = useMemo(() => {
    return departments.map(d => {
      const dStudents = students.filter(s => s.departmentId === d.id);
      const dCourses = courses.filter(c => c.departmentId === d.id);
      const dTeachers = teachers.filter(t => t.departmentId === d.id);

      // Average attendance for department students
      let attSum = 0;
      let attCount = 0;
      dStudents.forEach(s => {
        const att = getStudentAttendance(s.id);
        if (att.total > 0) {
          attSum += att.percentage;
          attCount++;
        }
      });
      const avgAtt = attCount > 0 ? Math.round(attSum / attCount) : 85;

      // Grade average for department courses
      const dCourseIds = new Set(dCourses.map(c => c.id));
      const dGrades = grades.filter(g => dCourseIds.has(g.courseId));
      const avgScore = dGrades.length > 0
        ? Math.round(dGrades.reduce((acc, g) => acc + g.percentage, 0) / dGrades.length)
        : 78;

      return {
        id: d.id,
        code: d.code,
        name: d.name,
        studentsCount: dStudents.length,
        coursesCount: dCourses.length,
        teachersCount: dTeachers.length,
        avgAttendance: avgAtt,
        avgAcademicScore: avgScore,
      };
    });
  }, [departments, students, courses, teachers, grades]);

  // Attendance Deficit Alert List (students < 75%)
  const lowAttendanceStudents = useMemo(() => {
    return students
      .map(s => {
        const att = getStudentAttendance(s.id);
        return {
          student: s,
          ...att,
        };
      })
      .filter(item => item.total > 0 && item.percentage < 75)
      .slice(0, 10);
  }, [students]);

  const handleExportDeptReport = () => {
    const data = deptAnalytics.map(d => ({
      'Department Code': d.code,
      'Department Name': d.name,
      'Student Enrollment': d.studentsCount,
      'Faculty Count': d.teachersCount,
      'Courses Offered': d.coursesCount,
      'Average Attendance Rate': `${d.avgAttendance}%`,
      'Average Academic Score': `${d.avgAcademicScore}%`,
    }));
    exportToCSV(data, `department_analytics_report_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportAttendanceRisk = () => {
    const data = lowAttendanceStudents.map(({ student, percentage, present, absent, total }) => ({
      'Student ID': student.studentId,
      'Student Name': `${student.firstName} ${student.lastName}`,
      'Email': student.email,
      'Program': student.program,
      'Attendance Percentage': `${percentage}%`,
      'Lectures Present': present,
      'Lectures Absent': absent,
      'Total Sessions': total,
    }));
    exportToCSV(data, `attendance_deficit_audit_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Institutional Reports & Analytics</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Cross-departmental audits, academic performance comparisons, and compliance metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportDeptReport}>
            <Download size={15} /> Export Department Analytics
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportAttendanceRisk}>
            <Download size={15} /> Export Attendance Risk List
          </Button>
        </div>
      </div>

      {/* Comparative Department Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Department Academic & Attendance Benchmark</CardTitle>
          <p className="text-xs text-muted-foreground">Comparative attendance % vs average assessment scores</p>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="code" tick={{ fontSize: 12 }} stroke="#888888" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#888888" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '0.75rem' }} />
                <Legend />
                <Bar dataKey="avgAttendance" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Avg Attendance %" />
                <Bar dataKey="avgAcademicScore" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Avg Exam Score %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Department Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Department Summary Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Department Name</th>
                  <th className="py-2.5 px-4">Students</th>
                  <th className="py-2.5 px-4">Faculty</th>
                  <th className="py-2.5 px-4">Courses</th>
                  <th className="py-2.5 px-4">Avg Attendance</th>
                  <th className="py-2.5 px-4">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {deptAnalytics.map(dept => (
                  <tr key={dept.id} className="hover:bg-muted/30">
                    <td className="py-3 px-4 font-mono font-bold text-primary">{dept.code}</td>
                    <td className="py-3 px-4 font-semibold text-foreground">{dept.name}</td>
                    <td className="py-3 px-4">{dept.studentsCount}</td>
                    <td className="py-3 px-4">{dept.teachersCount}</td>
                    <td className="py-3 px-4">{dept.coursesCount}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{dept.avgAttendance}%</td>
                    <td className="py-3 px-4 font-bold text-primary">{dept.avgAcademicScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Deficit Early-Warning Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Students Below Attendance Minimum (75%)</CardTitle>
            <p className="text-xs text-muted-foreground">Identified cohort at risk of course withdrawal</p>
          </div>
          <Badge variant="warning">{lowAttendanceStudents.length} Students Flagged</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Student</th>
                  <th className="py-2.5 px-4">Program</th>
                  <th className="py-2.5 px-4">Rate</th>
                  <th className="py-2.5 px-4">Present / Total</th>
                  <th className="py-2.5 px-4">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {lowAttendanceStudents.map(({ student, percentage, present, total }) => (
                  <tr key={student.id} className="hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">{student.firstName} {student.lastName}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{student.studentId}</div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{student.program}</td>
                    <td className="py-3 px-4 font-bold text-destructive">{percentage}%</td>
                    <td className="py-3 px-4 text-muted-foreground">{present} of {total} lectures</td>
                    <td className="py-3 px-4 text-muted-foreground">{student.email}</td>
                  </tr>
                ))}
                {lowAttendanceStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-muted-foreground">
                      No students currently below the attendance threshold.
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
