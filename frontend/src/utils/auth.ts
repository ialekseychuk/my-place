/**
 * Helper functions for authentication token management
 */

// Set the authentication token with a 24-hour expiration
export const setAuthToken = (token: string): void => {
  localStorage.setItem('access_token', token);
  
  // Set an expiration timestamp (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  localStorage.setItem('token_expires_at', expiresAt.toISOString());
};

// Check if the token is valid (exists and not expired)
export const isTokenValid = (): boolean => {
  const token = localStorage.getItem('access_token');
  const expiresAtStr = localStorage.getItem('token_expires_at');
  
  if (!token || !expiresAtStr) {
    return false;
  }
  
  try {
    const expiresAt = new Date(expiresAtStr);
    const now = new Date();
    return expiresAt > now;
  } catch (error) {
    return false;
  }
};

// Clear the authentication token
export const clearAuthToken = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('token_expires_at');
};

// Helper function to login with email and password
export const loginWithCredentials = async (email: string, password: string): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:81/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data?.token?.access_token) {
      setAuthToken(data.token.access_token);
      return true;
    } else {
      throw new Error('No access token in response');
    }
  } catch (error) {
    return false;
  }
};

export default {
  setAuthToken,
  isTokenValid,
  clearAuthToken,
  loginWithCredentials,
};