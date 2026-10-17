import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Teacher, TeacherFormData, EmploymentStatus } from '@/types';
import { getDepartments } from '@/lib/dataService';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';

const teacherSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(7, 'Phone number must be at least 7 characters'),
  departmentId: z.string().min(1, 'Please select a department'),
  designation: z.string().min(2, 'Designation is required'),
  specialization: z.string().min(2, 'Specialization is required'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  status: z.enum(['active', 'on_leave', 'retired', 'terminated']),
});

interface TeacherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TeacherFormData) => void;
  initialData?: Teacher | null;
  isLoading?: boolean;
}

export function TeacherFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: TeacherFormModalProps) {
  const departments = React.useMemo(() => getDepartments(), [isOpen]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema) as any,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      departmentId: departments[0]?.id || '',
      designation: 'Assistant Professor',
      specialization: '',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'active',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      reset({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        email: initialData.email,
        phone: initialData.phone,
        departmentId: initialData.departmentId,
        designation: initialData.designation,
        specialization: initialData.specialization,
        joiningDate: initialData.joiningDate,
        status: initialData.status,
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        departmentId: departments[0]?.id || '',
        designation: 'Assistant Professor',
        specialization: '',
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'active',
      });
    }
  }, [isOpen, initialData, reset]);

  const onFormSubmit = (data: TeacherFormData) => {
    onSubmit(data);
  };

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'On Leave', value: 'on_leave' },
    { label: 'Retired', value: 'retired' },
    { label: 'Terminated', value: 'terminated' },
  ];

  const deptOptions = departments.map(d => ({ label: d.name, value: d.id }));

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Faculty Member' : 'Add New Faculty Member'}
      description="Enter the teacher's professional and academic profile details."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onFormSubmit as any)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            {...register('firstName')}
            error={errors.firstName?.message}
            required
          />
          <Input
            label="Last Name"
            {...register('lastName')}
            error={errors.lastName?.message}
            required
          />
          <Input
            label="Email Address"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            required
          />
          <Input
            label="Phone Number"
            {...register('phone')}
            error={errors.phone?.message}
            placeholder="+1-555-0000"
            required
          />
          <Select
            label="Department"
            options={deptOptions}
            {...register('departmentId')}
            error={errors.departmentId?.message}
          />
          <Input
            label="Designation"
            {...register('designation')}
            error={errors.designation?.message}
            placeholder="e.g. Associate Professor"
            required
          />
          <Input
            label="Specialization / Research"
            {...register('specialization')}
            error={errors.specialization?.message}
            placeholder="e.g. Artificial Intelligence"
            required
          />
          <Input
            label="Joining Date"
            type="date"
            {...register('joiningDate')}
            error={errors.joiningDate?.message}
            required
          />
          <div className="sm:col-span-2">
            <Select
              label="Employment Status"
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
            {initialData ? 'Save Changes' : 'Add Faculty Member'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
