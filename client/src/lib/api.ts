import { apiRequest } from "@/lib/queryClient";

// Auth API
export const loginUser = (email: string, password: string) => {
  return apiRequest('POST', '/api/auth/login', { email, password });
};

export const registerUser = (data: any) => {
  return apiRequest('POST', '/api/auth/register', data);
};

export const logoutUser = () => {
  return apiRequest('POST', '/api/auth/logout');
};

// Student Profile API
export const updateStudentProfile = async (data: FormData) => {
  const response = await fetch('/api/students/profile', {
    method: 'PUT',
    body: data,
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile');
  }
  
  return response.json();
};

export const addSkillsToProfile = (skillIds: number[]) => {
  return apiRequest('POST', '/api/students/skills', { skillIds });
};

export const removeSkillFromProfile = (skillId: number) => {
  return apiRequest('DELETE', `/api/students/skills/${skillId}`);
};

// Employer Profile API
export const updateEmployerProfile = async (data: FormData) => {
  const response = await fetch('/api/employers/profile', {
    method: 'PUT',
    body: data,
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile');
  }
  
  return response.json();
};

// Opportunities API
export const createOpportunity = (data: any) => {
  return apiRequest('POST', '/api/opportunities', data);
};

export const updateOpportunity = (id: number, data: any) => {
  return apiRequest('PUT', `/api/opportunities/${id}`, data);
};

export const deleteOpportunity = (id: number) => {
  return apiRequest('DELETE', `/api/opportunities/${id}`);
};

// Applications API
export const createApplication = (data: any) => {
  return apiRequest('POST', '/api/applications', data);
};

export const updateApplication = (id: number, data: any) => {
  return apiRequest('PUT', `/api/applications/${id}`, data);
};

// Saved Opportunities API
export const saveOpportunity = (id: number) => {
  return apiRequest('POST', `/api/opportunities/${id}/save`);
};

export const unsaveOpportunity = (id: number) => {
  return apiRequest('DELETE', `/api/opportunities/${id}/save`);
};

// Certificates API
export const createCertificate = (data: any) => {
  return apiRequest('POST', '/api/certificates', data);
};

// Admin API
export const verifyEmployer = (id: number) => {
  return apiRequest('PUT', `/api/admin/employers/${id}/verify`);
};
