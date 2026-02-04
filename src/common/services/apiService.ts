// src/lib/apiService.ts
import { useAuth } from '@/contexts/AuthContext'
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

type AddEditRequest = SubscriptionRequest

class ApiService {
 

  private getHeaders(token) {
    // const {user, getToken } = useAuth()
    // const token = getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  }

  // private getUserId() {
  //   const {user } = useAuth()
  //     if (user) {
  //       return user?.id || ''
  //   }
  //   return 0 // default fallback
  // }

  async listRecords(params: Omit<ListRequest, 's_id'>,user,token): Promise<ApiResponse> {
    try {
      const requestData = {
        ...params,
        s_id: user.id
      }
      
      const response = await axios.post<ApiResponse>(
        `${BASE_URL}/secure/Categories/list-categories`,
        requestData,
        { headers: this.getHeaders(token) }
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

  async addRecord(data: Omit<AddEditRequest, 's_id'>,user,token): Promise<ApiResponse> {
    try {
      const requestData = {
        ...data,
        s_id: user.id
      }
      
      const response = await axios.post<ApiResponse>(
        `${BASE_URL}/secure/Categories/add-categories`,
        requestData,
        { headers: this.getHeaders(token) }
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

  async editRecord(data: Omit<AddEditRequest & { id: number }, 's_id'>,user,token): Promise<ApiResponse> {
    try {
      const requestData = {
        ...data,
        s_id: user.id
      }
      console.log(requestData)
      const response = await axios.post<ApiResponse>(
        `${BASE_URL}/secure/Categories/edit-categories`,
        requestData,
        { headers: this.getHeaders(token) }
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

    async getDropdownOptions(endpoint: string) {
    try {
      const requestData = {}
      console.log(requestData)
      const response = await axios.post<ApiResponse>(
        `${BASE_URL}/secure/Dropdowns/${endpoint}`,
        requestData,
        { headers: this.getHeaders() }
      )
      return response.data
    } catch (error: any) {
      console.error('Error editing record:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to edit record',
        data: []
      }
    }
  }

  async deleteRecords(ids: number[], record_type: number,user,token): Promise<ApiResponse> {
    try {
      const response = await axios.post<ApiResponse>(
        `${BASE_URL}/secure/Categories/delete-categories`,
        {
          ids,
          record_type,
          s_id: user.id
        },
        { headers: this.getHeaders(token) }
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
}

export const apiService = new ApiService()













// // src/lib/apiService.ts
// import axios from 'axios'

// const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://rainbowsolutionandtechnology.com/FSISubscriptionPortal/public/api"

// interface ApiResponse<T = any> {
//   success: boolean
//   message: string
//   data?: T
//   status?: boolean
//   total?: number
//   page?: number
//   rowsPerPage?: number
// }

// interface ListRequest {
//   s_id: number
//   record_type: number
//   search?: string
//   page?: number
//   rowsPerPage?: number
//   orderBy?: string
//   orderDir?: 'asc' | 'desc'
// }

// interface AddEditBaseRequest {
//   record_type: number
//   s_id: number
//   product_id: number
//   expiry_date: string
//   status: number
//   remarks: string
// }

// interface SubscriptionRequest extends AddEditBaseRequest {
//   renewal_date: string
//   amount: number
// }

// type AddEditRequest = SubscriptionRequest

// class ApiService {
//   private getAuthToken(): string | null {
//     if (typeof window !== 'undefined') {
//       return localStorage.getItem('authToken')
//     }
//     return null
//   }

//   private getHeaders() {
//     const token = this.getAuthToken()
//     return {
//       'Content-Type': 'application/json',
//       'Authorization': token ? `Bearer ${token}` : ''
//     }
//   }

//   async listRecords(params: ListRequest): Promise<ApiResponse> {
//     try {
//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Categories/list-categories`,
//         params,
//         { headers: this.getHeaders() }
//       )
//       return response.data
//     } catch (error: any) {
//       console.error('Error fetching records:', error)
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to fetch records'
//       }
//     }
//   }

//   async addRecord(data: AddEditRequest): Promise<ApiResponse> {
//     try {
//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Categories/add-categories`,
//         data,
//         { headers: this.getHeaders() }
//       )
//       return response.data
//     } catch (error: any) {
//       console.error('Error adding record:', error)
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to add record'
//       }
//     }
//   }

//   async editRecord(data: AddEditRequest & { id: number }): Promise<ApiResponse> {
//     try {
//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Categories/edit-categories`,
//         data,
//         { headers: this.getHeaders() }
//       )
//       return response.data
//     } catch (error: any) {
//       console.error('Error editing record:', error)
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to edit record'
//       }
//     }
//   }

//   async deleteRecords(ids: number[], record_type: number): Promise<ApiResponse> {
//     try {
//       // This is a simplified delete - adjust based on your actual API
//       const response = await axios.post<ApiResponse>(
//         `${BASE_URL}/secure/Categories/delete-categories`,
//         {
//           ids,
//           record_type,
//           s_id: this.getUserId()
//         },
//         { headers: this.getHeaders() }
//       )
//       return response.data
//     } catch (error: any) {
//       console.error('Error deleting records:', error)
//       return {
//         success: false,
//         message: error.response?.data?.message || 'Failed to delete records'
//       }
//     }
//   }

//   private getUserId(): number {
//     const userData = localStorage.getItem('user')
//     if (userData) {
//       const user = JSON.parse(userData)
//       return user?.id || 6
//     }
//     return 6
//   }
// }

// export const apiService = new ApiService()