// Authentication utilities
export const validateToken = async (): Promise<boolean> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return false;
  }

  try {
    const response = await fetch('/api/user/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      return true;
    } else {
      // Token is invalid, remove it
      localStorage.removeItem('token');
      return false;
    }
  } catch (error) {
    // Network error or other issue
    localStorage.removeItem('token');
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/auth';
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setToken = (token: string) => {
  localStorage.setItem('token', token);
};
