import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Filter, Download, Plus, Trash2, Edit2, Eye,
  RotateCcw, Users, GraduationCap, CheckSquare, Square
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '@/components/ui/Table';
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/Card';
import { StudentFormModal } from './StudentFormModal';
import { useAuth } from '@/context/AuthContext';
import {
  getStudents, getDepartments, createStudent, updateStudent,
  deleteStudent, exportToCSV
} from '@/lib/dataService';
import { Student, StudentFormData } from '@/types';

export function StudentListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAuth();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'studentId' | 'enrollmentDate'>('studentId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog states
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'new');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [createdCredential, setCreatedCredential] = useState<{ name: string; email: string; studentId: string; password: string } | null>(null);

  // Data
  const students = getStudents();
  const departments = getDepartments();
  const deptMap = useMemo(() => new Map(departments.map(d => [d.id, d.name])), [departments]);

  // Handle open add modal
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingStudent(student);
  };

  const handleFormSubmit = (data: StudentFormData) => {
    if (editingStudent) {
      updateStudent(editingStudent.id, data);
    } else {
      const created = createStudent(data);
      setCreatedCredential({
        name: `${created.firstName} ${created.lastName}`,
        email: created.email,
        studentId: created.studentId,
        password: 'student123',
      });
    }
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingStudent) {
      deleteStudent(deletingStudent.id);
      setSelectedIds(prev => prev.filter(id => id !== deletingStudent.id));
      setDeletingStudent(null);
    }
  };

  const handleBulkDeleteConfirm = () => {
    selectedIds.forEach(id => deleteStudent(id));
    setSelectedIds([]);
    setIsBulkDeleteOpen(false);
  };

  // Filter & Search
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const q = searchQuery.toLowerCase();
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      const matchesSearch = !q || fullName.includes(q) || s.studentId.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      const matchesDept = deptFilter === 'all' || s.departmentId === deptFilter;
      const matchesYear = yearFilter === 'all' || s.academicYear === Number(yearFilter);
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesDept && matchesYear && matchesStatus;
    });
  }, [students, searchQuery, deptFilter, yearFilter, statusFilter]);

  // Sort
  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (sortField === 'name') {
        valA = `${a.firstName} ${a.lastName}`.toLowerCase();
        valB = `${b.firstName} ${b.lastName}`.toLowerCase();
      } else if (sortField === 'studentId') {
        valA = a.studentId;
        valB = b.studentId;
      } else if (sortField === 'enrollmentDate') {
        valA = a.enrollmentDate;
        valB = b.enrollmentDate;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredStudents, sortField, sortDirection]);

  // Paginated
  const totalPages = Math.max(1, Math.ceil(sortedStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedStudents.slice(start, start + pageSize);
  }, [sortedStudents, page, pageSize]);

  const handleSort = (field: 'name' | 'studentId' | 'enrollmentDate') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedStudents.map(s => s.id));
    }
  };

  const handleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDeptFilter('all');
    setYearFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  const handleExportCSV = () => {
    const dataToExport = (selectedIds.length > 0
      ? students.filter(s => selectedIds.includes(s.id))
      : filteredStudents
    ).map(s => ({
      'Student ID': s.studentId,
      'First Name': s.firstName,
      'Last Name': s.lastName,
      'Email': s.email,
      'Phone': s.phone,
      'Department': deptMap.get(s.departmentId) || s.departmentId,
      'Program': s.program,
      'Academic Year': s.academicYear,
      'Semester': s.semester,
      'Status': s.status,
      'Enrollment Date': s.enrollmentDate,
    }));
    exportToCSV(dataToExport, `students_export_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Students Directory</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage student registrations, academic statuses, and student profiles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </Button>
          {isAdmin && (
            <Button variant="primary" size="sm" onClick={handleOpenAdd}>
              <Plus size={15} /> Add Student
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 rounded-xl border border-border bg-card shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search student name, ID, or email..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Department */}
          <select
            value={deptFilter}
            onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground outline-none cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Academic Year */}
          <select
            value={yearFilter}
            onChange={e => { setYearFilter(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground outline-none cursor-pointer"
          >
            <option value="all">All Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
            <option value="suspended">Suspended</option>
          </select>

          <Button variant="ghost" size="sm" onClick={handleResetFilters} title="Reset filters">
            <RotateCcw size={14} className="mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* Selected Action Bar */}
      {isAdmin && selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs">
          <span className="font-semibold text-primary">
            {selectedIds.length} student{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteOpen(true)}>
              <Trash2 size={14} /> Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {paginatedStudents.length > 0 ? (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && (
                  <TableHead className="w-10">
                    <button onClick={handleSelectAll} className="flex items-center text-muted-foreground hover:text-foreground">
                      {selectedIds.length === paginatedStudents.length && paginatedStudents.length > 0 ? (
                        <CheckSquare size={16} className="text-primary" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </TableHead>
                )}
                <TableHead
                  sortable
                  sortDirection={sortField === 'studentId' ? sortDirection : null}
                  onSort={() => handleSort('studentId')}
                >
                  Student ID
                </TableHead>
                <TableHead
                  sortable
                  sortDirection={sortField === 'name' ? sortDirection : null}
                  onSort={() => handleSort('name')}
                >
                  Name
                </TableHead>
                <TableHead>Department / Program</TableHead>
                <TableHead>Year / Sem</TableHead>
                <TableHead
                  sortable
                  sortDirection={sortField === 'enrollmentDate' ? sortDirection : null}
                  onSort={() => handleSort('enrollmentDate')}
                >
                  Enrolled
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map(student => {
                const isSelected = selectedIds.includes(student.id);
                return (
                  <TableRow
                    key={student.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/students/${student.id}`)}
                  >
                    {isAdmin && (
                      <TableCell onClick={e => handleSelectRow(student.id, e)}>
                        <button className="flex items-center text-muted-foreground hover:text-foreground">
                          {isSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                        </button>
                      </TableCell>
                    )}
                    <TableCell className="font-mono font-semibold text-xs text-primary">
                      {student.studentId}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{student.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground truncate max-w-[180px]">
                        {deptMap.get(student.departmentId) || 'Department'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {student.program}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      Year {student.academicYear}, Sem {student.semester}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {student.enrollmentDate}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={student.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/students/${student.id}`)}
                          title="View Profile"
                        >
                          <Eye size={15} />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={e => handleOpenEdit(student, e)}
                              title="Edit Student"
                            >
                              <Edit2 size={15} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={e => handleOpenDelete(student, e)}
                              title="Delete Student"
                              className="hover:text-destructive"
                            >
                              <Trash2 size={15} />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={sortedStudents.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No students match criteria"
          description="Try adjusting your search terms or clearing your department and status filters."
          action={
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          }
        />
      )}

      {/* Add / Edit Form Modal */}
      <StudentFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
          if (searchParams.get('action')) setSearchParams({});
        }}
        onSubmit={handleFormSubmit}
        initialData={editingStudent}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingStudent}
        onClose={() => setDeletingStudent(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Student Record"
        description={`Are you sure you want to delete ${deletingStudent?.firstName} ${deletingStudent?.lastName}? All associated attendance, enrollments, and grades will also be permanently removed.`}
        confirmLabel="Delete Student"
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Multiple Students"
        description={`Are you sure you want to delete all ${selectedIds.length} selected students? This action is irreversible.`}
        confirmLabel={`Delete ${selectedIds.length} Students`}
      />

      {/* Student Enrolled Credential Notice */}
      {createdCredential && (
        <Dialog
          isOpen={!!createdCredential}
          onClose={() => setCreatedCredential(null)}
          title="Student Login Credentials Created"
          description="The student has been enrolled and an access account has been generated."
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Student Name</span>
                <span className="font-bold text-foreground text-sm">{createdCredential.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Student ID</span>
                  <span className="font-mono font-bold text-primary">{createdCredential.studentId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Initial Password</span>
                  <span className="font-mono font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {createdCredential.password}
                  </span>
                </div>
              </div>
              <div className="pt-1 border-t border-border/50">
                <span className="text-muted-foreground block text-[11px]">Login Email</span>
                <span className="font-mono font-medium text-foreground">{createdCredential.email}</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Share these credentials with the student. They can log in immediately from the login screen, or reset their password anytime using the <strong>Forgot Password</strong> option.
            </p>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="primary" onClick={() => setCreatedCredential(null)}>
                Done
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
