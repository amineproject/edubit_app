import { AppDataResponse, DecodedJwt, User } from '../types';

const TOKEN_KEY = 'edubits_jwt_token';

export const authStorage = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  },
  decodeToken: (token: string | null): DecodedJwt | null => {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(payloadBase64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      if (response.status === 401) {
        authStorage.removeToken();
      }
    }
    const message = data.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ success: boolean; token: string; user: User; message: string }> {
    const res = await request<{ success: boolean; token: string; user: User; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (res.token) {
      authStorage.setToken(res.token);
    }
    return res;
  },

  async getMe(): Promise<{ success: boolean; user: User; jwtPayload: DecodedJwt }> {
    return request<{ success: boolean; user: User; jwtPayload: DecodedJwt }>('/api/auth/me');
  },

  logout() {
    authStorage.removeToken();
  },

  // Core Data
  async fetchAppData(): Promise<AppDataResponse> {
    return request<AppDataResponse>('/api/data');
  },

  // Student Management (Guru only)
  async createStudent(studentData: {
    username?: string;
    email?: string;
    password: string;
    full_name: string;
    nis: string;
    class_id: string;
    phone?: string;
  }) {
    return request<{ success: boolean; message: string; student: any }>('/api/students', {
      method: 'POST',
      body: JSON.stringify(studentData)
    });
  },

  async updateStudent(id: string, updateData: any) {
    return request<{ success: boolean; message: string; student: any }>(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  },

  async deleteStudent(id: string) {
    return request<{ success: boolean; message: string }>(`/api/students/${id}`, {
      method: 'DELETE'
    });
  },

  // Materials
  async addMaterial(materialData: {
    subject_id: string;
    class_id: string;
    title: string;
    description: string;
    url: string;
    type: 'pdf' | 'video' | 'link' | 'doc';
  }) {
    return request<{ success: boolean; message: string; material: any }>('/api/materials', {
      method: 'POST',
      body: JSON.stringify(materialData)
    });
  },

  async deleteMaterial(id: string) {
    return request<{ success: boolean; message: string }>(`/api/materials/${id}`, {
      method: 'DELETE'
    });
  },

  // Assignments
  async addAssignment(assignmentData: {
    subject_id: string;
    class_id: string;
    title: string;
    description: string;
    due_date: string;
    max_score?: number;
  }) {
    return request<{ success: boolean; message: string; assignment: any }>('/api/assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData)
    });
  },

  async deleteAssignment(id: string) {
    return request<{ success: boolean; message: string }>(`/api/assignments/${id}`, {
      method: 'DELETE'
    });
  },

  // Submissions (Siswa submit)
  async submitAssignment(data: {
    assignment_id: string;
    submission_text?: string;
    submission_url?: string;
  }) {
    return request<{ success: boolean; message: string; evaluation: any }>('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Grading (Guru grades)
  async gradeEvaluation(data: {
    evaluation_id?: string;
    assignment_id?: string;
    student_id?: string;
    grade?: number | null;
    status?: 'TUNTAS' | 'REMIDIAL' | 'BELUM';
    teacher_notes: string;
  }) {
    return request<{ success: boolean; message: string; evaluation: any }>('/api/evaluations/grade', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Announcements
  async addAnnouncement(data: {
    title: string;
    content: string;
    target_class_id: string;
    badge?: string;
  }) {
    return request<{ success: boolean; message: string; announcement: any }>('/api/announcements', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteAnnouncement(id: string) {
    return request<{ success: boolean; message: string }>(`/api/announcements/${id}`, {
      method: 'DELETE'
    });
  },

  // Classes & Subjects
  async addClass(data: { class_name: string; level?: string; academic_year?: string }) {
    return request<{ success: boolean; message: string; newClass: any }>('/api/classes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async addSubject(data: { subject_name: string; code?: string; icon?: string }) {
    return request<{ success: boolean; message: string; newSubject: any }>('/api/subjects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async resetData() {
    return request<{ success: boolean; message: string }>('/api/reset-data', {
      method: 'POST'
    });
  }
};
