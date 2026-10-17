import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { StudentListPage } from '@/pages/students/StudentListPage';
import { StudentDetailsPage } from '@/pages/students/StudentDetailsPage';
import { TeacherListPage } from '@/pages/teachers/TeacherListPage';
import { TeacherDetailsPage } from '@/pages/teachers/TeacherDetailsPage';
import { CourseListPage } from '@/pages/courses/CourseListPage';
import { CourseDetailsPage } from '@/pages/courses/CourseDetailsPage';
import { DepartmentListPage } from '@/pages/departments/DepartmentListPage';
import { AttendancePage } from '@/pages/attendance/AttendancePage';
import { GradesPage } from '@/pages/grades/GradesPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { AnnouncementsPage } from '@/pages/announcements/AnnouncementsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'students',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'teacher']}>
            <StudentListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'students/:id',
        element: <StudentDetailsPage />,
      },
      {
        path: 'teachers',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <TeacherListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teachers/:id',
        element: <TeacherDetailsPage />,
      },
      {
        path: 'courses',
        element: <CourseListPage />,
      },
      {
        path: 'courses/:id',
        element: <CourseDetailsPage />,
      },
      {
        path: 'departments',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <DepartmentListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'attendance',
        element: <AttendancePage />,
      },
      {
        path: 'grades',
        element: <GradesPage />,
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'announcements',
        element: <AnnouncementsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
