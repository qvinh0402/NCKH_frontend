import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import '../../styles/admin.css';

const AdminSidebar = () => {
  const { isOpen, isCollapsed, screenSize, closeSidebar } = useSidebar();
  const { admin } = useAdminAuth();
  const location = useLocation();

  // Map permissions to navigation items
  const allNavItems = [
    {
      path: '/admin',
      icon: '📊',
      label: 'Tổng quan',
      description: 'Thống kê tổng quan',
      permission: 'Tổng quan'
    },
    {
      path: '/admin/branch-dashboard',
      icon: '🏪',
      label: 'TQ Chi nhánh',
      description: 'Tổng quan chi nhánh',
      permission: 'Tổng quan chi nhánh'
    },
    {
      path: '/admin/products',
      icon: '🍕',
      label: 'Sản phẩm',
      description: 'Quản lý sản phẩm',
      permission: 'Quản lý sản phẩm'
    },
    {
      path: '/admin/combos',
      icon: '📦',
      label: 'Combo',
      description: 'Quản lý combo',
      permission: 'Quản lý combo'
    },
    {
      path: '/admin/types',
      icon: '📂',
      label: 'Thể loại',
      description: 'Quản lý thể loại',
      permission: 'Quản lý thể loại'
    },
    {
      path: '/admin/categories',
      icon: '📁',
      label: 'Danh mục',
      description: 'Quản lý danh mục',
      permission: 'Quản lý danh mục'
    },
    {
      path: '/admin/orders',
      icon: '🧾',
      label: 'Đơn hàng',
      description: 'Quản lý đơn hàng',
      permission: 'Quản lý đơn hàng'
    },
    {
      path: '/admin/branch-orders',
      icon: '📦',
      label: 'ĐH Chi nhánh',
      description: 'Đơn hàng chi nhánh',
      permission: 'Quản lý đơn hàng chi nhánh'
    },
    {
      path: '/admin/users',
      icon: '👥',
      label: 'Người dùng',
      description: 'Quản lý người dùng',
      permission: 'Quản lý người dùng'
    },
    {
      path: '/admin/options',
      icon: '🧩',
      label: 'Tùy chọn',
      description: 'Quản lý tùy chọn',
      permission: 'Quản lý tùy chọn'
    },
    {
      path: '/admin/reviews',
      icon: '⭐',
      label: 'Đánh giá món ăn',
      description: 'Đánh giá món ăn',
      permission: 'Quản lý đánh giá món ăn'
    },
    {
      path: '/admin/order-reviews',
      icon: '💬',
      label: 'ĐG Đơn hàng',
      description: 'Đánh giá đơn hàng',
      permission: 'Quản lý đánh giá đơn hàng'
    },
    {
      path: '/admin/branch-order-reviews',
      icon: '📝',
      label: 'ĐG ĐH CN',
      description: 'Đánh giá chi nhánh',
      permission: 'Quản lý đánh giá đơn hàng chi nhánh'
    },
    {
      path: '/admin/shipper-available-orders',
      icon: '📦',
      label: 'Nhận đơn',
      description: 'Đơn hàng có thể nhận',
      permission: 'Quản lý giao hàng'
    },
    {
      path: '/admin/shipper-my-orders',
      icon: '🚚',
      label: 'Đơn của tôi',
      description: 'Đơn đã nhận',
      permission: 'Quản lý giao hàng'
    },
    {
      path: '/admin/promotions',
      icon: '🎁',
      label: 'Khuyến mãi',
      description: 'Quản lý khuyến mãi',
      permission: 'Quản lý khuyến mãi'
    },
    {
      path: '/admin/vouchers',
      icon: '🎟️',
      label: 'Voucher',
      description: 'Quản lý voucher',
      permission: 'Quản lý voucher'
    },
    {
      path: '/admin/banners',
      icon: '🖼️',
      label: 'Banner',
      description: 'Quản lý banner',
      permission: 'Quản lý banner'
    },
    {
      path: '/admin/gifts',
      icon: '🎁',
      label: 'Quà tặng',
      description: 'Quản lý quà tặng',
      permission: 'Quản lý quà tặng'
    }
  ];

  // Filter navigation items based on user permissions
  const navItems = useMemo(() => {
    if (!admin?.permissions) return [];
    
    return allNavItems.filter(item => 
      admin.permissions.includes(item.permission)
    );
  }, [admin?.permissions]);

  // Don't render sidebar on mobile if it's closed
  if (screenSize === 'mobile' && !isOpen) {
    return null;
  }

  const getSidebarStyles = () => {
    const baseStyles = {
      background: 'var(--admin-bg-sidebar)',
      borderRight: '1px solid var(--admin-border-base)',
      display: 'flex',
      flexDirection: 'column',
      position: screenSize === 'mobile' ? 'fixed' : 'relative',
      boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
      transition: 'var(--admin-transition-base)',
      zIndex: screenSize === 'mobile' ? 'var(--admin-z-modal)' : 'auto'
    };

    if (screenSize === 'mobile') {
      return {
        ...baseStyles,
        width: 'var(--admin-sidebar-width)',
        height: '100vh',
        top: 0,
        left: isOpen ? 0 : '-100%',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)'
      };
    } else if (screenSize === 'tablet') {
      return {
        ...baseStyles,
        width: isCollapsed ? 'var(--admin-sidebar-collapsed-width)' : 'var(--admin-sidebar-width)',
        minWidth: isCollapsed ? 'var(--admin-sidebar-collapsed-width)' : 'var(--admin-sidebar-width)'
      };
    } else {
      return {
        ...baseStyles,
        width: 'var(--admin-sidebar-width)',
        minWidth: 'var(--admin-sidebar-width)'
      };
    }
  };

  const handleNavClick = () => {
    if (screenSize === 'mobile') {
      closeSidebar();
    }
  };

  return (
    <>
      <aside style={getSidebarStyles()}>
        {/* Sidebar Header */}
        <div 
          style={{
            padding: isCollapsed && screenSize !== 'mobile' ? 'var(--admin-space-md)' : 'var(--admin-space-lg)',
            borderBottom: '1px solid var(--admin-border-base)',
            background: 'var(--admin-bg-secondary)',
            transition: 'var(--admin-transition-base)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed && screenSize !== 'mobile' ? 0 : 'var(--admin-space-md)', justifyContent: isCollapsed && screenSize !== 'mobile' ? 'center' : 'flex-start' }}>
            {(!isCollapsed || screenSize === 'mobile') && (
              <div>
                <h3 
                  style={{
                    margin: 0,
                    fontSize: 'var(--admin-font-size-lg)',
                    fontWeight: 'var(--admin-font-weight-bold)',
                    color: 'var(--admin-text-primary)',
                    lineHeight: 'var(--admin-line-height-tight)'
                  }}
                >
                  Bảng điều khiển
                </h3>
                <p 
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: 'var(--admin-font-size-xs)',
                    color: 'var(--admin-text-tertiary)',
                    fontWeight: 'var(--admin-font-weight-medium)'
                  }}
                >
                  Quản trị cửa hàng
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav 
          style={{
            flex: 1,
            padding: isCollapsed && screenSize !== 'mobile' ? 'var(--admin-space-sm)' : 'var(--admin-space-md)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: isCollapsed && screenSize !== 'mobile' ? 'var(--admin-space-xs)' : 'var(--admin-space-xs)'
          }}
        >
          {navItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={handleNavClick}
              className={({ isActive }) => 
                `admin-nav-link ${isActive ? 'admin-nav-link--active' : ''}`
              }
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed && screenSize !== 'mobile' ? 'center' : 'flex-start',
                gap: isCollapsed && screenSize !== 'mobile' ? 0 : 'var(--admin-space-md)',
                padding: isCollapsed && screenSize !== 'mobile' ? 'var(--admin-space-sm)' : 'var(--admin-space-md)',
                borderRadius: 'var(--admin-radius-lg)',
                textDecoration: 'none',
                transition: 'var(--admin-transition-base)',
                position: 'relative',
                overflow: 'hidden',
                background: isActive 
                  ? 'linear-gradient(135deg, var(--admin-primary) 0%, var(--admin-primary-light) 100%)'
                  : 'transparent',
                color: isActive 
                  ? 'var(--admin-white)' 
                  : 'var(--admin-text-primary)',
                fontWeight: isActive 
                  ? 'var(--admin-font-weight-semibold)' 
                  : 'var(--admin-font-weight-medium)',
                fontSize: 'var(--admin-font-size-sm)',
                border: isActive 
                  ? '1px solid rgba(255, 77, 79, 0.3)'
                  : '1px solid transparent',
                boxShadow: isActive 
                  ? 'var(--admin-shadow-md)'
                  : 'none',
                transform: isActive 
                  ? (isCollapsed && screenSize !== 'mobile' ? 'scale(1.05)' : 'translateX(4px)')
                  : (isCollapsed && screenSize !== 'mobile' ? 'scale(1)' : 'translateX(0)'),
                animationDelay: `${index * 0.05}s`,
                minHeight: isCollapsed && screenSize !== 'mobile' ? '44px' : 'auto'
              })}
              onMouseEnter={(e) => {
                const isActive = e.currentTarget.classList.contains('admin-nav-link--active');
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 77, 79, 0.1)';
                  e.currentTarget.style.color = 'var(--admin-primary-light)';
                  e.currentTarget.style.transform = isCollapsed && screenSize !== 'mobile' ? 'scale(1.1)' : 'translateX(8px)';
                  e.currentTarget.style.borderColor = 'rgba(255, 77, 79, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                const isActive = e.currentTarget.classList.contains('admin-nav-link--active');
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--admin-text-primary)';
                  e.currentTarget.style.transform = isCollapsed && screenSize !== 'mobile' ? 'scale(1)' : 'translateX(0)';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
              title={isCollapsed && screenSize !== 'mobile' ? item.label : undefined}
            >
              {/* Active Indicator */}
              <span 
                className="admin-nav-indicator"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: '20px',
                  background: 'var(--admin-white)',
                  borderRadius: '0 2px 2px 0',
                  opacity: 0,
                  transition: 'var(--admin-transition-base)'
                }}
              />
              
              {/* Icon */}
              <span 
                style={{
                  fontSize: isCollapsed && screenSize !== 'mobile' ? '20px' : '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  filter: 'grayscale(0.5)',
                  flexShrink: 0
                }}
              >
                {item.icon}
              </span>
              
              {/* Content */}
              {(!isCollapsed || screenSize === 'mobile') && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: 'inherit',
                    fontSize: 'inherit',
                    lineHeight: 'var(--admin-line-height-tight)'
                  }}>
                    {item.label}
                  </div>
                  {screenSize !== 'mobile' && (
                    <div style={{ 
                      fontSize: 'var(--admin-font-size-xs)',
                      opacity: 0.8,
                      marginTop: '1px',
                      fontWeight: 'var(--admin-font-weight-normal)'
                    }}>
                      {item.description}
                    </div>
                  )}
                </div>
              )}
              
              {/* Hover Arrow */}
              {(!isCollapsed || screenSize === 'mobile') && screenSize !== 'mobile' && (
                <span 
                  style={{
                    fontSize: '12px',
                    opacity: 0,
                    transform: 'translateX(-4px)',
                    transition: 'var(--admin-transition-base)'
                  }}
                >
                  →
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        {(!isCollapsed || screenSize === 'mobile') && (
          <div 
            style={{
              padding: 'var(--admin-space-md)',
              borderTop: '1px solid var(--admin-border-base)',
              background: 'var(--admin-bg-secondary)'
            }}
          >
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--admin-space-sm)',
                padding: 'var(--admin-space-sm)',
                background: 'rgba(255, 77, 79, 0.1)',
                borderRadius: 'var(--admin-radius-md)',
                border: '1px solid rgba(255, 77, 79, 0.2)',
                cursor: 'pointer',
                transition: 'var(--admin-transition-base)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 77, 79, 0.2)';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 77, 79, 0.1)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: '16px' }}>👤</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontSize: 'var(--admin-font-size-xs)',
                  fontWeight: 'var(--admin-font-weight-semibold)',
                  color: 'var(--admin-text-primary)',
                  lineHeight: 'var(--admin-line-height-tight)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {admin?.hoTen || 'Admin'}
                </div>
                {screenSize !== 'mobile' && (
                  <div style={{ 
                    fontSize: 'var(--admin-font-size-xs)',
                    color: 'var(--admin-text-tertiary)',
                    marginTop: '1px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {admin?.role === 'SUPER_ADMIN' ? 'Quản trị viên' : admin?.role || 'Admin'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Decorative Gradient Overlay */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, var(--admin-primary) 0%, var(--admin-secondary) 50%, var(--admin-primary) 100%)',
            opacity: 0.8
          }}
        />
      </aside>
      
      {/* Add custom styles for active states */}
      <style>{`
        .admin-nav-link--active .admin-nav-indicator {
          opacity: 1 !important;
        }
        .admin-nav-link--active span[style*="filter: grayscale"] {
          filter: none !important;
        }
      `}</style>
    </>
  );
};

export default AdminSidebar;