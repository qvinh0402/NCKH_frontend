# 🍕 Secret Pizza - Frontend E-Commerce Platform

Ứng dụng web thương mại điện tử hiện đại xây dựng bằng **React 19** + **Vite** với tích hợp **Chatbot AI** hỗ trợ khách hàng thông minh.

---

## 📋 Mục Lục

- [🎯 Mô Tả Dự Án](#mô-tả-dự-án)
- [🎨 Tính Năng Chính](#tính-năng-chính)
- [🛠️ Công Nghệ Sử Dụng](#công-nghệ-sử-dụng)
- [📁 Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
- [🚀 Cài Đặt & Chạy](#cài-đặt--chạy)
- [⚙️ Cấu Hình](#cấu-hình)
- [📡 API Integration](#api-integration)
- [🤖 Chatbot AI](#chatbot-ai)
- [👨‍💼 Admin Dashboard](#admin-dashboard)
- [📊 Tính Năng Chính Khác](#tính-năng-chính-khác)
- [🔐 Xác Thực & Bảo Mật](#xác-thực--bảo-mật)
- [📦 Dependencies](#dependencies)
- [🤝 Đóng Góp](#đóng-góp)

---

## 🎯 Mô Tả Dự Án

**NCKH_frontend** là frontend của nền tảng thương mại điện tử **Secret Pizza** - một ứng dụng bán pizza trực tuyến với tích hợp **Chatbot AI thông minh** để hỗ trợ khách hàng 24/7.

### Mục Tiêu:
- 🎯 Cung cấp trải nghiệm mua sắm mượt mà và thân thiện
- 💬 Tích hợp chatbot AI để trả lời câu hỏi khách hàng tự động
- 📊 Dashboard quản lý chi tiết cho admin và chi nhánh
- 🔍 Hệ thống đánh giá & bình luận sản phẩm
- 📦 Quản lý đơn hàng & thanh toán toàn diện

---

## 🎨 Tính Năng Chính

### 👥 Khách Hàng
- ✅ Đăng ký / Đăng nhập
- 🛍️ Xem danh sách sản phẩm & combo
- 🔍 Tìm kiếm & lọc sản phẩm
- 🛒 Giỏ hàng (với 24h cache)
- 💳 Thanh toán & đơn hàng
- 📦 Theo dõi trạng thái đơn hàng
- ⭐ Đánh giá & bình luận sản phẩm
- 💬 **Chatbot AI 24/7** - Hỏi đáp tự động
- 💾 **Lưu đoạn chat** (TTL 24h) - Chỉ cho user đã đăng nhập
- 📍 Xem thông tin chi nhánh

### 👨‍💼 Admin / Chi Nhánh
- 📊 Dashboard tổng quan
- 📈 Thống kê doanh số & đơn hàng
- 🍔 Quản lý sản phẩm (CRUD)
- 📦 Quản lý đơn hàng & trạng thái
- ⭐ Quản lý & phân tích đánh giá
- 💬 Trả lời bình luận khách hàng
- 👥 Quản lý người dùng
- 📋 Quản lý combo & khuyến mãi
- 🎁 Quản lý voucher & gift
- 📊 **AI Insights** - Phân tích tự động từ đánh giá
- 📅 Quản lý banner quảng cáo

---

## 🛠️ Công Nghệ Sử Dụng

### Frontend Stack
```
React 19.1.1          - UI Library
Vite 5.4.14           - Build Tool & Dev Server
Bootstrap 5.3.8       - CSS Framework
Recharts 3.4.1        - Data Visualization
CSS Modules           - Component-scoped Styling
localStorage API      - Client-side Caching
```

### Key Features
- ⚡ **Hot Module Replacement (HMR)** - Fast development experience
- 🎨 **CSS Modules** - Scoped styling
- 📦 **Code Splitting** - Optimal bundle size
- 🔍 **ESLint** - Code quality checks
- 🎯 **Context API** - State management (Auth, Cart, Sidebar, Admin)

### Browser Support
- Chrome ✅
- Firefox ✅
- Safari ✅
- Edge ✅

---

## 📁 Cấu Trúc Thư Mục

```
src/
├── components/
│   ├── admin/                    # Admin components
│   │   ├── AdminSidebar.jsx
│   │   ├── RequireAdmin.jsx
│   │   ├── AdminResponsiveContainer/
│   │   ├── AdminTableCard/
│   │   └── Charts/
│   ├── ChatShortcut/             # 🤖 AI Chatbot Component
│   │   ├── ChatShortcut.jsx      (572 lines)
│   │   └── ChatShortcut.module.css
│   ├── layout/
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   └── ui/
│       ├── ProductCard.jsx
│       ├── CategoryPill.jsx
│       ├── OrderDetail.jsx
│       └── SnowEffect.jsx
│
├── contexts/                     # State Management
│   ├── AuthContext.jsx           - Auth state (login/logout)
│   ├── CartContext.jsx           - Shopping cart state
│   ├── AdminAuthContext.jsx      - Admin authentication
│   └── SidebarContext.jsx        - Sidebar toggle state
│
├── pages/                        # Page Components
│   ├── HomePage.jsx
│   ├── MenuPage.jsx
│   ├── AboutPage.jsx
│   ├── CombosPage.jsx
│   ├── CartPage.jsx
│   ├── CheckoutPage.jsx
│   ├── ContactPage.jsx
│   ├── TrackOrderPage.jsx
│   ├── ProfileEditPage.jsx
│   ├── LoginPage.jsx
│   ├── OrderSuccessPage.jsx
│   ├── PaymentFailedPage.jsx
│   └── admin/
│       ├── AdminDashboard.jsx
│       ├── AdminLayout.jsx
│       ├── AdminLogin.jsx
│       ├── ManageProducts.jsx
│       ├── ManageOrders.jsx
│       ├── ManageReviews.jsx
│       ├── ManageUsers.jsx
│       └── ... (20+ admin pages)
│
├── services/
│   ├── api.js                    - API calls & axios config
│   ├── locationService.js        - Location APIs
│   └── shippingService.js        - Shipping calculations
│
├── hooks/
│   └── useResizeObserver.js      - Custom hook for responsive
│
├── styles/
│   ├── global.css
│   ├── theme.css
│   ├── admin.css
│   ├── christmas.css            - Holiday theme
│   └── admin/
│       └── ... (admin styles)
│
├── App.jsx                       - Main app component
├── main.jsx                      - Entry point
└── index.html
```

---

## 🚀 Cài Đặt & Chạy

### Prerequisites
- Node.js >= 16
- npm hoặc yarn

### Step 1: Clone Repository
```bash
git clone https://github.com/qvinh0402/NCKH_frontend.git
cd NCKH_frontend
```

### Step 2: Cài Đặt Dependencies
```bash
npm install
# hoặc
yarn install
```

### Step 3: Chạy Development Server
```bash
npm run dev
# hoặc
yarn dev
```

Server sẽ chạy tại `http://localhost:5174`

### Step 4: Build Production
```bash
npm run build
# hoặc
yarn build
```

### Step 5: Preview Build
```bash
npm run preview
```

---

## ⚙️ Cấu Hình

### Environment Variables (`.env`)
```env
# Backend API
VITE_API_BASE_URL=http://localhost:3001

# Optional: Chatbot settings
VITE_CHATBOT_ENABLED=true
VITE_CHATBOT_MAX_HISTORY=50

# Optional: Payment gateway
VITE_PAYMENT_PROVIDER=stripe
```

### Vite Config (`vite.config.js`)
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: false
  }
})
```

---

## 📡 API Integration

Frontend kết nối với backend tại **`http://localhost:3001`**

### Các API Chính

| Chức Năng | Method | Endpoint |
|----------|--------|----------|
| 📦 Lấy sản phẩm | GET | `/api/products` |
| 🛒 Tạo đơn hàng | POST | `/api/orders` |
| 📍 Kiểm tra đơn hàng | GET | `/api/orders/:id` |
| 💬 **Chatbot** | POST | `/api/chatbot/message` |
| 👤 Đăng nhập | POST | `/api/auth/login` |
| ⭐ Đánh giá | POST | `/api/reviews` |

📋 **Danh sách đầy đủ 64 API**: Xem [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 🤖 Chatbot AI

### 📋 Overview
- **Location**: `src/components/ChatShortcut/ChatShortcut.jsx`
- **Lines of Code**: 572
- **Deployment**: Hiển thị trên 4+ pages (HomePage, MenuPage, AboutPage, CombosPage)

### ✨ Tính Năng
- 💬 Nhắn tin 2 chiều với AI
- 🎯 Gợi ý động (best-selling products, order tracking, etc.)
- 💾 **Lưu đoạn chat** (TTL 24h) - Chỉ user đã đăng nhập
- 🔄 Auto-load chat history (24h cache)
- 👤 Guest mode support
- 🔄 Auto-logout cleanup

### 📊 Caching System
```
┌─────────────────────────────┐
│   Chat Cache (24h TTL)      │
├─────────────────────────────┤
│ chat_cache (localStorage)   │
│ saved_chats (per-chat TTL)  │
└─────────────────────────────┘
```

### 🔐 Authentication
```javascript
// Protected Features (Require Login)
- Save Chat (💾)
- View Saved Chats (📂)
- Load Saved Chat
- Delete Saved Chat

// Available to All
- Send/Receive Messages
- Auto-complete Suggestions
- 24h Cache Loading
```

### 🔌 API Integration
```javascript
// Chatbot Message API
POST /api/chatbot/message
{
  "message": "Thông tin chi nhánh?",
  "userId": "user123"  // or "guest"
}

Response:
{
  "reply": "Chi nhánh của chúng tôi...",
  "suggestions": ["...", "...", "..."]
}
```

### 🎨 UI Components
- **Mini Bubble**: Floating button (💬) với rotating text
- **Chat Window**: Full-featured chat interface
- **Saved Chats Panel**: Load/delete chats (TTL countdown)
- **Save Form Modal**: Name input + save button
- **Notification Toast**: Success/error/warning messages

---

## 👨‍💼 Admin Dashboard

### 📊 Quản Lý
- Dashboard Overview (doanh số, đơn hàng, khách hàng)
- Sản phẩm (CRUD)
- Đơn hàng (view & update status)
- Đánh giá (view, respond, analytics)
- Người dùng (view, ban/unban)
- Combo & Khuyến mãi
- Voucher & Gift
- Banner quảng cáo

### 📈 AI Analytics
- **Review Analysis**: Phân tích sentiment từ đánh giá
- **Weekly Summary**: Tóm tắt tuần từ đánh giá
- **Recommendations**: Gợi ý cải thiện từ AI
- **Sales Reports**: Báo cáo doanh số chi tiết
- **Product Insights**: Phân tích hiệu suất sản phẩm

### 📍 Quyền Truy Cập
```
Super Admin: Toàn quyền ✅
Chi Nhánh Admin: Quản lý đơn hàng + review của chi nhánh
```

---

## 📊 Tính Năng Chính Khác

### 🛍️ Mua Sắm
- ✅ Browse menu & combos
- ✅ Search & filter
- ✅ Shopping cart persistence (localStorage)
- ✅ Checkout & payment
- ✅ Order confirmation email

### 📦 Đơn Hàng
- ✅ Order history
- ✅ Real-time status tracking
- ✅ Order details & receipt
- ✅ Cancel order request

### ⭐ Đánh Giá
- ✅ Rate products (1-5 stars)
- ✅ Add photos/videos
- ✅ Like/unlike reviews
- ✅ Admin responses
- ✅ Review analytics (AI-powered)

### 👤 Tài Khoản
- ✅ User registration
- ✅ Email verification
- ✅ Profile management
- ✅ Change password
- ✅ Order history
- ✅ Saved addresses

### 🎄 Ngoài Lề
- 🎄 Christmas theme (`christmas.css`)
- 🌨️ Snow effect animation
- 🎁 Special promotions
- 🎊 Holiday banners

---

## 🔐 Xác Thực & Bảo Mật

### Authentication Flow
```
┌──────────────┐
│  Login Page  │
└──────┬───────┘
       │ POST /api/auth/login
       ▼
┌──────────────────────────┐
│   Backend (Node.js)      │
│   - Validate credentials │
│   - Generate JWT token   │
└──────┬───────────────────┘
       │ {token, user}
       ▼
┌──────────────────────────┐
│   AuthContext.jsx        │
│   - Store token/user     │
│   - localStorage auth_*  │
│   - isAuthenticated=true │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│   Protected Routes       │
│   - Admin Dashboard      │
│   - Profile Page         │
│   - Saved Chats          │
└──────────────────────────┘
```

### Security Features
- ✅ JWT Token authentication
- ✅ localStorage token storage
- ✅ Auto-logout on token expiry
- ✅ Protected routes (RequireAdmin, RequireAuth)
- ✅ CORS headers
- ✅ XSS prevention (React escaping)
- ✅ CSRF protection (backend)

### Logout Cleanup
```javascript
// When user logout:
- Reset AuthContext ✅
- Clear localStorage (auth_token, auth_user, etc.) ✅
- Reset ChatShortcut state ✅
- Clear chat cache & saved chats ✅
- Redirect to home page ✅
```

---

## 📦 Dependencies

### Core
- **react**: ^19.1.1 - UI library
- **react-dom**: ^19.1.1 - DOM rendering
- **vite**: ^5.4.14 - Build tool
- **axios**: - HTTP client

### UI & Styling
- **bootstrap**: ^5.3.8 - CSS framework
- **recharts**: ^3.4.1 - Charts library

### Utilities
- **date-fns**: - Date formatting (if used)
- **js-cookie**: - Cookie management (if used)

### Development
- **@vitejs/plugin-react**: - React plugin for Vite
- **eslint**: - Code linting
- **@eslint/js**: - ESLint config

---

## 🚀 Performance

### Optimizations
- ✅ Code splitting (page-based)
- ✅ Lazy loading (admin pages)
- ✅ Image optimization
- ✅ CSS Modules (no global conflicts)
- ✅ localStorage caching (24h)
- ✅ Fast Refresh (HMR)

### Bundle Size
- Production build: ~200KB (gzipped)
- Dev build: ~1.5MB

---

## 📱 Responsive Design

- ✅ Mobile-first approach
- ✅ Bootstrap grid system
- ✅ Custom breakpoints
- ✅ Responsive images
- ✅ Touch-friendly UI

---

## 🐛 Troubleshooting

### Issue: Port 5174 already in use
```bash
npm run dev -- --port 5175
```

### Issue: API connection error
- Check backend is running on http://localhost:3001
- Verify `.env` has correct API URL
- Check CORS headers in backend

### Issue: Chatbot not responding
- Verify backend chatbot endpoint `/api/chatbot/message`
- Check user authentication (if saved chats)
- Clear localStorage cache

---

## 🤝 Đóng Góp

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 Liên Hệ & Support

- **Developer**: Vinh Quang
- **GitHub**: [qvinh0402](https://github.com/qvinh0402)
- **Project**: Secret Pizza - E-Commerce Platform

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**🚀 Happy Coding! Enjoy building amazing features with React + Vite + Chatbot AI!**
