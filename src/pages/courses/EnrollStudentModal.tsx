import React, { useState } from 'react';
import { Course } from '@/types';
import { getStudents, getEnrollmentsByCourse, enrollStudent } from '@/lib/dataService';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Search, UserPlus, AlertCircle } from 'lucide-react';

interface EnrollStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
}

export function EnrollStudentModal({ isOpen, onClose, course }: EnrollStudentModalProps) {
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const allStudents = getStudents();
  const currentEnrollments = getEnrollmentsByCourse(course.id);
  const enrolledStudentIds = new Set(currentEnrollments.map(e => e.studentId));

  const availableStudents = allStudents.filter(s => {
    const isEnrolled = enrolledStudentIds.has(s.id);
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchesSearch = !search || fullName.includes(search.toLowerCase()) || s.studentId.toLowerCase().includes(search.toLowerCase());
    return !isEnrolled && matchesSearch && s.status === 'active';
  });

  const handleEnroll = (studentId: string) => {
    setError('');
    const result = enrollStudent(studentId, course.id);
    if (!result.success) {
      setError(result.error || 'Failed to enroll student');
    }
  };

  const seatsLeft = course.maxEnrollment - currentEnrollments.length;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Enroll Students: ${course.name}`}
      description={`Course Code: ${course.code} • Available Seats: ${seatsLeft} of ${course.maxEnrollment}`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {seatsLeft <= 0 ? (
          <div className="p-4 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-medium text-center">
            This course has reached its maximum enrollment capacity ({course.maxEnrollment}). No additional seats can be granted.
          </div>
        ) : (
          <>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search eligible students by name or ID..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-border/60 border border-border rounded-xl">
              {availableStudents.slice(0, 15).map(student => (
                <div key={student.id} className="p-3 flex items-center justify-between hover:bg-muted/30 text-xs">
                  <div>
                    <p className="font-semibold text-foreground">{student.firstName} {student.lastName}</p>
                    <p className="text-[11px] text-muted-foreground">{student.studentId} • {student.program}</p>
                  </div>
                  <Button size="sm" variant="subtle" onClick={() => handleEnroll(student.id)}>
                    <UserPlus size={14} className="mr-1" /> Enroll
                  </Button>
                </div>
              ))}
              {availableStudents.length === 0 && (
                <p className="p-6 text-center text-xs text-muted-foreground">
                  No eligible active students found matching search.
                </p>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
