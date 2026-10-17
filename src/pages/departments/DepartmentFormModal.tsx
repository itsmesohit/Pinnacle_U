import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Department, DepartmentFormData } from '@/types';
import { getTeachers } from '@/lib/dataService';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';

const deptSchema = z.object({
  name: z.string().min(3, 'Department name is required'),
  code: z.string().min(2, 'Department code is required (e.g. CS)'),
  description: z.string().min(5, 'Description is required'),
  headId: z.string().optional(),
});

interface DepartmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DepartmentFormData) => void;
  initialData?: Department | null;
  isLoading?: boolean;
}

export function DepartmentFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: DepartmentFormModalProps) {
  const teachers = React.useMemo(() => getTeachers(), [isOpen]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(deptSchema) as any,
    defaultValues: {
      name: '',
      code: '',
      description: '',
      headId: '',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      reset({
        name: initialData.name,
        code: initialData.code,
        description: initialData.description,
        headId: initialData.headId || '',
      });
    } else {
      reset({
        name: '',
        code: '',
        description: '',
        headId: '',
      });
    }
  }, [isOpen, initialData, reset]);

  const onFormSubmit = (data: DepartmentFormData) => {
    onSubmit({
      ...data,
      headId: data.headId || undefined,
    });
  };

  const headOptions = [
    { label: '-- Select Department Head --', value: '' },
    ...teachers.map(t => ({ label: `${t.firstName} ${t.lastName} (${t.designation})`, value: t.id })),
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Department' : 'Create New Department'}
      description="Configure faculty department structure and appoint department head."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onFormSubmit as any)} className="space-y-4">
        <Input
          label="Department Name"
          {...register('name')}
          error={errors.name?.message}
          placeholder="e.g. Electrical Engineering"
          required
        />
        <Input
          label="Department Code"
          {...register('code')}
          error={errors.code?.message}
          placeholder="e.g. EE"
          required
        />
        <Input
          label="Description"
          {...register('description')}
          error={errors.description?.message}
          placeholder="Overview of the academic department"
          required
        />
        <Select
          label="Department Head (Dean / Chair)"
          options={headOptions}
          {...register('headId')}
          error={errors.headId?.message}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            {initialData ? 'Update Department' : 'Create Department'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
