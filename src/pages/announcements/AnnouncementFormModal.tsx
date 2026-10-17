import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Announcement, AnnouncementFormData, AnnouncementAudience } from '@/types';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';

const announcementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  message: z.string().min(10, 'Message body must be at least 10 characters'),
  audience: z.enum(['all', 'teachers', 'students']),
  expiryDate: z.string().optional(),
});

interface AnnouncementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AnnouncementFormData) => void;
  initialData?: Announcement | null;
}

export function AnnouncementFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: AnnouncementFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema) as any,
    defaultValues: {
      title: '',
      message: '',
      audience: 'all',
      expiryDate: '',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      reset({
        title: initialData.title,
        message: initialData.message,
        audience: initialData.audience,
        expiryDate: initialData.expiryDate || '',
      });
    } else {
      reset({
        title: '',
        message: '',
        audience: 'all',
        expiryDate: '',
      });
    }
  }, [isOpen, initialData, reset]);

  const audienceOptions = [
    { label: 'All Users (Campus-Wide)', value: 'all' },
    { label: 'Faculty Members Only', value: 'teachers' },
    { label: 'Students Only', value: 'students' },
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Announcement' : 'Publish New Announcement'}
      description="Post campus updates, schedule notices, and administrative alerts."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
        <Input
          label="Announcement Title"
          {...register('title')}
          error={errors.title?.message}
          placeholder="e.g. Fall 2024 Exam Registration Deadline"
          required
        />

        <div className="w-full space-y-1.5 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Message Body <span className="text-destructive">*</span>
          </label>
          <textarea
            {...register('message')}
            rows={4}
            className="w-full rounded-lg border border-input bg-card p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            placeholder="Write announcement details..."
          />
          {errors.message && <p className="text-xs font-medium text-destructive">{errors.message.message}</p>}
        </div>

        <Select
          label="Target Audience"
          options={audienceOptions}
          {...register('audience')}
          error={errors.audience?.message}
        />

        <Input
          label="Optional Expiry Date"
          type="date"
          {...register('expiryDate')}
          error={errors.expiryDate?.message}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            {initialData ? 'Update Notice' : 'Broadcast Announcement'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
