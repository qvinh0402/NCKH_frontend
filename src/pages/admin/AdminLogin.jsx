import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAdminAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const from = location.state?.from || '/admin';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(form.email, form.password);
      
      if (!result.success) {
        setError(result.message || 'Không thể đăng nhập.');
        return;
      }

      // Đăng nhập thành công
      navigate(from, { replace: true });
    } catch (err) {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Prefill form from saved credentials if present
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('admin:credentials');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) setForm(f => ({ ...f, email: parsed.email }));
        // do NOT prefill password field for security unless you really want to
        if (parsed.matKhau) setForm(f => ({ ...f, password: parsed.matKhau }));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="card shadow" style={{ maxWidth: 420, width: '100%' }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <div className="mb-3">
              <img src="/logo.png" alt="Logo" style={{ height: '80px', objectFit: 'contain' }} />
            </div>
            <h3 className="mb-2">Đăng nhập quản trị</h3>
            <p className="text-muted small mb-0">
              Nhập thông tin để truy cập hệ thống quản lý
            </p>
          </div>
          
          {error && (
            <div className="alert alert-danger py-2 small" role="alert">
              <strong>Lỗi:</strong> {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            <div>
              <label htmlFor="email" className="form-label fw-semibold">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-control"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="form-label fw-semibold">Mật khẩu</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-control"
                value={form.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu"
                disabled={loading}
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn w-100"
              style={{
                background: 'linear-gradient(135deg, #ff4d4f 0%, #ff6b6b 100%)',
                color: 'white',
                fontWeight: '600',
                padding: '12px',
                border: 'none'
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
          
          <div className="text-center text-muted small mt-4">
            <div className="mb-1">🔐 Hệ thống bảo mật</div>
            Chỉ dành cho quản trị viên
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
