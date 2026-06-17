import axios from 'axios';
import { FullAnalysisResponse } from '../types/advantage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1/advantage',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear token — do NOT redirect here.
      // Component-level catch blocks (App.tsx handleLogout) manage auth state.
      // Redirecting here causes infinite loops in SPA.
      localStorage.removeItem('access_token');
    }
    return Promise.reject(error);
  }
);

export const resetUsers = async (adminSecret: string) => {
    const response = await api.post(`/debug/reset-users?secret=${adminSecret}`);
    return response.data;
};

export const signup = async (email: string, password: string) => {
    const response = await api.post('/auth/signup', { email, password });
    const data = response.data;
    if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
    }
    return data;
};

export const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const data = response.data;
    if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
    }
    return data;
};

export const logout = () => {
    localStorage.removeItem('access_token');
};

export const getMe = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

export const analyzeAd = async (
  image: File,
  caption: string,
  platform: string,
  objective: string
): Promise<FullAnalysisResponse> => {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('caption', caption);
  formData.append('platform', platform);
  formData.append('objective', objective);
  const response = await api.post<FullAnalysisResponse>('/analyze', formData);
  return response.data;
};

export const analyzeBulk = async (
  images: File[],
  captions: string[],
  platform: string,
  objective: string
): Promise<FullAnalysisResponse[]> => {
  const formData = new FormData();
  images.forEach(img => formData.append('images', img));
  formData.append('captions', JSON.stringify(captions));
  formData.append('platform', platform);
  formData.append('objective', objective);
  const response = await api.post<FullAnalysisResponse[]>('/analyze-bulk', formData);
  return response.data;
};

export const analyzeVideoAd = async (
  videoFile: File,
  caption: string,
  platform: string,
  objective: string
) => {
  const formData = new FormData();
  formData.append("video", videoFile);
  formData.append("caption", caption);
  formData.append("platform", platform);
  formData.append("objective", objective);

  const response = await api.post("/analyze-video", formData, {
    timeout: 120000,
  });
  return response.data;
};

export const analyzeByUrl = async (
  url: string,
  analysisType: string,
  platform: string,
  objective: string
): Promise<FullAnalysisResponse> => {
  const response = await api.post<FullAnalysisResponse>('/analyze-url', {
    url,
    analysis_type: analysisType,
    platform,
    objective
  });
  return response.data;
};

export const checkHealth = async () => {
    const response = await api.get('/health');
    return response.data;
};

export const exportPdf = async (analysisData: FullAnalysisResponse) => {
    const response = await api.post('/export-pdf', analysisData, {
        responseType: 'blob',
    });
    return response.data;
};

export const getHistory = async () => {
    const response = await api.get('/history');
    return response.data;
};

export const getBrandProfile = async () => {
    const response = await api.get('/brand-profile');
    return response.data;
};

export const updateBrandProfile = async (profileData: any) => {
    const response = await api.post('/brand-profile', profileData);
    return response.data;
};

export const forgotPassword = async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

export const resetPassword = async (token: string, new_password: string) => {
    const response = await api.post('/auth/reset-password', { token, new_password });
    return response.data;
};

export const verifyEmail = async (token: string) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
};

export const resendVerification = async () => {
    const response = await api.post('/auth/resend-verification');
    return response.data;
};

export const getSubscriptionStatus = async () => {
    const response = await api.get('/subscription/status');
    return response.data;
};

export const rewriteAdText = async (
    original_text: string, 
    feedback: string[]
) => {
    const response = await api.post('/analyze/rewrite', {
        original_text,
        feedback
    });
    return response.data;
};
