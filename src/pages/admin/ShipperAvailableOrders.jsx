import React, { useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { fetchOrders, api } from '../../services/api';
import OrderDetail from '../../components/ui/OrderDetail';
import styles from '../../styles/admin/AdminTable.module.css';
import buttonStyles from '../../styles/admin/AdminButton.module.css';
import cardStyles from '../../styles/admin/AdminCard.module.css';
import { AdminResponsiveContainer } from '../../components/admin/AdminResponsiveContainer';
import { BusinessCard } from '../../components/admin/AdminTableCard';

const statusVariant = {
  'Đang xử lý': 'warning',
  'Chờ giao hàng': 'info',
  'Đang giao': 'primary',
  'Đã giao': 'success',
  'Đã hủy': 'secondary',
};

const statusIcons = {
  'Đang xử lý': '⏳',
  'Chờ giao hàng': '📦',
  'Đang giao': '🚚',
  'Đã giao': '✅',
  'Đã hủy': '❌',
};

const ShipperAvailableOrders = () => {
  const { admin } = useAdminAuth();
  const shipperId = admin?.maNguoiDung;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [acceptingOrderId, setAcceptingOrderId] = useState(null);

  useEffect(() => {
    if (!shipperId) {
      setError('Không tìm thấy thông tin shipper');
      setLoading(false);
      return;
    }

    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const ordersRes = await fetchOrders();
        const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data || ordersRes;

        if (!mounted) return;
        setOrders(ordersData);
      } catch (err) {
        console.error('Error loading orders:', err);
        if (mounted) setError('Không thể tải danh sách đơn hàng');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [shipperId]);

  const getLatestStatus = (order) => {
    const h = order?.LichSuTrangThaiDonHang;
    if (!Array.isArray(h) || h.length === 0) return null;
    try {
      const sorted = [...h].sort((a, b) => new Date(a.ThoiGianCapNhat || 0) - new Date(b.ThoiGianCapNhat || 0));
      return sorted[sorted.length - 1]?.TrangThai || null;
    } catch (e) {
      return h[0]?.TrangThai || null;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  };

  // Chỉ lấy đơn "Chờ giao hàng" chưa có shipper
  const availableOrders = useMemo(() => {
    return orders.filter(o => getLatestStatus(o) === 'Chờ giao hàng' && !o.MaNguoiDungGiaoHang);
  }, [orders]);

  const handleView = (order) => {
    if (!order || !order.MaDonHang) return;
    setSelectedOrderId(order.MaDonHang);
    setShowDetailModal(true);
  };

  const handleAcceptOrder = async (orderId) => {
    if (!orderId) return;
    if (!confirm(`Bạn có chắc chắn muốn nhận đơn hàng ${orderId} không?`)) return;
    
    setAcceptingOrderId(orderId);
    try {
      await api.patch(`/api/orders/${orderId}/assign-shipper`, { 
        maNguoiDungGiaoHang: shipperId 
      });
      
      // Remove from available list
      setOrders(prev => prev.filter(o => o.MaDonHang !== orderId));
      alert('Nhận đơn hàng thành công! Vui lòng vào trang "Đơn của tôi" để xử lý.');
    } catch (err) {
      console.error('Accept order failed', err);
      alert('Không thể nhận đơn hàng: ' + (err.response?.data?.message || err.message));
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const cardComponent = (
    <div className={styles.adminTableCards}>
      {availableOrders.map((order, index) => {
        const id = order.MaDonHang;
        const customer = order.NguoiDung_DonHang_MaNguoiDungToNguoiDung?.HoTen || order.TenNguoiNhan || 'Khách vãng lai';
        const phone = order.SoDienThoaiGiaoHang;
        const branch = order.CoSo?.TenCoSo || '—';
        const total = Number(order.TongTien || 0);
        const createdAt = formatDateTime(order.NgayDat);

        return (
          <BusinessCard
            key={id}
            data={{ id, customer, phone, branch, total, status: 'Chờ giao hàng', createdAt, address: branch }}
            type="order"
            onView={() => handleView(order)}
            index={index}
            animate={true}
            showTimeline={false}
          />
        );
      })}
    </div>
  );

  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="admin-animate-fade-in">
      {/* Header Section */}
      <div className={`${cardStyles.cardPremium} mb-4`}>
        <div className={cardStyles.cardHeaderPremium}>
          <div className="d-flex flex-wrap justify-content-between align-items-center">
            <div>
              <h2 className={`${cardStyles.cardTitleLarge} mb-2`}>📦 Đơn hàng có thể nhận</h2>
              <p className={cardStyles.cardSubtitle}>Shipper: {admin?.hoTen} • Đơn chờ giao hàng chưa có shipper</p>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <button className={`${buttonStyles.button} ${buttonStyles.buttonPrimary}`} onClick={() => window.location.reload()}>
                🔄 Tải lại
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <AdminResponsiveContainer 
        data={availableOrders}
        loading={false}
        empty={availableOrders.length === 0}
        cardComponent={cardComponent}
        className="shipper-available-orders-container"
      >
        <div className={`${styles.tableContainerPremium} ${styles.tableAnimateIn}`}>
          <div className={styles.tableResponsive}>
            <table className={`${styles.table} ${styles.tableRowHover}`}>
              <thead className={styles.tableHeaderPrimary}>
                <tr>
                  <th style={{ width: 100 }}>
                    <div className={styles.tableSortable}>
                      <span>Mã đơn</span>
                    </div>
                  </th>
                  <th>
                    <div className={styles.tableSortable}>
                      <span>Khách hàng</span>
                    </div>
                  </th>
                  <th>
                    <div className={styles.tableSortable}>
                      <span>Điện thoại</span>
                    </div>
                  </th>
                  <th>
                    <div className={styles.tableSortable}>
                      <span>Địa chỉ giao hàng</span>
                    </div>
                  </th>
                  <th>
                    <div className={styles.tableSortable}>
                      <span>Tổng tiền</span>
                    </div>
                  </th>
                  <th>
                    <div className={styles.tableSortable}>
                      <span>Thời gian đặt</span>
                    </div>
                  </th>
                  <th style={{ width: 200 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>
                      <div className={styles.tableEmpty}>Đang tải...</div>
                    </td>
                  </tr>
                ) : availableOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className={styles.tableEmpty}>
                        <div className={styles.tableEmptyIcon}>📦</div>
                        <div className={styles.tableEmptyTitle}>Không có đơn hàng nào</div>
                        <div className={styles.tableEmptyDescription}>
                          Hiện tại chưa có đơn hàng nào cần giao
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  availableOrders.map((order, index) => {
                    const id = order.MaDonHang;
                    const customer = order.NguoiDung_DonHang_MaNguoiDungToNguoiDung?.HoTen || order.TenNguoiNhan || 'Khách vãng lai';
                    const phone = order.SoDienThoaiGiaoHang;
                    const address = `${order.SoNhaDuongGiaoHang || ''}, ${order.PhuongXaGiaoHang || ''}, ${order.QuanHuyenGiaoHang || ''}`.replace(/^,\s*/, '').replace(/,\s*,/g, ',');
                    const branch = order.CoSo?.TenCoSo || '—';
                    const total = Number(order.TongTien || 0).toLocaleString();
                    const createdAt = formatDateTime(order.NgayDat);

                    return (
                      <tr key={id} className="admin-animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                        <td className={styles.tableCellBold}>
                          <span className="badge bg-light text-dark border">{id}</span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #ff4d4f 0%, #ff6b6b 100%)', color: 'white', fontSize: 14, fontWeight: 'bold' }}
                            >
                              {String(customer).charAt(0)}
                            </div>
                            <div>
                              <div className={styles.tableCellBold}>{customer}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.tableCellMuted}>📞 {phone}</div>
                        </td>
                        <td>
                          <div className={styles.tableCellMuted} title={address}>
                            📍 {address}
                          </div>
                        </td>
                        <td>
                          <div className={`${styles.tableCellBold} ${styles.tableCellSuccess}`}>{total} đ</div>
                        </td>
                        <td>
                          <div className={styles.tableCellMuted}>🕒 {createdAt}</div>
                        </td>
                        <td>
                          <div className={styles.tableActions}>
                            <button className={`${styles.tableAction} ${styles.tableActionSuccess}`} title="Xem chi tiết" onClick={() => handleView(order)}>👁️</button>
                            <button 
                              className={`${buttonStyles.button} ${buttonStyles.buttonSuccess} ${buttonStyles.buttonSmall}`}
                              onClick={() => handleAcceptOrder(id)}
                              disabled={acceptingOrderId === id}
                              style={{ fontSize: '12px', padding: '4px 12px' }}
                            >
                              {acceptingOrderId === id ? '⏳ Đang nhận...' : '✓ Nhận đơn'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {availableOrders.length > 0 && (
            <div className={styles.tablePagination}>
              <div className={styles.tablePaginationInfo}>
                Hiển thị {availableOrders.length} đơn hàng có thể nhận
              </div>
              <OrderDetail 
                show={showDetailModal}
                onHide={() => setShowDetailModal(false)}
                orderId={selectedOrderId}
                initialData={null}
                modalZIndex={1400}
                isAdmin={true}
              />
            </div>
          )}
        </div>
      </AdminResponsiveContainer>
    </div>
  );
};

export default ShipperAvailableOrders;
