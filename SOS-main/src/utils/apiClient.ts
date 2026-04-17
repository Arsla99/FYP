// src/utils/apiClient.ts
import { getSession } from 'next-auth/react';

/**
 * Enhanced fetch wrapper that automatically includes NextAuth session
 * Falls back to localStorage token for backward compatibility
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  // Try to get NextAuth session first
  const session = await getSession();
  if (session?.user?.id) {
    // Generate a temporary token from session data
    // In production, you should use the session server-side instead
    headers['Authorization'] = `Bearer ${session.user.id}`;
  } else {
    // Fallback to localStorage token (for backward compatibility)
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * Get current user from NextAuth session or localStorage
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (session?.user) {
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || '',
      role: session.user.role || 'user',
      image: session.user.image || null
    };
  }

  // Fallback to API call with localStorage token
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const response = await fetch('/api/user/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }

  return null;
}
