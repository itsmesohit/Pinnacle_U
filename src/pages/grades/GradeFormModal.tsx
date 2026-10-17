import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Grade, GradeFormData, AssessmentType } from '@/types';
import { getCourses, getEnrollmentsByCourse, getStudents } from '@/lib/dataService';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';

const gradeSchema = z.object({
  courseId: z.string().min(1, 'Please select a course'),
  studentId: z.string().min(1, 'Please select a student'),
  assessmentName: z.string().min(2, 'Assessment title is required'),
  assessmentType: z.enum(['quiz', 'midterm', 'final', 'assignment', 'project', 'lab', 'presentation']),
  maxMarks: z.coerce.number().min(1, 'Max marks must be greater than 0'),
  marksObtained: z.coerce.number().min(0, 'Marks obtained must be at least 0'),
  assessmentDate: z.string().min(1, 'Assessment date is required'),
  feedback: z.string().optional(),
}).refine(data => data.marksObtained <= data.maxMarks, {
  message: 'Marks obtained cannot exceed maximum marks',
  path: ['marksObtained'],
});

interface GradeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GradeFormData) => void;
  initialData?: Grade | null;
  defaultCourseId?: string;
}

export function GradeFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultCourseId,
}: GradeFormModalProps) {
  const courses = React.useMemo(() => getCourses(), [isOpen]);
  const allStudents = React.useMemo(() => getStudents(), [isOpen]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<GradeFormData>({
    resolver: zodResolver(gradeSchema) as any,
    defaultValues: {
      courseId: defaultCourseId || courses[0]?.id || '',
      studentId: '',
      assessmentName: 'Midterm Exam',
      assessmentType: 'midterm',
      maxMarks: 100,
      marksObtained: 85,
      assessmentDate: new Date().toISOString().split('T')[0],
      feedback: '',
    },
  });

  const selectedCourseId = watch('courseId');
  const courseEnrollments = React.useMemo(
    () => getEnrollmentsByCourse(selectedCourseId),
    [selectedCourseId]
  );
  const eligibleStudents = React.useMemo(
    () => courseEnrollments.map(e => allStudents.find(s => s.id === e.studentId)).filter(Boolean),
    [courseEnrollments, allStudents]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      reset({
        courseId: initialData.courseId,
        studentId: initialData.studentId,
        assessmentName: initialData.assessmentName,
        assessmentType: initialData.assessmentType,
        maxMarks: initialData.maxMarks,
        marksObtained: initialData.marksObtained,
        assessmentDate: initialData.assessmentDate,
        feedback: initialData.feedback || '',
      });
    } else {
      reset({
        courseId: defaultCourseId || courses[0]?.id || '',
        studentId: eligibleStudents[0]?.id || '',
        assessmentName: 'Midterm Exam',
        assessmentType: 'midterm',
        maxMarks: 100,
        marksObtained: 85,
        assessmentDate: new Date().toISOString().split('T')[0],
        feedback: '',
      });
    }
  }, [isOpen, initialData, defaultCourseId, reset]);

  const assessmentTypeOptions = [
    { label: 'Quiz', value: 'quiz' },
    { label: 'Midterm Exam', value: 'midterm' },
    { label: 'Final Exam', value: 'final' },
    { label: 'Assignment', value: 'assignment' },
    { label: 'Project', value: 'project' },
    { label: 'Lab Work', value: 'lab' },
    { label: 'Presentation', value: 'presentation' },
  ];

  const courseOptions = courses.map(c => ({ label: `${c.code} - ${c.name}`, value: c.id }));
  const studentOptions = eligibleStudents.map(s => ({
    label: `${s!.firstName} ${s!.lastName} (${s!.studentId})`,
    value: s!.id,
  }));

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Assessment Grade' : 'Enter Assessment Grade'}
      description="Record academic evaluation marks and feedback."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
        <Select
          label="Course"
          options={courseOptions}
          {...register('courseId')}
          error={errors.courseId?.message}
        />

        <Select
          label="Enrolled Student"
          options={studentOptions.length > 0 ? studentOptions : [{ label: '-- No students enrolled --', value: '' }]}
          {...register('studentId')}
          error={errors.studentId?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Assessment Title"
            {...register('assessmentName')}
            error={errors.assessmentName?.message}
            placeholder="e.g. Quiz 1 or Final Project"
            required
          />
          <Select
            label="Assessment Type"
            options={assessmentTypeOptions}
            {...register('assessmentType')}
            error={errors.assessmentType?.message}
          />
          <Input
            label="Maximum Marks"
            type="number"
            min={1}
            {...register('maxMarks')}
            error={errors.maxMarks?.message}
            required
          />
          <Input
            label="Marks Obtained"
            type="number"
            min={0}
            {...register('marksObtained')}
            error={errors.marksObtained?.message}
            required
          />
          <div className="sm:col-span-2">
            <Input
              label="Assessment Date"
              type="date"
              {...register('assessmentDate')}
              error={errors.assessmentDate?.message}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Instructor Feedback (Optional)"
              {...register('feedback')}
              placeholder="e.g. Excellent computational logic demonstrated"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            {initialData ? 'Update Grade' : 'Record Grade'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
