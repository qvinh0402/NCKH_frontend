import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true
};

function authReducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false
      };
    case 'LOGIN':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false
      };
    default:
      return state;
  }
}

// Flag to prevent double auto-login in React StrictMode
let autoLoginAttempted = false;

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Auto-login ONCE on mount using saved credentials
  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (autoLoginAttempted) {
      console.log('Auto-login skipped (already attempted)');
      return;
    }
    autoLoginAttempted = true;
    console.log('Auto-login starting...');
    
    (async () => {
      try {
        const raw = localStorage.getItem('auth:credentials');
        
        if (!raw) {
          // No credentials saved
          console.log('No saved credentials found');
          dispatch({ type: 'INIT', payload: null });
          return;
        }
        
        const creds = JSON.parse(raw);
        if (!creds?.email || !creds?.matKhau) {
          console.log('Invalid credentials format');
          dispatch({ type: 'INIT', payload: null });
          return;
        }
        
        // Auto-login with saved credentials
        console.log('Calling auto-login API...');
        const res = await api.post('/api/auth/login', { 
          email: creds.email, 
          matKhau: creds.matKhau 
        });
        
        console.log('Auto-login response:', res.status, res.data);
        
        if (res.data?.user) {
          console.log('Auto-login SUCCESS, user:', res.data.user);
          
          // ✅ THÊM: Lưu token sau auto-login
          if (res.data.token) {
            localStorage.setItem('auth_token', res.data.token);
            localStorage.setItem('auth_user', JSON.stringify(res.data.user));
          }
          
          dispatch({ type: 'INIT', payload: res.data.user });
        } else {
          // Login failed but KEEP credentials (might be temporary server error)
          console.log('Auto-login FAILED, no user data');
          dispatch({ type: 'INIT', payload: null });
        }
      } catch (e) {
        // Login error but KEEP credentials (might be network issue)
        console.error('Auto-login error:', e);
        dispatch({ type: 'INIT', payload: null });
      }
    })();
  }, []); // Empty dependency - only run ONCE on mount

  // Login function
  const login = async ({ email, matKhau }) => {
    try {
      const res = await api.post('/api/auth/login', { email, matKhau });
      const data = res.data;
      
      if (res.status === 200 && data && data.user) {
        // ✅ THÊM: Lưu token và user vào localStorage
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        // Lưu credentials cho auto-login
        localStorage.setItem('auth:credentials', JSON.stringify({ email, matKhau }));
        
        dispatch({ type: 'LOGIN', payload: data.user });
        return { ok: true, user: data.user, message: data.message };
      }
      
      return { ok: false, message: data?.message || 'Đăng nhập thất bại' };
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Lỗi khi đăng nhập';
      return { ok: false, message: msg };
    }
  };

  // Logout function
  const logout = () => {
    // ✅ THÊM: Xóa token và user
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth:credentials');
    localStorage.removeItem('cart');
    localStorage.removeItem('cart:compact');
    dispatch({ type: 'LOGOUT' });
  };

  // Register function
  const register = async ({ email, hoTen, matKhau, soDienThoai }) => {
    try {
      const res = await api.post('/api/auth/register', { email, hoTen, matKhau, soDienThoai });
      const data = res.data;
      
      // If backend returns a user object on register, save credentials and set auth
      if (res.status === 200 && data && data.user) {
        // ✅ THÊM: Lưu token và user nếu có
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('auth_user', JSON.stringify(data.user));
        }
        
        localStorage.setItem('auth:credentials', JSON.stringify({ email, matKhau }));
        dispatch({ type: 'LOGIN', payload: data.user });
        return { ok: true, user: data.user, message: data.message };
      }
      
      return { ok: false, message: data?.message || 'Đăng ký thất bại' };
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Lỗi khi đăng ký';
      return { ok: false, message: msg };
    }
  };

  const updateUser = (updatedUserData) => {
    dispatch({ type: 'UPDATE_USER', payload: updatedUserData });
  };

  // ✅ THÊM: Lấy token từ localStorage để export
  const token = localStorage.getItem('auth_token');

  return (
    <AuthContext.Provider value={{ 
      user: state.user, 
      isAuthenticated: state.isAuthenticated,
      loading: state.loading,
      token, // ✅ THÊM: Export token
      login,
      logout,
      register,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}