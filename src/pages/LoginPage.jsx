import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, Card, Tabs, Tab } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    hoTen: '',
    soDienThoai: '',
    diaChi: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const resp = await login({ email: formData.email, matKhau: formData.password });
      if (resp.ok) {
        navigate(from, { replace: true });
      } else {
        setError(resp.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
  setError('');
  setSuccess('');
    // Client-side validation
    const email = (formData.email || '').trim();
    const password = String(formData.password || '');
    const hoTen = (formData.hoTen || '').trim();
    const phoneRaw = String(formData.soDienThoai || '').trim();

    function isValidEmail(v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    function isValidVNPhone(v) {
      const cleaned = (v || '').replace(/[^0-9+]/g, '');
      // Vietnamese mobile numbers: start with 0 or +84, next digit 3|5|7|8|9 and 8 more digits
      return /^(?:\+84|0)(3|5|7|8|9)\d{8}$/.test(cleaned);
    }

    if (!hoTen) {
      setError('Vui lòng nhập họ tên.');
      setLoading(false);
      return;
    }

    if (!isValidEmail(email)) {
      setError('Định dạng email không hợp lệ.');
      setLoading(false);
      return;
    }

    if (password.length <= 6) {
      setError('Mật khẩu phải nhiều hơn 6 ký tự.');
      setLoading(false);
      return;
    }

    if (!isValidVNPhone(phoneRaw)) {
      setError('Số điện thoại không hợp lệ (VD: 0909123456 hoặc +84909123456).');
      setLoading(false);
      return;
    }

    try {
      const resp = await register({
        email,
        hoTen,
        matKhau: password,
        soDienThoai: phoneRaw,
      });
      if (resp.ok) {
        // Show success, switch to login tab, and prefill credentials
        setSuccess(resp.message || 'Đăng ký thành công. Vui lòng đăng nhập.');
        setActiveTab('login');
        setFormData(prev => ({ ...prev, email, password }));
      } else {
        setError(resp.message || 'Đăng ký thất bại');
      }
    } catch (err) {
      setError('Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.illustrationSide}>
            <div className={styles.illustration}>🎄</div>
            <h2 className={styles.welcomeText}>Chào mừng về nhà!</h2>
            <p className={styles.welcomeSubtext}>
              Mùa Giáng sinh thật ấm áp hơn khi có bạn đồng hành
            </p>
          </div>
          <div className={styles.formSide}>
            <h3 className={styles.formTitle}>🍕 SECRET PIZZA</h3>
            
            {error && <Alert variant="danger" className={styles.alert}>{error}</Alert>}
            {success && <Alert variant="success" className={styles.alert}>{success}</Alert>}

            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className={`${styles.tabs} mb-4`}
              justify
            >
              <Tab eventKey="login" title="Đăng nhập">
                <Form onSubmit={handleLogin}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      className={styles.formControl}
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Nhập email"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Mật khẩu</Form.Label>
                    <Form.Control
                      className={styles.formControl}
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Nhập mật khẩu"
                      required
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    className={styles.submitButton}
                    disabled={loading}
                  >
                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  </Button>

                      <div className="text-center">
                        <Button
                          variant="link"
                          onClick={() => navigate(from, { replace: true })}
                          style={{ textDecoration: 'none' }}
                        >
                          Tiếp tục mua hàng không cần đăng nhập
                        </Button>
                      </div>
                    </Form>
                  </Tab>

              <Tab eventKey="register" title="Đăng ký">
                <Form onSubmit={handleRegister}>
                  <Form.Group className="mb-3">
                    <Form.Label>Họ tên</Form.Label>
                    <Form.Control
                      className={styles.formControl}
                      type="text"
                      name="hoTen"
                      value={formData.hoTen}
                      onChange={handleChange}
                      placeholder="Nhập họ tên"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Số điện thoại</Form.Label>
                    <Form.Control
                      className={styles.formControl}
                      type="tel"
                      name="soDienThoai"
                      value={formData.soDienThoai}
                      onChange={handleChange}
                      placeholder="Nhập số điện thoại"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      className={styles.formControl}
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Nhập email"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Mật khẩu</Form.Label>
                    <Form.Control
                      className={styles.formControl}
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Nhập mật khẩu"
                      required
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    className={styles.submitButton}
                    disabled={loading}
                  >
                    {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                  </Button>

                  <div className="text-center mt-3">
                    <Button
                      variant="link"
                      onClick={() => navigate(from, { replace: true })}
                      style={{ textDecoration: 'none', color: '#165b33', fontWeight: 600 }}
                    >
                      Tiếp tục mua hàng không cần đăng nhập
                    </Button>
                  </div>
                </Form>
              </Tab>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
