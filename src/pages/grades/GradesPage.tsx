import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Award, Plus, Search, Download, Edit2, Trash2, BookOpen,
  TrendingUp, CheckCircle, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent, EmptyState } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { GradeFormModal } from './GradeFormModal';
import { useAuth } from '@/context/AuthContext';
import {
  getGrades, getCourses, getStudents, createGrade,
  updateGrade, deleteGrade, exportToCSV
} from '@/lib/dataService';
import { Grade, GradeFormData } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function GradesPage() {
  const [searchParams] = useSearchParams();
  const { user, isAdmin, isTeacher, isStudent } = useAuth();

  const [courseFilter, setCourseFilter] = useState(searchParams.get('course') || 'all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchStudent, setSearchStudent] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [deletingGrade, setDeletingGrade] = useState<Grade | null>(null);

  const courses = getCourses();
  const allStudents = getStudents();
  const allGrades = getGrades();

  // If student, filter exclusively to their grades
  const currentStudent = isStudent ? allStudents.find(s => s.id === user?.linkedEntityId || s.email === user?.email) : null;

  const filteredGrades = useMemo(() => {
    return allGrades.filter(g => {
      if (isStudent && currentStudent) {
        if (g.studentId !== currentStudent.id) return false;
      }
      const matchesCourse = courseFilter === 'all' || g.courseId === courseFilter;
      const matchesType = typeFilter === 'all' || g.assessmentType === typeFilter;

      const student = allStudents.find(s => s.id === g.studentId);
      const studentName = student ? `${student.firstName} ${student.lastName}`.toLowerCase() : '';
      const matchesSearch = !searchStudent || studentName.includes(searchStudent.toLowerCase()) || g.assessmentName.toLowerCase().includes(searchStudent.toLowerCase());

      return matchesCourse && matchesType && matchesSearch;
    });
  }, [allGrades, isStudent, currentStudent, courseFilter, typeFilter, searchStudent, allStudents]);

  // Grade Distribution chart data
  const gradeDistribution = useMemo(() => {
    const counts: Record<string, number> = { 'A+': 0, 'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0, 'C+': 0, 'C': 0, 'D': 0, 'F': 0 };
    filteredGrades.forEach(g => {
      if (g.gradeLetter && counts[g.gradeLetter] !== undefined) {
        counts[g.gradeLetter]++;
      }
    });
    return Object.entries(counts).map(([letter, count]) => ({ letter, count }));
  }, [filteredGrades]);

  const handleFormSubmit = (data: GradeFormData) => {
    if (editingGrade) {
      updateGrade(editingGrade.id, data);
    } else {
      createGrade(data, user?.linkedEntityId || user?.id || 'admin');
    }
    setIsModalOpen(false);
    setEditingGrade(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingGrade) {
      deleteGrade(deletingGrade.id);
      setDeletingGrade(null);
    }
  };

  const handleExportCSV = () => {
    const data = filteredGrades.map(g => {
      const student = allStudents.find(s => s.id === g.studentId);
      const course = courses.find(c => c.id === g.courseId);
      return {
        'Student ID': student?.studentId,
        'Student Name': `${student?.firstName} ${student?.lastName}`,
        'Course Code': course?.code,
        'Course Name': course?.name,
        'Assessment': g.assessmentName,
        'Type': g.assessmentType,
        'Max Marks': g.maxMarks,
        'Marks Obtained': g.marksObtained,
        'Percentage': `${g.percentage}%`,
        'Grade Letter': g.gradeLetter,
        'Date': g.assessmentDate,
        'Feedback': g.feedback || '',
      };
    });
    exportToCSV(data, `grades_report_${new Date().toISOString().split('T')[0]}`);
  };

  const canEdit = isAdmin || isTeacher;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            {isStudent ? 'My Academic Performance' : 'Grades & Academic Evaluations'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isStudent
              ? 'View your grades, assessment scores, and instructor feedback.'
              : 'Record assessment scores, calculate percentages, and review grade bands.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download size={15} /> Export Gradesheet
          </Button>
          {canEdit && (
            <Button variant="primary" size="sm" onClick={() => { setEditingGrade(null); setIsModalOpen(true); }}>
              <Plus size={15} /> Enter Grade
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 rounded-xl border border-border bg-card shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchStudent}
            onChange={e => setSearchStudent(e.target.value)}
            placeholder="Search by student name or assessment..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={courseFilter}
            onChange={e => setCourseFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground outline-none cursor-pointer"
          >
            <option value="all">All Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground outline-none cursor-pointer"
          >
            <option value="all">All Evaluation Types</option>
            <option value="quiz">Quiz</option>
            <option value="midterm">Midterm Exam</option>
            <option value="final">Final Exam</option>
            <option value="assignment">Assignment</option>
            <option value="project">Project</option>
          </select>
        </div>
      </div>

      {/* Grade Distribution Chart */}
      {!isStudent && filteredGrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cohort Grade Band Distribution</CardTitle>
            <p className="text-xs text-muted-foreground">Frequency of letter grades across selected dataset</p>
          </CardHeader>
          <CardContent>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="letter" tick={{ fontSize: 11 }} stroke="#888888" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#888888" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '0.75rem' }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Assessments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grades Table */}
      {filteredGrades.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    {!isStudent && <th className="py-2.5 px-4">Student</th>}
                    <th className="py-2.5 px-4">Course</th>
                    <th className="py-2.5 px-4">Assessment</th>
                    <th className="py-2.5 px-4">Score</th>
                    <th className="py-2.5 px-4">Percentage</th>
                    <th className="py-2.5 px-4">Grade</th>
                    <th className="py-2.5 px-4">Feedback</th>
                    <th className="py-2.5 px-4">Date</th>
                    {canEdit && <th className="py-2.5 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredGrades.map(g => {
                    const student = allStudents.find(s => s.id === g.studentId);
                    const course = courses.find(c => c.id === g.courseId);
                    return (
                      <tr key={g.id} className="hover:bg-muted/30">
                        {!isStudent && (
                          <td className="py-3 px-4">
                            <span className="font-semibold text-foreground block">
                              {student ? `${student.firstName} ${student.lastName}` : 'Student'}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">{student?.studentId}</span>
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-primary block">{course?.code}</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[140px] block">{course?.name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-foreground block">{g.assessmentName}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{g.assessmentType}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold">
                          {g.marksObtained} / {g.maxMarks}
                        </td>
                        <td className="py-3 px-4 font-bold">{g.percentage}%</td>
                        <td className="py-3 px-4">
                          <Badge variant={g.percentage >= 75 ? 'success' : g.percentage >= 50 ? 'warning' : 'destructive'}>
                            {g.gradeLetter}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground max-w-[160px] truncate">
                          {g.feedback || '—'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{g.assessmentDate}</td>
                        {canEdit && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setEditingGrade(g); setIsModalOpen(true); }}
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:text-destructive"
                                onClick={() => setDeletingGrade(g)}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Award}
          title="No grade records found"
          description="Try selecting another course or assessment filter, or record a new grade evaluation."
        />
      )}

      <GradeFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingGrade(null); }}
        onSubmit={handleFormSubmit}
        initialData={editingGrade}
        defaultCourseId={courseFilter !== 'all' ? courseFilter : undefined}
      />

      <ConfirmDialog
        isOpen={!!deletingGrade}
        onClose={() => setDeletingGrade(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Grade Record"
        description="Are you sure you want to remove this grade entry?"
        confirmLabel="Delete Grade"
      />
    </div>
  );
}
