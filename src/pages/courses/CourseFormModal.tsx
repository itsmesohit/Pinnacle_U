import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Course, CourseFormData, CourseStatus } from '@/types';
import { getDepartments, getTeachers } from '@/lib/dataService';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';

const courseSchema = z.object({
  code: z.string().min(2, 'Code is required (e.g. CS101)'),
  name: z.string().min(3, 'Course name must be at least 3 characters'),
  description: z.string().min(5, 'Description is required'),
  departmentId: z.string().min(1, 'Please select a department'),
  credits: z.coerce.number().min(1).max(6),
  semester: z.coerce.number().min(1).max(10),
  academicYear: z.coerce.number().min(2020).max(2030),
  teacherId: z.string().optional(),
  maxEnrollment: z.coerce.number().min(5).max(200),
  status: z.enum(['active', 'inactive', 'completed', 'upcoming']),
});

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CourseFormData) => void;
  initialData?: Course | null;
  isLoading?: boolean;
}

export function CourseFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: CourseFormModalProps) {
  const departments = React.useMemo(() => getDepartments(), [isOpen]);
  const teachers = React.useMemo(() => getTeachers(), [isOpen]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema) as any,
    defaultValues: {
      code: '',
      name: '',
      description: '',
      departmentId: departments[0]?.id || '',
      credits: 3,
      semester: 1,
      academicYear: 2024,
      teacherId: '',
      maxEnrollment: 40,
      status: 'active',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      reset({
        code: initialData.code,
        name: initialData.name,
        description: initialData.description,
        departmentId: initialData.departmentId,
        credits: initialData.credits,
        semester: initialData.semester,
        academicYear: initialData.academicYear,
        teacherId: initialData.teacherId || '',
        maxEnrollment: initialData.maxEnrollment,
        status: initialData.status,
      });
    } else {
      reset({
        code: '',
        name: '',
        description: '',
        departmentId: departments[0]?.id || '',
        credits: 3,
        semester: 1,
        academicYear: 2024,
        teacherId: '',
        maxEnrollment: 40,
        status: 'active',
      });
    }
  }, [isOpen, initialData, reset]);

  const onFormSubmit = (data: CourseFormData) => {
    onSubmit({
      ...data,
      teacherId: data.teacherId || undefined,
    });
  };

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Completed', value: 'completed' },
  ];

  const deptOptions = departments.map(d => ({ label: d.name, value: d.id }));
  const teacherOptions = [
    { label: '-- Unassigned --', value: '' },
    ...teachers.map(t => ({ label: `${t.firstName} ${t.lastName} (${t.designation})`, value: t.id })),
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Course' : 'Create New Course'}
      description="Define the curriculum details, credit load, and assigned instructor."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit as any)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Course Code"
            {...register('code')}
            error={errors.code?.message}
            placeholder="e.g. CS201"
            required
          />
          <Input
            label="Course Title"
            {...register('name')}
            error={errors.name?.message}
            placeholder="e.g. Data Structures & Algorithms"
            required
          />
          <div className="sm:col-span-2">
            <Input
              label="Course Description"
              {...register('description')}
              error={errors.description?.message}
              placeholder="Outline syllabus and learning objectives"
              required
            />
          </div>
          <Select
            label="Department"
            options={deptOptions}
            {...register('departmentId')}
            error={errors.departmentId?.message}
          />
          <Select
            label="Assigned Instructor"
            options={teacherOptions}
            {...register('teacherId')}
            error={errors.teacherId?.message}
          />
          <Input
            label="Academic Credits"
            type="number"
            min={1}
            max={6}
            {...register('credits')}
            error={errors.credits?.message}
            required
          />
          <Input
            label="Semester"
            type="number"
            min={1}
            max={10}
            {...register('semester')}
            error={errors.semester?.message}
            required
          />
          <Input
            label="Academic Year"
            type="number"
            {...register('academicYear')}
            error={errors.academicYear?.message}
            required
          />
          <Input
            label="Max Enrollment Capacity"
            type="number"
            min={5}
            max={200}
            {...register('maxEnrollment')}
            error={errors.maxEnrollment?.message}
            required
          />
          <div className="sm:col-span-2">
            <Select
              label="Course Status"
              options={statusOptions}
              {...register('status')}
              error={errors.status?.message}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            {initialData ? 'Update Course' : 'Create Course'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
