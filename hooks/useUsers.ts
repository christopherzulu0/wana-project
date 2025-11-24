"use client"

import { useState, useEffect } from "react"
import type { User } from "../types"

const API_BASE_URL = 'https://attendance-records-wana.vercel.app';

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all users from API
  const fetchUsers = async (): Promise<ApiResponse<User[]>> => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/users`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }
      
      setUsers(data.users)
      return { success: true, data: data.users }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Load users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  const getAllUsers = () => {
    return users
  }

  const getUser = (userId: string) => {
    return users.find((user) => user.id === userId)
  }

  const addUser = async (newUser: Omit<User, "id">): Promise<ApiResponse<User>> => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }
      
      setUsers((prevUsers) => [...prevUsers, data.user])
      return { success: true, data: data.user }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (updatedUser: User): Promise<ApiResponse<User>> => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        }),
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user')
      }
      
      setUsers((prevUsers) => prevUsers.map((user) => (user.id === data.user.id ? data.user : user)))
      return { success: true, data: data.user }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string): Promise<ApiResponse<void>> => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user')
      }
      
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId))
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return {
    users,
    loading,
    error,
    getAllUsers,
    getUser,
    addUser,
    updateUser,
    deleteUser,
    refetch: fetchUsers,
  }
}
