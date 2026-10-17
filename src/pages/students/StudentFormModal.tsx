import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Student, StudentFormData, Gender, StudentStatus } from '@/types';
import { getDepartments } from '@/lib/dataService';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';

const studentSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(7, 'Phone number must be at least 7 characters'),
  dateOfBirth: z.string().refine(val => new Date(val) <= new Date(), {
    message: 'Date of birth cannot be in the future',
  }),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say', 'other']),
  departmentId: z.string().min(1, 'Please select a department'),
  program: z.string().min(2, 'Program/Degree is required'),
  academicYear: z.coerce.number().min(1).max(5),
  semester: z.coerce.number().min(1).max(10),
  enrollmentDate: z.string().min(1, 'Enrollment date is required'),
  status: z.enum(['active', 'inactive', 'graduated', 'suspended']),
  address: z.string().min(3, 'Address is required'),
  guardianName: z.string().min(2, 'Guardian name is required'),
  guardianContact: z.string().min(7, 'Guardian contact number is required'),
  emergencyContact: z.string().optional(),
});

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudentFormData) => void;
  initialData?: Student | null;
  isLoading?: boolean;
}

export function StudentFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: StudentFormModalProps) {
  const departments = React.useMemo(() => getDepartments(), [isOpen]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema) as any,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '2004-01-15',
      gender: 'male',
      departmentId: departments[0]?.id || '',
      program: 'B.Sc. Computer Science',
      academicYear: 1,
      semester: 1,
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: 'active',
      address: '',
      guardianName: '',
      guardianContact: '',
      emergencyContact: '',
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
        dateOfBirth: initialData.dateOfBirth,
        gender: initialData.gender,
        departmentId: initialData.departmentId,
        program: initialData.program,
        academicYear: initialData.academicYear,
        semester: initialData.semester,
        enrollmentDate: initialData.enrollmentDate,
        status: initialData.status,
        address: initialData.address,
        guardianName: initialData.guardianName,
        guardianContact: initialData.guardianContact,
        emergencyContact: initialData.emergencyContact || '',
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '2004-01-15',
        gender: 'male',
        departmentId: departments[0]?.id || '',
        program: 'B.Sc. Computer Science',
        academicYear: 1,
        semester: 1,
        enrollmentDate: new Date().toISOString().split('T')[0],
        status: 'active',
        address: '',
        guardianName: '',
        guardianContact: '',
        emergencyContact: '',
      });
    }
  }, [isOpen, initialData, reset]);

  const onFormSubmit = (data: StudentFormData) => {
    onSubmit(data);
  };

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Non-binary', value: 'non-binary' },
    { label: 'Prefer not to say', value: 'prefer-not-to-say' },
    { label: 'Other', value: 'other' },
  ];

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Graduated', value: 'graduated' },
    { label: 'Suspended', value: 'suspended' },
  ];

  const deptOptions = departments.map(d => ({ label: d.name, value: d.id }));

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Student Profile' : 'Enroll New Student'}
      description="Fill in the student academic and personal information below."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onFormSubmit as any)} className="space-y-6">
        {/* Personal Details */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1 mb-3">
            Personal Information
          </h4>
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
            <Input
              label="Date of Birth"
              type="date"
              {...register('dateOfBirth')}
              error={errors.dateOfBirth?.message}
              required
            />
            <Select
              label="Gender"
              options={genderOptions}
              {...register('gender')}
              error={errors.gender?.message}
            />
          </div>
        </div>

        {/* Academic Details */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1 mb-3">
            Academic Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Department"
              options={deptOptions}
              {...register('departmentId')}
              error={errors.departmentId?.message}
            />
            <Input
              label="Program / Degree"
              {...register('program')}
              error={errors.program?.message}
              placeholder="e.g. B.Sc. Computer Science"
              required
            />
            <Input
              label="Academic Year"
              type="number"
              min={1}
              max={5}
              {...register('academicYear')}
              error={errors.academicYear?.message}
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
              label="Enrollment Date"
              type="date"
              {...register('enrollmentDate')}
              error={errors.enrollmentDate?.message}
              required
            />
            <Select
              label="Student Status"
              options={statusOptions}
              {...register('status')}
              error={errors.status?.message}
            />
          </div>
        </div>

        {/* Guardian and Contact */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1 mb-3">
            Contact & Guardian
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Home Address"
                {...register('address')}
                error={errors.address?.message}
                placeholder="Street address, City, State, ZIP"
                required
              />
            </div>
            <Input
              label="Guardian Name"
              {...register('guardianName')}
              error={errors.guardianName?.message}
              required
            />
            <Input
              label="Guardian Contact"
              {...register('guardianContact')}
              error={errors.guardianContact?.message}
              placeholder="+1-555-0000"
              required
            />
            <div className="sm:col-span-2">
              <Input
                label="Emergency Contact (Optional)"
                {...register('emergencyContact')}
                error={errors.emergencyContact?.message}
                placeholder="+1-555-9999"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            {initialData ? 'Update Student' : 'Save & Enroll Student'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
