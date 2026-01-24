import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext();

export const CREDENTIALS_KEY = 'admin:credentials';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-login khi mount - luôn chạy mỗi lần F5/reload
  useEffect(() => {
    const attemptAutoLogin = async () => {
      try {
        const savedCredentials = localStorage.getItem(CREDENTIALS_KEY);
        if (!savedCredentials) {
          setLoading(false);
          return;
        }

        const { email, matKhau } = JSON.parse(savedCredentials);
        console.log('🔄 Attempting auto-login for admin:', email);

        const response = await axios.post(`${API_BASE_URL}/api/auth/admin/login`, {
          email,
          matKhau
        });

        if (response.data?.user) {
          const userData = response.data.user;
          const adminData = {
            maTaiKhoan: userData.maTaiKhoan,
            maCoSo: userData.maCoSo,
            email: userData.email,
            role: userData.role,
            hoTen: userData.hoTen,
            soDienThoai: userData.soDienThoai,
            maNguoiDung: userData.maNguoiDung,
            permissions: userData.permissions || []
          };
          setAdmin(adminData);
          console.log('✅ Auto-login successful, permissions:', adminData.permissions);
        } else {
          console.log('⚠️ No user data in response');
        }
      } catch (error) {
        console.error('❌ Auto-login failed:', error);
        // Don't remove saved credentials on auto-login failure so the stored creds persist across reloads.
        // This allows retrying auto-login on subsequent reloads. If you want to clear creds on persistent
        // failures, call logout() explicitly from the admin UI.
      } finally {
        setLoading(false);
      }
    };

    attemptAutoLogin();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/admin/login`, {
        email,
        matKhau: password
      });

      console.log('Admin login response:', response.data);

      // Kiểm tra nếu có lỗi (message nhưng không có user)
      if (response.data.message && !response.data.user) {
        return { success: false, message: response.data.message };
      }

      // Lấy thông tin user từ response
      const userData = response.data.user;
      
      // Lưu thông tin admin vào state
      const adminData = {
        maTaiKhoan: userData.maTaiKhoan,
        maCoSo: userData.maCoSo,
        email: userData.email,
        role: userData.role,
        hoTen: userData.hoTen,
        soDienThoai: userData.soDienThoai,
        maNguoiDung: userData.maNguoiDung,
        permissions: userData.permissions || []
      };

      setAdmin(adminData);

      // CHỈ lưu credentials vào localStorage
      try {
        localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({
          email,
          matKhau: password
        }));
      } catch (error) {
        console.error('Failed to save credentials', error);
      }

      return { success: true, admin: adminData };

    } catch (error) {
      console.error('Admin login error:', error);
      if (error.response?.data?.message) {
        return { success: false, message: error.response.data.message };
      }
      return { success: false, message: 'Đăng nhập thất bại. Vui lòng thử lại.' };
    }
  }, []);

  const logout = useCallback(() => {
    setAdmin(null);
    try {
      localStorage.removeItem(CREDENTIALS_KEY);
    } catch (error) {
      console.error('Failed to remove credentials', error);
    }
  }, []);

  const value = useMemo(() => ({
    admin,
    isAuthenticated: Boolean(admin),
    loading,
    login,
    logout,
  }), [admin, loading, login, logout]);

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
