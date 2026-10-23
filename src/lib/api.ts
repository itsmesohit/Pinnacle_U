// ==========================================
// Frontend API Client for Pinnacle University
// Connects to Express/Prisma/Supabase backend
// ==========================================

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('college_sis_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('college_sis_token', token);
  } else {
    localStorage.removeItem('college_sis_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth & OTP endpoints
  auth: {
    requestRegisterOtp: (email: string, name?: string) =>
      request<{ success: boolean; message: string; simulated?: boolean; otpPreview?: string }>(
        '/auth/register-otp',
        { method: 'POST', body: JSON.stringify({ email, name }) }
      ),

    registerWithOtp: (payload: { email: string; name: string; password: string; role?: string; otp: string }) =>
      request<{ success: boolean; token: string; user: any; message: string }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify(payload) }
      ),

    requestForgotPasswordOtp: (email: string) =>
      request<{ success: boolean; message: string; simulated?: boolean; otpPreview?: string }>(
        '/auth/forgot-password-otp',
        { method: 'POST', body: JSON.stringify({ email }) }
      ),

    verifyResetOtp: (payload: { email: string; otp: string; newPassword: string }) =>
      request<{ success: boolean; message: string }>(
        '/auth/verify-reset-otp',
        { method: 'POST', body: JSON.stringify(payload) }
      ),

    requestLoginOtp: (email: string) =>
      request<{ success: boolean; message: string; simulated?: boolean; otpPreview?: string }>(
        '/auth/login-otp',
        { method: 'POST', body: JSON.stringify({ email }) }
      ),

    verifyLoginOtp: (payload: { email: string; otp: string }) =>
      request<{ success: boolean; token: string; user: any; message?: string }>(
        '/auth/verify-login-otp',
        { method: 'POST', body: JSON.stringify(payload) }
      ),

    login: (email: string, password: string) =>
      request<{ success: boolean; token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    getMe: () => request<{ success: boolean; user: any }>('/auth/me'),
  },

  // Students
  students: {
    getAll: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return request<{ success: boolean; data: any[] }>(`/students${query}`);
    },
    getById: (id: string) => request<{ success: boolean; data: any }>(`/students/${id}`),
    create: (data: any) =>
      request<{ success: boolean; data: any; defaultPassword?: string }>('/students', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/students/${id}`, { method: 'DELETE' }),
    resetPassword: (id: string) =>
      request<{ success: boolean; message: string; defaultPassword: string }>(
        `/students/${id}/reset-password`,
        { method: 'POST' }
      ),
  },

  // Teachers
  teachers: {
    getAll: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return request<{ success: boolean; data: any[] }>(`/teachers${query}`);
    },
    getById: (id: string) => request<{ success: boolean; data: any }>(`/teachers/${id}`),
    create: (data: any) =>
      request<{ success: boolean; data: any; defaultPassword?: string }>('/teachers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/teachers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/teachers/${id}`, { method: 'DELETE' }),
  },

  // Departments
  departments: {
    getAll: () => request<{ success: boolean; data: any[] }>('/departments'),
    getById: (id: string) => request<{ success: boolean; data: any }>(`/departments/${id}`),
    create: (data: any) =>
      request<{ success: boolean; data: any }>('/departments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/departments/${id}`, { method: 'DELETE' }),
  },

  // Courses
  courses: {
    getAll: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return request<{ success: boolean; data: any[] }>(`/courses${query}`);
    },
    getById: (id: string) => request<{ success: boolean; data: any }>(`/courses/${id}`),
    create: (data: any) =>
      request<{ success: boolean; data: any }>('/courses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/courses/${id}`, { method: 'DELETE' }),
  },

  // Enrollments
  enrollments: {
    getAll: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return request<{ success: boolean; data: any[] }>(`/enrollments${query}`);
    },
    create: (data: { studentId: string; courseId: string; enrollmentDate?: string; status?: string }) =>
      request<{ success: boolean; data: any }>('/enrollments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/enrollments/${id}`, { method: 'DELETE' }),
  },

  // Attendance
  attendance: {
    getSessions: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return request<{ success: boolean; data: any[] }>(`/attendance/sessions${query}`);
    },
    getRecords: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return request<{ success: boolean; data: any[] }>(`/attendance/records${query}`);
    },
    saveSession: (data: { courseId: string; date: string; teacherId: string; records: any[] }) =>
      request<{ success: boolean; data: any }>('/attendance/sessions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Grades
  grades: {
    getAll: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return request<{ success: boolean; data: any[] }>(`/grades${query}`);
    },
    create: (data: any) =>
      request<{ success: boolean; data: any }>('/grades', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/grades/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/grades/${id}`, { method: 'DELETE' }),
  },

  // Announcements
  announcements: {
    getAll: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      return request<{ success: boolean; data: any[] }>(`/announcements${query}`);
    },
    create: (data: any) =>
      request<{ success: boolean; data: any }>('/announcements', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/announcements/${id}`, { method: 'DELETE' }),
  },

  // Analytics
  analytics: {
    getDashboard: () => request<{ success: boolean; data: any }>('/analytics/dashboard'),
  },

  // Health
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },
};
