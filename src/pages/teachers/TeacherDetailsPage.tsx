import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, BookOpen, Users, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { TeacherFormModal } from './TeacherFormModal';
import { useAuth } from '@/context/AuthContext';
import {
  getTeacherById, getDepartmentById, getCourses, getEnrollments,
  updateTeacher, deleteTeacher, getCourseAttendanceStats
} from '@/lib/dataService';
import { TeacherFormData } from '@/types';

export function TeacherDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const teacher = id ? getTeacherById(id) : undefined;
  const department = teacher ? getDepartmentById(teacher.departmentId) : undefined;

  if (!teacher) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Faculty member not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/teachers')}>
          Back to Directory
        </Button>
      </div>
    );
  }

  const allCourses = getCourses();
  const assignedCourses = allCourses.filter(c => c.teacherId === teacher.id);
  const enrollments = getEnrollments();
  const teacherCourseIds = new Set(assignedCourses.map(c => c.id));
  const studentsTaughtCount = new Set(
    enrollments.filter(e => teacherCourseIds.has(e.courseId) && e.status === 'enrolled').map(e => e.studentId)
  ).size;

  const handleEditSubmit = (data: TeacherFormData) => {
    updateTeacher(teacher.id, data);
    setIsEditModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    deleteTeacher(teacher.id);
    navigate('/teachers');
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/teachers')} className="gap-1 text-muted-foreground">
          <ArrowLeft size={16} /> Back to Faculty Directory
        </Button>
      </div>

      {/* Header Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-extrabold text-xl shadow-inner">
              {teacher.firstName[0]}{teacher.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
                  {teacher.firstName} {teacher.lastName}
                </h1>
                <StatusBadge status={teacher.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-mono font-bold text-primary">{teacher.teacherId}</span> • {teacher.designation} • {department?.name}
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
                <Edit2 size={15} /> Edit Profile
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)}>
                <Trash2 size={15} /> Delete Faculty
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium text-foreground">{teacher.email}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium text-foreground">{teacher.phone}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Department</span>
              <span className="font-medium text-foreground">{department?.name}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Specialization</span>
              <span className="font-medium text-foreground">{teacher.specialization}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Joining Date</span>
              <span className="font-medium text-foreground">{teacher.joiningDate}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Students Taught</span>
              <span className="font-bold text-primary">{studentsTaughtCount} students</span>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Courses */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Assigned Courses ({assignedCourses.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignedCourses.map(course => {
              const enrolled = enrollments.filter(e => e.courseId === course.id && e.status === 'enrolled').length;
              const stats = getCourseAttendanceStats(course.id);
              return (
                <div
                  key={course.id}
                  className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
                  <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
                    <span className="text-muted-foreground">
                      <strong>{enrolled}</strong> / {course.maxEnrollment} Enrolled
                    </span>
                    <Badge variant="outline">Att: {stats.percentage}%</Badge>
                  </div>
                </div>
              );
            })}
            {assignedCourses.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-8">No courses currently assigned to this teacher.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <TeacherFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={teacher}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Faculty Member"
        description={`Are you sure you want to remove ${teacher.firstName} ${teacher.lastName}?`}
        confirmLabel="Remove Faculty"
      />
    </div>
  );
}
