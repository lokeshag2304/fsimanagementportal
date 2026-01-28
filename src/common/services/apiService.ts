// src/lib/apiService.ts
import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://rainbowsolutionandtechnology.com/FSISubscriptionPortal/public/api"

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  status?: boolean
  total?: number
  page?: number
  rowsPerPage?: number
}

interface ListRequest {
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

type AddEditRequest = SubscriptionRequest

class ApiService {
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken')
    }
    return null
  }

  private getHeaders() {
    const token = this.getAuthToken()
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  }

  async listRecords(params: ListRequest): Promise<ApiResponse> {
    try {
      const response = await axios.post<ApiResponse>(
        `${BASE_URL}/secure/Categories/list-categories`,
        params,
        { headers: this.getHeaders() }
      )
      return response.data
    } catch (error: any) {
      console.error('Error fetching records:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch records'
      }
    }
  }

  async addRecord(data: AddEditRequest): Promise<ApiResponse> {
    try {
      const response = await axios.post<ApiResponse>(
        `${BASE_URL}/secure/Categories/add-categories`,
        data,
        { headers: this.getHeaders() }
      )
      return response.data
    } catch (error: any) {
      console.error('Error adding record:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add record'
      }
    }
  }

  async editRecord(data: AddEditRequest & { id: number }): Promise<ApiResponse> {
    try {
      const response = await axios.post<ApiResponse>(
        `${BASE_URL}/secure/Categories/edit-categories`,
        data,
        { headers: this.getHeaders() }
      )
      return response.data
    } catch (error: any) {
      console.error('Error editing record:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to edit record'
      }
    }
  }

  async deleteRecords(ids: number[], record_type: number): Promise<ApiResponse> {
    try {
      // This is a simplified delete - adjust based on your actual API
      const response = await axios.post<ApiResponse>(
        `${BASE_URL}/secure/Categories/delete-categories`,
        {
          ids,
          record_type,
          s_id: this.getUserId()
        },
        { headers: this.getHeaders() }
      )
      return response.data
    } catch (error: any) {
      console.error('Error deleting records:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete records'
      }
    }
  }

  private getUserId(): number {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      return user?.id || 6
    }
    return 6
  }
}

export const apiService = new ApiService()