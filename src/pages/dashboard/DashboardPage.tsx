import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { TeacherDashboard } from './TeacherDashboard';
import { StudentDashboard } from './StudentDashboard';

export function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'teacher') {
    return <TeacherDashboard />;
  }

  if (user?.role === 'student') {
    return <StudentDashboard />;
  }

  return <AdminDashboard />;
}
