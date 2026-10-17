import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Users, CalendarCheck, Award, UserPlus,
  Trash2, Edit2, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { EnrollStudentModal } from './EnrollStudentModal';
import { CourseFormModal } from './CourseFormModal';
import { useAuth } from '@/context/AuthContext';
import {
  getCourseById, getDepartmentById, getTeacherById, getEnrollmentsByCourse,
  getStudents, unenrollStudent, getAttendanceSessions, getGradesByCourse,
  updateCourse, deleteCourse, getStudentAttendance
} from '@/lib/dataService';
import { CourseFormData } from '@/types';

export function CourseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, isTeacher, user } = useAuth();

  const [activeTab, setActiveTab] = useState('students');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [unenrollStudentId, setUnenrollStudentId] = useState<string | null>(null);

  const course = id ? getCourseById(id) : undefined;
  const department = course ? getDepartmentById(course.departmentId) : undefined;
  const teacher = course?.teacherId ? getTeacherById(course.teacherId) : undefined;

  if (!course) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Course not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/courses')}>
          Back to Courses
        </Button>
      </div>
    );
  }

  const allStudents = getStudents();
  const enrollments = getEnrollmentsByCourse(course.id);
  const enrolledStudents = enrollments.map(e => {
    const student = allStudents.find(s => s.id === e.studentId);
    const att = student ? getStudentAttendance(student.id) : { percentage: 100 };
    return {
      enrollment: e,
      student,
      attendancePercentage: att.percentage,
    };
  }).filter(item => item.student !== undefined);

  const sessions = getAttendanceSessions().filter(s => s.courseId === course.id);
  const grades = getGradesByCourse(course.id);

  const handleEditSubmit = (data: CourseFormData) => {
    updateCourse(course.id, data);
    setIsEditModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    deleteCourse(course.id);
    navigate('/courses');
  };

  const handleUnenrollConfirm = () => {
    if (unenrollStudentId) {
      unenrollStudent(unenrollStudentId, course.id);
      setUnenrollStudentId(null);
    }
  };

  const tabs = [
    { id: 'students', label: 'Enrolled Students', badge: enrolledStudents.length, icon: <Users size={15} /> },
    { id: 'attendance', label: 'Attendance Sessions', badge: sessions.length, icon: <CalendarCheck size={15} /> },
    { id: 'grades', label: 'Grades & Evals', badge: grades.length, icon: <Award size={15} /> },
  ];

  return (
    <div className="space-y-6 text-left">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/courses')} className="gap-1 text-muted-foreground">
          <ArrowLeft size={16} /> Back to Courses
        </Button>
      </div>

      {/* Header Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-base font-mono shrink-0">
              {course.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">{course.name}</h1>
                <StatusBadge status={course.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {department?.name} • Instructor:{' '}
                <strong className="text-foreground">
                  {teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unassigned'}
                </strong>{' '}
                • {course.credits} Credits • Semester {course.semester}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button size="sm" variant="outline" onClick={() => setIsEnrollModalOpen(true)}>
                  <UserPlus size={15} /> Enroll Student
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditModalOpen(true)}>
                  <Edit2 size={15} /> Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setIsDeleteOpen(true)}>
                  <Trash2 size={15} /> Delete
                </Button>
              </>
            )}
            {(isAdmin || (isTeacher && user?.linkedEntityId === course.teacherId)) && (
              <Button size="sm" variant="primary" onClick={() => navigate(`/attendance?course=${course.id}`)}>
                <CalendarCheck size={15} /> Mark Attendance
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Enrolled Students Tab */}
      {activeTab === 'students' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Enrolled Class Cohort</CardTitle>
              <p className="text-xs text-muted-foreground">
                {enrolledStudents.length} of {course.maxEnrollment} capacity filled
              </p>
            </div>
            {isAdmin && (
              <Button size="sm" variant="subtle" onClick={() => setIsEnrollModalOpen(true)}>
                <UserPlus size={14} className="mr-1" /> Add Student
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Student ID</th>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Program</th>
                    <th className="py-2.5 px-4">Attendance</th>
                    <th className="py-2.5 px-4">Enroll Date</th>
                    {isAdmin && <th className="py-2.5 px-4 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {enrolledStudents.map(({ student, attendancePercentage }) => {
                    if (!student) return null;
                    return (
                      <tr key={student.id} className="hover:bg-muted/30">
                        <td className="py-3 px-4 font-mono font-semibold text-primary">{student.studentId}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">{student.firstName} {student.lastName}</div>
                          <div className="text-[11px] text-muted-foreground">{student.email}</div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{student.program}</td>
                        <td className="py-3 px-4 font-semibold">
                          <span className={attendancePercentage < 75 ? 'text-destructive font-bold' : 'text-emerald-600'}>
                            {attendancePercentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{student.enrollmentDate}</td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => setUnenrollStudentId(student.id)}
                            >
                              Drop
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {enrolledStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        No students enrolled in this course yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <Card>
          <CardHeader>
            <CardTitle>Recorded Attendance Sessions</CardTitle>
            <p className="text-xs text-muted-foreground">Historical lecture attendance dates</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 text-xs">
              {sessions.map(s => (
                <div key={s.id} className="p-3.5 flex items-center justify-between hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <CalendarCheck size={18} className="text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">Lecture Session</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{s.date}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/attendance?course=${course.id}&date=${s.date}`)}
                  >
                    View / Edit
                  </Button>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="p-8 text-center text-xs text-muted-foreground">
                  No attendance sessions marked yet for this course.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grades Tab */}
      {activeTab === 'grades' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Grading Records</CardTitle>
              <p className="text-xs text-muted-foreground">Assessments entered for this course</p>
            </div>
            {(isAdmin || (isTeacher && user?.linkedEntityId === course.teacherId)) && (
              <Button size="sm" variant="primary" onClick={() => navigate(`/grades?course=${course.id}`)}>
                <Award size={14} className="mr-1" /> Enter Grades
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 text-xs">
              {grades.slice(0, 15).map(g => {
                const student = allStudents.find(s => s.id === g.studentId);
                return (
                  <div key={g.id} className="p-3.5 flex items-center justify-between hover:bg-muted/30">
                    <div>
                      <p className="font-semibold text-foreground">
                        {student?.firstName} {student?.lastName} • {g.assessmentName}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {g.assessmentType.toUpperCase()} • {g.marksObtained}/{g.maxMarks} marks
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-primary block">{g.gradeLetter}</span>
                      <span className="text-[10px] text-muted-foreground">{g.percentage}%</span>
                    </div>
                  </div>
                );
              })}
              {grades.length === 0 && (
                <p className="p-8 text-center text-xs text-muted-foreground">No grades entered for this course.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enroll Modal */}
      <EnrollStudentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        course={course}
      />

      {/* Edit Modal */}
      <CourseFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={course}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Course"
        description={`Are you sure you want to delete ${course.name}?`}
        confirmLabel="Delete Course"
      />

      {/* Unenroll Confirmation */}
      <ConfirmDialog
        isOpen={!!unenrollStudentId}
        onClose={() => setUnenrollStudentId(null)}
        onConfirm={handleUnenrollConfirm}
        title="Drop Student from Course"
        description="Are you sure you want to unenroll this student from the course?"
        confirmLabel="Drop Student"
      />
    </div>
  );
}
