import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Edit2, Trash2, Users, GraduationCap, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { DepartmentFormModal } from './DepartmentFormModal';
import { useAuth } from '@/context/AuthContext';
import {
  getDepartments, getStudents, getTeachers, getCourses,
  createDepartment, updateDepartment, deleteDepartment
} from '@/lib/dataService';
import { Department, DepartmentFormData } from '@/types';

export function DepartmentListPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [errorNotice, setErrorNotice] = useState('');

  const departments = getDepartments();
  const students = getStudents();
  const teachers = getTeachers();
  const courses = getCourses();

  const handleOpenAdd = () => {
    setEditingDept(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (data: DepartmentFormData) => {
    if (editingDept) {
      updateDepartment(editingDept.id, data);
    } else {
      createDepartment(data);
    }
    setIsModalOpen(false);
    setEditingDept(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingDept) {
      const res = deleteDepartment(deletingDept.id);
      if (!res.success) {
        setErrorNotice(res.error || 'Failed to delete department');
      }
      setDeletingDept(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Academic Departments</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            College organizational hierarchy, department heads, and academic faculties.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/courses')}>
            Course Catalog
          </Button>
          {isAdmin && (
            <Button variant="primary" size="sm" onClick={handleOpenAdd}>
              <Plus size={15} /> Add Department
            </Button>
          )}
        </div>
      </div>

      {errorNotice && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorNotice}</span>
          </div>
          <button onClick={() => setErrorNotice('')} className="underline">Dismiss</button>
        </div>
      )}

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map(dept => {
          const deptStudents = students.filter(s => s.departmentId === dept.id).length;
          const deptTeachers = teachers.filter(t => t.departmentId === dept.id).length;
          const deptCourses = courses.filter(c => c.departmentId === dept.id).length;
          const headTeacher = teachers.find(t => t.id === dept.headId);

          return (
            <Card key={dept.id} className="flex flex-col justify-between hover:border-primary/40 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-xs text-primary px-2 py-0.5 rounded bg-primary/10">
                    {dept.code}
                  </span>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(dept)}>
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-destructive"
                        onClick={() => {
                          setErrorNotice('');
                          setDeletingDept(dept);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>
                <CardTitle className="text-base">{dept.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{dept.description}</p>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="p-2.5 rounded-lg bg-muted/40 text-xs">
                  <span className="text-muted-foreground block text-[11px]">Department Head</span>
                  <span className="font-semibold text-foreground">
                    {headTeacher ? `${headTeacher.firstName} ${headTeacher.lastName}` : 'Unassigned'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-border/50">
                  <div className="p-2 rounded-lg bg-card border border-border">
                    <span className="text-xs font-bold text-foreground block">{deptStudents}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">Students</span>
                  </div>
                  <div className="p-2 rounded-lg bg-card border border-border">
                    <span className="text-xs font-bold text-foreground block">{deptTeachers}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">Faculty</span>
                  </div>
                  <div className="p-2 rounded-lg bg-card border border-border">
                    <span className="text-xs font-bold text-foreground block">{deptCourses}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">Courses</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DepartmentFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDept(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingDept}
      />

      <ConfirmDialog
        isOpen={!!deletingDept}
        onClose={() => setDeletingDept(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        description={`Are you sure you want to delete ${deletingDept?.name}? Deletion will be rejected if students, faculty, or courses are enrolled under this department.`}
        confirmLabel="Delete Department"
      />
    </div>
  );
}
