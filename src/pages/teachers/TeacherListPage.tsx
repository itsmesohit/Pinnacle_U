import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, Download, Edit2, Trash2, Eye, RotateCcw, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '@/components/ui/Table';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/Card';
import { TeacherFormModal } from './TeacherFormModal';
import { useAuth } from '@/context/AuthContext';
import {
  getTeachers, getDepartments, getCourses, createTeacher,
  updateTeacher, deleteTeacher, exportToCSV
} from '@/lib/dataService';
import { Teacher, TeacherFormData } from '@/types';

export function TeacherListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'teacherId' | 'joiningDate'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'new');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);

  const teachers = getTeachers();
  const departments = getDepartments();
  const courses = getCourses();
  const deptMap = useMemo(() => new Map(departments.map(d => [d.id, d.name])), [departments]);

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Teacher, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTeacher(t);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (t: Teacher, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingTeacher(t);
  };

  const handleFormSubmit = (data: TeacherFormData) => {
    if (editingTeacher) {
      updateTeacher(editingTeacher.id, data);
    } else {
      createTeacher(data);
    }
    setIsModalOpen(false);
    setEditingTeacher(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingTeacher) {
      deleteTeacher(deletingTeacher.id);
      setDeletingTeacher(null);
    }
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const q = searchQuery.toLowerCase();
      const fullName = `${t.firstName} ${t.lastName}`.toLowerCase();
      const matchesSearch = !q || fullName.includes(q) || t.teacherId.toLowerCase().includes(q) || t.email.toLowerCase().includes(q);
      const matchesDept = deptFilter === 'all' || t.departmentId === deptFilter;
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [teachers, searchQuery, deptFilter, statusFilter]);

  const sortedTeachers = useMemo(() => {
    return [...filteredTeachers].sort((a, b) => {
      let valA: string = '';
      let valB: string = '';
      if (sortField === 'name') {
        valA = `${a.firstName} ${a.lastName}`.toLowerCase();
        valB = `${b.firstName} ${b.lastName}`.toLowerCase();
      } else if (sortField === 'teacherId') {
        valA = a.teacherId;
        valB = b.teacherId;
      } else if (sortField === 'joiningDate') {
        valA = a.joiningDate;
        valB = b.joiningDate;
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTeachers, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedTeachers.length / pageSize));
  const paginatedTeachers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedTeachers.slice(start, start + pageSize);
  }, [sortedTeachers, page, pageSize]);

  const handleSort = (field: 'name' | 'teacherId' | 'joiningDate') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportCSV = () => {
    const data = filteredTeachers.map(t => ({
      'Teacher ID': t.teacherId,
      'First Name': t.firstName,
      'Last Name': t.lastName,
      'Email': t.email,
      'Phone': t.phone,
      'Department': deptMap.get(t.departmentId) || t.departmentId,
      'Designation': t.designation,
      'Specialization': t.specialization,
      'Joining Date': t.joiningDate,
      'Status': t.status,
    }));
    exportToCSV(data, `teachers_export_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Faculty Directory</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage academic professors, lecturer assignments, and departmental roles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </Button>
          {isAdmin && (
            <Button variant="primary" size="sm" onClick={handleOpenAdd}>
              <Plus size={15} /> Add Faculty
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 rounded-xl border border-border bg-card shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search faculty by name, ID, or email..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
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

          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="retired">Retired</option>
            <option value="terminated">Terminated</option>
          </select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearchQuery(''); setDeptFilter('all'); setStatusFilter('all'); setPage(1); }}
          >
            <RotateCcw size={14} className="mr-1" /> Reset
          </Button>
        </div>
      </div>

      {paginatedTeachers.length > 0 ? (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  sortable
                  sortDirection={sortField === 'teacherId' ? sortDirection : null}
                  onSort={() => handleSort('teacherId')}
                >
                  Faculty ID
                </TableHead>
                <TableHead
                  sortable
                  sortDirection={sortField === 'name' ? sortDirection : null}
                  onSort={() => handleSort('name')}
                >
                  Name
                </TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation & Field</TableHead>
                <TableHead
                  sortable
                  sortDirection={sortField === 'joiningDate' ? sortDirection : null}
                  onSort={() => handleSort('joiningDate')}
                >
                  Joined
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTeachers.map(teacher => {
                const assigned = courses.filter(c => c.teacherId === teacher.id);
                return (
                  <TableRow
                    key={teacher.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/teachers/${teacher.id}`)}
                  >
                    <TableCell className="font-mono font-semibold text-xs text-primary">
                      {teacher.teacherId}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">
                        {teacher.firstName} {teacher.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{teacher.email}</div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {deptMap.get(teacher.departmentId) || 'Department'}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{teacher.designation}</div>
                      <div className="text-xs text-muted-foreground">{teacher.specialization}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {teacher.joiningDate}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={teacher.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/teachers/${teacher.id}`)}
                          title="View Details"
                        >
                          <Eye size={15} />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={e => handleOpenEdit(teacher, e)}
                              title="Edit"
                            >
                              <Edit2 size={15} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={e => handleOpenDelete(teacher, e)}
                              title="Delete"
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
            totalItems={sortedTeachers.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      ) : (
        <EmptyState
          icon={GraduationCap}
          title="No faculty members found"
          description="Adjust your search filters or add a new faculty member."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSearchQuery(''); setDeptFilter('all'); setStatusFilter('all'); }}
            >
              Reset Filters
            </Button>
          }
        />
      )}

      <TeacherFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTeacher(null);
          if (searchParams.get('action')) setSearchParams({});
        }}
        onSubmit={handleFormSubmit}
        initialData={editingTeacher}
      />

      <ConfirmDialog
        isOpen={!!deletingTeacher}
        onClose={() => setDeletingTeacher(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Faculty Member"
        description={`Are you sure you want to remove ${deletingTeacher?.firstName} ${deletingTeacher?.lastName}? Any course taught by this professor will become unassigned.`}
        confirmLabel="Remove Faculty"
      />
    </div>
  );
}
