import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Calendar, MapPin, Shield, BookOpen,
  CalendarCheck, Award, Activity as ActivityIcon, Edit2, Trash2, KeyRound, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { StudentFormModal } from './StudentFormModal';
import { useAuth } from '@/context/AuthContext';
import {
  getStudentById, getDepartmentById, getCourses, getEnrollmentsByStudent,
  getStudentAttendance, getGradesByStudent, getAttendanceRecords,
  getAttendanceSessions, updateStudent, deleteStudent, resetUserPassword
} from '@/lib/dataService';
import { StudentFormData } from '@/types';
import { format } from 'date-fns';

export function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isResetPassOpen, setIsResetPassOpen] = useState(false);
  const [resetSuccessNotice, setResetSuccessNotice] = useState('');

  const student = id ? getStudentById(id) : undefined;
  const department = student ? getDepartmentById(student.departmentId) : undefined;

  if (!student) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Student not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/students')}>
          Back to Students
        </Button>
      </div>
    );
  }

  const allCourses = getCourses();
  const enrollments = getEnrollmentsByStudent(student.id);
  const enrolledCourses = enrollments.map(e => allCourses.find(c => c.id === e.courseId)).filter(Boolean);

  const attendance = getStudentAttendance(student.id);
  const grades = getGradesByStudent(student.id);

  // Student's recent attendance records
  const allSessions = getAttendanceSessions();
  const studentRecords = getAttendanceRecords()
    .filter(r => r.studentId === student.id)
    .slice(0, 10)
    .map(r => {
      const session = allSessions.find(s => s.id === r.sessionId);
      const course = session ? allCourses.find(c => c.id === session.courseId) : undefined;
      return {
        ...r,
        date: session?.date || 'Unknown',
        courseName: course?.name || 'Unknown Course',
        courseCode: course?.code || 'CRS',
      };
    });

  const handleEditSubmit = (data: StudentFormData) => {
    updateStudent(student.id, data);
    setIsEditModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    deleteStudent(student.id);
    navigate('/students');
  };

  const handleResetPasswordConfirm = () => {
    resetUserPassword(student.email, 'student123');
    setResetSuccessNotice(`Password for ${student.firstName} ${student.lastName} has been reset to default "student123"`);
    setIsResetPassOpen(false);
    setTimeout(() => setResetSuccessNotice(''), 5000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Shield size={15} /> },
    { id: 'courses', label: 'Courses', badge: enrolledCourses.length, icon: <BookOpen size={15} /> },
    { id: 'attendance', label: 'Attendance', badge: `${attendance.percentage}%`, icon: <CalendarCheck size={15} /> },
    { id: 'grades', label: 'Grades & Results', badge: grades.length, icon: <Award size={15} /> },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/students')} className="gap-1 text-muted-foreground">
          <ArrowLeft size={16} /> Back to Directory
        </Button>
      </div>

      {/* Profile Header Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-extrabold text-xl shadow-inner">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
                  {student.firstName} {student.lastName}
                </h1>
                <StatusBadge status={student.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-mono font-bold text-primary">{student.studentId}</span> • {department?.name} • Year {student.academicYear}, Sem {student.semester}
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsResetPassOpen(true)}>
                <KeyRound size={15} /> Reset Password
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                <Edit2 size={15} /> Edit Profile
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)}>
                <Trash2 size={15} /> Delete Record
              </Button>
            </div>
          )}
        </div>

        {resetSuccessNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{resetSuccessNotice}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Email Address</span>
                <span className="font-medium text-foreground">{student.email}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Phone Number</span>
                <span className="font-medium text-foreground">{student.phone}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Date of Birth</span>
                <span className="font-medium text-foreground">{student.dateOfBirth}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Gender</span>
                <span className="font-medium capitalize text-foreground">{student.gender}</span>
              </div>
              <div className="flex items-start justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">Home Address</span>
                <span className="font-medium text-right text-foreground max-w-[200px]">{student.address}</span>
              </div>
            </CardContent>
          </Card>

          {/* Academic & Guardian Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Academic Enrollment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium text-foreground">{department?.name}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Degree Program</span>
                  <span className="font-medium text-foreground">{student.program}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Enrollment Date</span>
                  <span className="font-medium text-foreground">{student.enrollmentDate}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Overall Attendance</span>
                  <span className="font-bold text-primary">{attendance.percentage}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guardian & Emergency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Guardian Name</span>
                  <span className="font-medium text-foreground">{student.guardianName}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Guardian Phone</span>
                  <span className="font-medium text-foreground">{student.guardianContact}</span>
                </div>
                {student.emergencyContact && (
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Emergency Contact</span>
                    <span className="font-medium text-foreground">{student.emergencyContact}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <Card>
          <CardHeader>
            <CardTitle>Enrolled Courses ({enrolledCourses.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {enrolledCourses.map(course => {
              if (!course) return null;
              return (
                <div
                  key={course.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-card gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs font-mono shrink-0">
                      {course.code}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{course.name}</h4>
                      <p className="text-xs text-muted-foreground">{course.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold">{course.credits} Credits</span>
                    <Badge variant="outline">Semester {course.semester}</Badge>
                  </div>
                </div>
              );
            })}
            {enrolledCourses.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-8">Not enrolled in any courses.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Attendance Rate</span>
              <p className="text-2xl font-bold text-primary mt-1">{attendance.percentage}%</p>
            </Card>
            <Card className="p-4 text-center">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Present</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{attendance.present}</p>
            </Card>
            <Card className="p-4 text-center">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Absent</span>
              <p className="text-2xl font-bold text-destructive mt-1">{attendance.absent}</p>
            </Card>
            <Card className="p-4 text-center">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Late / Excused</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">{attendance.late + attendance.excused}</p>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance Sessions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Course</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {studentRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium">{r.date}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-foreground">{r.courseName}</span>
                        <span className="text-muted-foreground ml-1.5 font-mono">({r.courseCode})</span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                  {studentRecords.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-6 text-muted-foreground">
                        No attendance records recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grades Tab */}
      {activeTab === 'grades' && (
        <Card>
          <CardHeader>
            <CardTitle>Assessment & Grade History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Assessment</th>
                  <th className="py-2.5 px-4">Course</th>
                  <th className="py-2.5 px-4">Marks</th>
                  <th className="py-2.5 px-4">Percentage</th>
                  <th className="py-2.5 px-4">Grade</th>
                  <th className="py-2.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {grades.map(g => {
                  const course = allCourses.find(c => c.id === g.courseId);
                  return (
                    <tr key={g.id} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-semibold text-foreground">{g.assessmentName}</td>
                      <td className="py-3 px-4 text-muted-foreground">{course?.name} ({course?.code})</td>
                      <td className="py-3 px-4 font-mono">{g.marksObtained} / {g.maxMarks}</td>
                      <td className="py-3 px-4 font-semibold">{g.percentage}%</td>
                      <td className="py-3 px-4">
                        <Badge variant={g.percentage >= 75 ? 'success' : g.percentage >= 50 ? 'warning' : 'destructive'}>
                          {g.gradeLetter}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{g.assessmentDate}</td>
                    </tr>
                  );
                })}
                {grades.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-muted-foreground">
                      No grades entered for this student.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <StudentFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={student}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Student Record"
        description={`Are you sure you want to delete ${student.firstName} ${student.lastName}? This operation cannot be undone.`}
        confirmLabel="Delete Student"
      />

      {/* Password Reset Confirmation */}
      <ConfirmDialog
        isOpen={isResetPassOpen}
        onClose={() => setIsResetPassOpen(false)}
        onConfirm={handleResetPasswordConfirm}
        title="Reset Student Password"
        description={`Are you sure you want to reset the login password for ${student.firstName} ${student.lastName} (${student.email})? It will be restored to the default temporary password "student123".`}
        confirmLabel="Reset to Default"
        isDestructive={false}
      />
    </div>
  );
}
