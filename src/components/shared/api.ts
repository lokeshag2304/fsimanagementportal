// api/index.ts
// Use the global axios instance from @/lib/axios which already handles:
// - baseURL from NEXT_PUBLIC_BASE_URL
// - Authorization Bearer token from localStorage ("token")
// - 401 response -> clear token + redirect to /auth/login
import api from '@/lib/axios';

// Auth APIs
export const authApi = {
  // Login
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Send OTP for 2FA
  sendOtp: async (id: number, method: 'email' | 'sms' | 'whatsapp', contact?: string) => {
    try {
      const response = await api.post('/auth/two_step_otp', { id, method, contact });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Verify OTP (for login)
  verifyOtp: async (otp: string, method: 'email' | 'sms' | 'whatsapp', id: number) => {
    try {
      const response = await api.post('/auth/verifyOtp', { otp, method, id });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Verify OTP for forgot password
  verifyOtpForForget: async (otp: string, method: string, id: number) => {
    try {
      const response = await api.post('/auth/verify-for-forget', {
        otp,
        method,
        id
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Send reset link for forgot password
  sendResetLink: async (email: string) => {
    try {
      const response = await api.post('/auth/send_reset_link', { email });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Send WhatsApp OTP for forgot password
  sendWhatsappOtp: async (number: string, whatsapp_code: string = '91') => {
    try {
      const response = await api.post('/auth/send_whatsap_otp', {
        number,
        whatsapp_code
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Send SMS OTP for forgot password
  sendSmsOtp: async (number: string, sms_code: string = '91') => {
    try {
      const response = await api.post('/auth/send_sms_otp', {
        number,
        sms_code
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string) => {
    try {
      // Extract id from token if needed, or use a different endpoint
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  },

  // Reset password with ID (for phone/WhatsApp flow)
  resetPasswordWithId: async (id: string, token: string, newPassword: string) => {
    try {
      const response = await api.post('/auth/reset-password', {
        id,
        token,
        newPassword
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: error.message };
    }
  }
};

export default api;