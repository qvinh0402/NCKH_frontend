import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ============================================
// AUTH CONTEXT - Quản lý trạng thái đăng nhập toàn app
// ============================================

const AuthContext = createContext(null);

// Keys for localStorage
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const CHAT_USER_KEY = 'chat_user'; // Key đồng bộ với ChatShortcut

// ============================================
// Helper functions
// ============================================

const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
const getStoredUser = () => {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const setStoredAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Đồng bộ với chat_user để ChatShortcut nhận diện
  localStorage.setItem(CHAT_USER_KEY, user.maTaiKhoan || user.email);
};

const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(CHAT_USER_KEY);
  // Xóa cả cache chat khi đăng xuất
  localStorage.removeItem('chat_cache');
};

// ============================================
// PROVIDER COMPONENT
// ============================================

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ============================================
  // Kiểm tra đăng nhập khi mount
  // ============================================
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (storedToken && storedUser) {
        try {
          // Verify token với server
          const response = await fetch('http://localhost:3001/api/auth/check', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setUser(data.user);
              setToken(storedToken);
              setIsAuthenticated(true);
              // Đồng bộ lại chat_user
              localStorage.setItem(CHAT_USER_KEY, data.user.maTaiKhoan);
            } else {
              // Token hết hạn hoặc không hợp lệ
              clearStoredAuth();
            }
          } else {
            // Server trả về lỗi
            clearStoredAuth();
          }
        } catch (err) {
          console.error('[Auth] Init error:', err);
          // Network error - vẫn giữ token để retry sau
          setUser(storedUser);
          setToken(storedToken);
          setIsAuthenticated(true);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  // ============================================
  // Đăng nhập
  // ============================================
  const login = useCallback(async (email, matKhau) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, matKhau })
      });

      const data = await response.json();

      if (data.success) {
        setStoredAuth(data.token, data.user);
        setUser(data.user);
        setToken(data.token);
        setIsAuthenticated(true);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error('[Auth] Login error:', err);
      return { success: false, message: 'Lỗi kết nối server' };
    }
  }, []);

  // ============================================
  // Đăng ký
  // ============================================
  const register = useCallback(async (userData) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success) {
        setStoredAuth(data.token, data.user);
        setUser(data.user);
        setToken(data.token);
        setIsAuthenticated(true);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error('[Auth] Register error:', err);
      return { success: false, message: 'Lỗi kết nối server' };
    }
  }, []);

  // ============================================
  // Đăng xuất
  // ============================================
  const logout = useCallback(async () => {
    try {
      // Gọi API logout nếu có token
      if (token) {
        await fetch('http://localhost:3001/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.error('[Auth] Logout error:', err);
    } finally {
      // Luôn xóa local state dù API thành công hay không
      clearStoredAuth();
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    }
  }, [token]);

  // ============================================
  // Refresh user info
  // ============================================
  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch('http://localhost:3001/api/auth/check', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          localStorage.setItem(CHAT_USER_KEY, data.user.maTaiKhoan);
        }
      }
    } catch (err) {
      console.error('[Auth] Refresh error:', err);
    }
  }, [token]);

  // ============================================
  // Get auth headers cho API calls
  // ============================================
  const getAuthHeaders = useCallback(() => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }, [token]);

  // ============================================
  // Context value
  // ============================================
  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    refreshUser,
    getAuthHeaders
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default AuthContext;
