import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Spinner, Alert } from 'react-bootstrap';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { api } from '../../services/api';
import styles from './ReviewAnalytics.module.css';

const ReviewAnalytics = ({ branchId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [dateRange, setDateRange] = useState('week');
  const [error, setError] = useState(null);

  const fetchStats = async (analyze = false) => {
    try {
      if (analyze) setAnalyzing(true);
      else setLoading(true);

      const endDate = new Date();
      const startDate = new Date();

      if (dateRange === 'week') startDate.setDate(startDate.getDate() - 7);
      else startDate.setMonth(startDate.getMonth() - 1);

      startDate.setHours(0, 0, 0, 0);

      const params = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        analyze,
        branchId
      };

      const response = await api.get('/api/orders/statistics/review-issues', { params });

      if (response.data.success) {
        setStats(response.data.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching review stats:', err);
      setError('Không thể tải dữ liệu phân tích');
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange, branchId]);

  const handleAnalyze = () => {
    fetchStats(true);
  };

  if (loading && !stats) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!stats) return null;

  const chartData = [
    { name: 'Chất lượng món ăn', count: stats.issues.Food, color: '#FF8042' },
    { name: 'Tài xế/Giao hàng', count: stats.issues.Driver, color: '#00C49F' },
    { name: 'Dịch vụ cửa hàng', count: stats.issues.Store, color: '#FFBB28' },
    { name: 'Khác', count: stats.issues.Other, color: '#8884d8' },
    { name: 'Giao hàng trễ', count: stats.issues.Late, color: '#FF4444' }
  ];

  return (
    <div className="review-analytics mb-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Phân tích vấn đề đánh giá</h4>

        <div className="d-flex gap-2">
          <Form.Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ width: '150px' }}
            size="sm"
          >
            <option value="week">7 ngày qua</option>
            <option value="month">30 ngày qua</option>
          </Form.Select>

          <Button
            variant="primary"
            size="sm"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <Spinner as="span" animation="border" size="sm" />
            ) : (
              '✨ Phân tích AI'
            )}
          </Button>
        </div>
      </div>

      <Row className="g-3">
        {/* LEFT: CHART */}
        <Col lg={7}>
          <Card className="shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <Card.Title>Chi tiết vấn đề</Card.Title>

              <div style={{ height: 300, flex: 1, minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />

                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* SUMMARY */}
              <div className="mt-3 d-flex justify-content-around text-center small text-muted">
                <div>
                  <strong>{stats.totalReviews}</strong>
                  <div>Tổng đánh giá</div>
                </div>
                <div>
                  <strong className="text-success">
                    {stats.sentiment.Positive}
                  </strong>
                  <div>Tích cực</div>
                </div>
                <div>
                  <strong className="text-danger">
                    {stats.sentiment.Negative}
                  </strong>
                  <div>Tiêu cực</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* RIGHT: AI SUMMARY */}
        <Col lg={5}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="d-flex flex-column p-3" style={{ gap: '12px' }}>
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: 20 }}>🤖</span>
                <span style={{ fontWeight: 600, fontSize: 15 }}>Insight AI</span>
                {analyzing && (
                  <Spinner animation="grow" size="sm" variant="primary" />
                )}
              </div>

              {stats.aiSummary ? (
                <div
                  className={styles.aiSummary}
                  dangerouslySetInnerHTML={{ __html: stats.aiSummary }}
                  style={{ flex: 1 }}
                />
              ) : (
                <div className="text-center text-muted" style={{ padding: '40px 20px' }}>
                  <p>
                    Nhấn <b>"Phân tích AI"</b> để tạo insight ngắn gọn từ đánh giá.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReviewAnalytics;