// src/lib/apiService.ts
import { useAuth } from '@/contexts/AuthContext'
import api from "@/lib/api"
import { downloadBase64File } from '../DashboardLoader';
import { toast } from '@/hooks/useToast';

interface ApiResponse<T = any> {
  success?: boolean
  message: string
  data?: T
  status?: boolean
  total?: number
  page?: number
  rowsPerPage?: number
  errors?: any[]
}

interface ListRequest {
  s_id: number
  record_type: number
  search?: string
  page?: number
  rowsPerPage?: number
  orderBy?: string
  orderDir?: 'asc' | 'desc'
}

interface AddEditBaseRequest {
  record_type: number
  s_id: number
  product_id: number
  expiry_date: string
  status: number
  remarks: string
}

interface SubscriptionRequest extends AddEditBaseRequest {
  renewal_date: string
  amount: number
}

class ApiService {
  private getHeaders(token?: string | null) {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'Bypass-Tunnel-Reminder': 'true'
    }
  }

  private getEndpoint(recordType: number): string {
    switch (Number(recordType)) {
      case 1: return 'secure/subscriptions';
      case 2: return 'secure/ssl';
      case 3: return 'secure/hostings';
      case 4: return 'secure/domains';
      case 5: return 'secure/emails';
      case 6: return 'secure/counters';
      default: return 'secure/subscriptions';
    }
  }

  async listRecords(params: Omit<ListRequest, 's_id'>, user: any, token: string | null): Promise<ApiResponse> {
    try {
      const endpoint = this.getEndpoint(params.record_type);
      const response = await api.get<ApiResponse>(endpoint, {
        headers: this.getHeaders(token),
        params: {
          ...params,
          page: (params.page || 0) + 1
        }
      });
      return response.data;
    } catch (error: any) {
      console.error("API List Error:", error?.response?.data || error.message);
      return { status: false, message: error?.response?.data?.message || "Server unreachable", success: false };
    }
  }

  async addRecord(data: any, user: any, token: string | null): Promise<ApiResponse> {
    try {
      const endpoint = this.getEndpoint(data.record_type);
      const response = await api.post<ApiResponse>(
        endpoint,
        { ...data, s_id: user?.id || null },
        { headers: this.getHeaders(token) }
      );
      return response.data;
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || "Unknown error";
      console.error("API Add Error Details:", error?.response?.data || error);
      return { status: false, message: errorMsg, success: false };
    }
  }


  async exportRecord(data: any, user: any, token: string | null): Promise<ApiResponse> {
    try {
      const response = await api.post<any>(
        `secure/subscription-models/export-categories`,
        { ...data, s_id: user?.id || null },
        { headers: this.getHeaders(token) }
      );
      return response.data;
    } catch (error: any) {
      const errData = error?.response?.data;
      const errMsg = errData?.message || error?.message || "Export failed";
      console.error("API Export Error:", errData || error?.message || error);
      return { status: false, message: errMsg, success: false };
    }
  }

  async importSubscriptions(formData: FormData, token: string | null): Promise<ApiResponse> {
    try {
      const response = await api.post<ApiResponse>(
        `secure/subscriptions/import`,
        formData,
        { headers: { Authorization: token ? `Bearer ${token}` : '' } }
      );
      return response.data;
    } catch (error: any) {
      console.error("API Import Error:", error?.response?.data || error.message);
      return { status: false, message: "Server unreachable", success: false };
    }
  }

  async importRecords(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(
      "secure/subscriptions/import",
      formData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": undefined,
        },
      }
    );
    return response.data;
  }

  async editRecord(data: any, user: any, token: string | null): Promise<ApiResponse> {
    try {
      const endpoint = this.getEndpoint(data.record_type);
      const id = data.id;
      const response = await api.put<ApiResponse>(
        `${endpoint}/${id}`,
        { ...data, s_id: user?.id || null },
        { headers: this.getHeaders(token) }
      );
      return response.data;
    } catch (error: any) {
      console.error("API Edit Error:", error?.response?.data || error.message);
      return { status: false, message: "Server unreachable", success: false };
    }
  }

  async getDropdownOptions(endpoint: string) {
    try {
      const response = await api.post<ApiResponse>(
        `secure/Dropdowns/${endpoint}`,
        {},
        { headers: this.getHeaders('') }
      );
      return response.data;
    } catch (error: any) {
      console.error("API Dropdown Error:", error?.response?.data || error.message);
      return { status: false, message: "Server unreachable", success: false, data: [] };
    }
  }

  async deleteRecords(ids: number[], record_type: number, user: any, token: string | null): Promise<ApiResponse> {
    try {
      const endpoint = this.getEndpoint(record_type);
      await Promise.all(ids.map(id =>
        api.delete(`${endpoint}/${id}`, { headers: this.getHeaders(token) })
      ));
      return { status: true, message: "Records deleted successfully", success: true };
    } catch (error: any) {
      console.error("API Delete Error:", error?.response?.data || error.message);
      return { status: false, message: "Server unreachable", success: false };
    }
  }
}

export const apiService = new ApiService();