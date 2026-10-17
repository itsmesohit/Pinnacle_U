import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Plus, BookOpen, UserPlus, Users, Edit2, Trash2, Eye,
  RotateCcw, Download
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent, EmptyState } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { CourseFormModal } from './CourseFormModal';
import { EnrollStudentModal } from './EnrollStudentModal';
import { useAuth } from '@/context/AuthContext';
import {
  getCourses, getDepartments, getTeachers, getEnrollments,
  createCourse, updateCourse, deleteCourse, exportToCSV
} from '@/lib/dataService';
import { Course, CourseFormData } from '@/types';

export function CourseListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin, isTeacher, user } = useAuth();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'new');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [enrollingCourse, setEnrollingCourse] = useState<Course | null>(null);

  const courses = getCourses();
  const departments = getDepartments();
  const teachers = getTeachers();
  const enrollments = getEnrollments();

  const deptMap = useMemo(() => new Map(departments.map(d => [d.id, d.name])), [departments]);
  const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, `${t.firstName} ${t.lastName}`])), [teachers]);

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCourse(c);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (c: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingCourse(c);
  };

  const handleOpenEnroll = (c: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    setEnrollingCourse(c);
  };

  const handleFormSubmit = (data: CourseFormData) => {
    if (editingCourse) {
      updateCourse(editingCourse.id, data);
    } else {
      createCourse(data);
    }
    setIsModalOpen(false);
    setEditingCourse(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingCourse) {
      deleteCourse(deletingCourse.id);
      setDeletingCourse(null);
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const q = search.toLowerCase();
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
      const matchesDept = deptFilter === 'all' || c.departmentId === deptFilter;
      const matchesSem = semesterFilter === 'all' || c.semester === Number(semesterFilter);
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesDept && matchesSem && matchesStatus;
    });
  }, [courses, search, deptFilter, semesterFilter, statusFilter]);

  const handleExportCSV = () => {
    const data = filteredCourses.map(c => {
      const enrolled = enrollments.filter(e => e.courseId === c.id && e.status === 'enrolled').length;
      return {
        'Course Code': c.code,
        'Course Name': c.name,
        'Department': deptMap.get(c.departmentId) || c.departmentId,
        'Credits': c.credits,
        'Semester': c.semester,
        'Academic Year': c.academicYear,
        'Instructor': c.teacherId ? teacherMap.get(c.teacherId) : 'Unassigned',
        'Enrolled': enrolled,
        'Max Capacity': c.maxEnrollment,
        'Status': c.status,
      };
    });
    exportToCSV(data, `courses_catalog_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Course Catalog & Curriculum</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage academic courses, instructional allocations, and enrollment caps.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/departments')}>
            Manage Departments
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download size={15} /> Export
          </Button>
          {isAdmin && (
            <Button variant="primary" size="sm" onClick={handleOpenAdd}>
              <Plus size={15} /> Add Course
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 rounded-xl border border-border bg-card shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by course code or title..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground outline-none cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={semesterFilter}
            onChange={e => setSemesterFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground outline-none cursor-pointer"
          >
            <option value="all">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(''); setDeptFilter('all'); setSemesterFilter('all'); setStatusFilter('all'); }}
          >
            <RotateCcw size={14} className="mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* Courses Cards Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map(course => {
            const enrolled = enrollments.filter(e => e.courseId === course.id && e.status === 'enrolled').length;
            const pct = Math.round((enrolled / course.maxEnrollment) * 100);
            const teacherName = course.teacherId ? teacherMap.get(course.teacherId) : 'Unassigned';

            return (
              <Card
                key={course.id}
                className="hover:border-primary/40 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-xs text-primary px-2 py-0.5 rounded bg-primary/10">
                      {course.code}
                    </span>
                    <StatusBadge status={course.status} />
                  </div>
                  <CardTitle className="text-base truncate">{course.name}</CardTitle>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{course.description}</p>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-border/50">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Instructor</span>
                      <span className="font-semibold text-foreground truncate block">{teacherName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Department</span>
                      <span className="font-semibold text-foreground truncate block">{deptMap.get(course.departmentId)}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground font-medium">Capacity Enrollment</span>
                      <span className="font-bold text-foreground">
                        {enrolled} / {course.maxEnrollment} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${pct >= 90 ? 'bg-amber-500' : 'bg-primary'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant="outline">{course.credits} Credits</Badge>
                      <Badge variant="outline">Sem {course.semester}</Badge>
                    </div>

                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={e => handleOpenEnroll(course, e)}
                            title="Enroll Students"
                          >
                            <UserPlus size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={e => handleOpenEdit(course, e)}
                            title="Edit Course"
                          >
                            <Edit2 size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={e => handleOpenDelete(course, e)}
                            title="Delete Course"
                            className="hover:text-destructive"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/courses/${course.id}`)}
                        title="View Course"
                      >
                        <Eye size={15} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description="Try relaxing your filters or create a new course offering."
        />
      )}

      <CourseFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCourse(null);
          if (searchParams.get('action')) setSearchParams({});
        }}
        onSubmit={handleFormSubmit}
        initialData={editingCourse}
      />

      {enrollingCourse && (
        <EnrollStudentModal
          isOpen={!!enrollingCourse}
          onClose={() => setEnrollingCourse(null)}
          course={enrollingCourse}
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingCourse}
        onClose={() => setDeletingCourse(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Course"
        description={`Are you sure you want to delete ${deletingCourse?.name} (${deletingCourse?.code})? Enrolled students will be dropped from this course.`}
        confirmLabel="Delete Course"
      />
    </div>
  );
}
