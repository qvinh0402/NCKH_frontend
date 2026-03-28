import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './ChatShortcut.module.css';

const defaultSuggestions = [
  'Xem món đắt nhất',
  'Xem món rẻ nhất',
  'Xem món bán chạy',
  'Hướng dẫn đặt hàng',
  'Cách kiểm tra đơn hàng',
  'Hướng dẫn đánh giá món',
  'Hướng dẫn đánh giá đơn hàng'
];

// ============================================
// CACHE UTILITIES - 24h TTL
// ============================================
const CACHE_KEY = 'chat_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const getCache = () => {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    if (!cache) return null;

    const parsed = JSON.parse(cache);
    if (Date.now() > parsed.expiry) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const setCache = (data) => {
  try {
    const payload = {
      data,
      expiry: Date.now() + CACHE_TTL
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('[ChatCache] Save error:', err);
  }
};

const clearCache = () => {
  localStorage.removeItem(CACHE_KEY);
};

// ============================================
// AUTH UTILITIES - Đồng bộ với hệ thống auth
// ============================================
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const CHAT_USER_KEY = 'chat_user';

const getAuthInfo = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    
    return {
      token,
      user,
      isLoggedIn: !!(token && user),
      userId: user?.maTaiKhoan || null
    };
  } catch {
    return { token: null, user: null, isLoggedIn: false, userId: null };
  }
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function ChatShortcut() {
  // Auth state - đồng bộ với hệ thống auth
  const [authInfo, setAuthInfo] = useState(getAuthInfo());
  
  // UI States
  const [open, setOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [bubbleText, setBubbleText] = useState('Xin chào Quý Khách! Tôi là trợ lý AI của Secret Pizza 😊');

  // Chat States
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Xin chào Quý Khách! Tôi là trợ lý AI của Secret Pizza 😊' },
    { from: 'bot', text: 'Tôi rất sẵn lòng hỗ trợ Bạn' }
  ]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Suggestions
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [dynamicSuggestions, setDynamicSuggestions] = useState(defaultSuggestions);

  const endRef = useRef(null);

  // Destructure auth info
  const { isLoggedIn, userId, token } = authInfo;

  // ============================================
  // Lắng nghe thay đổi auth từ localStorage
  // ============================================
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === TOKEN_KEY || e.key === USER_KEY || e.key === CHAT_USER_KEY) {
        const newAuthInfo = getAuthInfo();
        setAuthInfo(newAuthInfo);
        
        // Nếu đăng xuất, reset messages về mặc định
        if (!newAuthInfo.isLoggedIn) {
          setMessages([
            { from: 'bot', text: 'Xin chào Quý Khách! Tôi là trợ lý AI của Secret Pizza 😊' },
            { from: 'bot', text: 'Tôi rất sẵn lòng hỗ trợ Bạn' }
          ]);
          clearCache();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ============================================
  // Kiểm tra auth định kỳ (xử lý token hết hạn)
  // ============================================
  useEffect(() => {
    if (!isLoggedIn) return;

    const checkAuthInterval = setInterval(() => {
      const currentAuth = getAuthInfo();
      if (!currentAuth.isLoggedIn && authInfo.isLoggedIn) {
        // User đã đăng xuất ở tab khác
        setAuthInfo(currentAuth);
        setMessages([
          { from: 'bot', text: 'Xin chào Quý Khách! Tôi là trợ lý AI của Secret Pizza 😊' },
          { from: 'bot', text: 'Tôi rất sẵn lòng hỗ trợ Bạn' }
        ]);
        clearCache();
      }
    }, 5000); // Check mỗi 5 giây

    return () => clearInterval(checkAuthInterval);
  }, [isLoggedIn, authInfo.isLoggedIn]);

  // ============================================
  // BUBBLE TEXT ROTATION
  // ============================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setBubbleText('Tôi rất sẵn lòng hỗ trợ Bạn');
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  // ============================================
  // LOAD CACHE (CHỈ KHI LOGIN + CHƯA CÓ MESSAGES)
  // ============================================
  useEffect(() => {
    if (!isLoggedIn) return;

    const cached = getCache();
    if (cached && cached.length > 0) {
      setMessages(cached);
    }
  }, [isLoggedIn]);

  // ============================================
  // LOAD HISTORY FROM SERVER (CHỈ LOGIN)
  // ============================================
  useEffect(() => {
    if (!open || !isLoggedIn) return;

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await fetch(`http://localhost:3001/api/chatbot/history/${userId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (res.status === 401) {
          // Token hết hạn, đăng xuất
          handleAuthExpired();
          return;
        }

        const data = await res.json();

        if (data.success && data.data.length > 0) {
          setMessages(data.data);
          setCache(data.data);
        }
      } catch (err) {
        console.error("[ChatHistory] Load error:", err);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [open, isLoggedIn, userId, token]);

  // ============================================
  // SAVE CACHE (CHỈ LOGIN)
  // ============================================
  useEffect(() => {
    if (isLoggedIn && messages.length > 0) {
      setCache(messages);
    }
  }, [messages, isLoggedIn]);

  // ============================================
  // AUTO SCROLL
  // ============================================
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // ============================================
  // Xử lý token hết hạn
  // ============================================
  const handleAuthExpired = useCallback(() => {
    // Xóa auth data
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(CHAT_USER_KEY);
    clearCache();
    
    setAuthInfo({ token: null, user: null, isLoggedIn: false, userId: null });
    setMessages([
      { from: 'bot', text: 'Xin chào Quý Khách! Tôi là trợ lý AI của Secret Pizza 😊' },
      { from: 'bot', text: 'Tôi rất sẵn lòng hỗ trợ Bạn' }
    ]);
    
    // Thông báo cho user
    setMessages(m => [
      ...m,
      { from: 'bot', text: '⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để lưu lịch sử chat.', timestamp: new Date() }
    ]);
  }, []);

  // ============================================
  // REFRESH HISTORY (CHỈ LOGIN)
  // ============================================
  const refreshHistory = useCallback(async () => {
    if (!isLoggedIn) return;

    setHistoryLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/chatbot/history/${userId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (res.status === 401) {
        handleAuthExpired();
        return;
      }

      const data = await res.json();

      if (data.success) {
        setMessages(data.data);
        setCache(data.data);
      }
    } catch (err) {
      console.error("[ChatHistory] Refresh error:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [isLoggedIn, userId, token, handleAuthExpired]);

  // ============================================
  // SEND MESSAGE
  // ============================================
  const send = async (customText) => {
    const q = (customText || text).trim();
    if (!q || loading) return;

    const userMsg = {
      from: 'user',
      text: q,
      timestamp: new Date()
    };

    setMessages(m => [...m, userMsg]);
    setText('');
    setShowSuggestions(false);
    setLoading(true);

    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:3001/api/chatbot/message', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: q,
          userId: userId || 'guest'
        })
      });

      if (response.status === 401) {
        handleAuthExpired();
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const botReply =
        data?.data?.reply ||
        data?.reply ||
        data?.message ||
        'Xin lỗi, Mình không hiểu. Vui lòng thử lại.';

      const botMsg = {
        from: 'bot',
        text: botReply,
        timestamp: new Date()
      };

      setMessages(m => [...m, botMsg]);

      // ============================
      // Suggestions
      // ============================
      const aiSuggestions = data?.data?.suggestions || data?.suggestions;

      if (aiSuggestions && Array.isArray(aiSuggestions)) {
        setDynamicSuggestions(aiSuggestions);
        setShowSuggestions(true);
      } else if (q.toLowerCase().includes("đơn")) {
        setDynamicSuggestions([
          "Cách kiểm tra đơn hàng",
          "Hướng dẫn đánh giá đơn hàng"
        ]);
        setShowSuggestions(true);
      } else if (q.toLowerCase().includes("món")) {
        setDynamicSuggestions([
          "Xem món đắt nhất",
          "Xem món rẻ nhất",
          "Xem món bán chạy"
        ]);
        setShowSuggestions(true);
      } else {
        setDynamicSuggestions(defaultSuggestions);
      }

    } catch (error) {
      console.error('[Chatbot] API error:', error);

      setMessages(m => [
        ...m,
        { from: 'bot', text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.', timestamp: new Date() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CLEAR CHAT - Xóa cả local và server (nếu login)
  // ============================================
  const clearChat = async () => {
    // Reset về messages mặc định
    const defaultMessages = [
      { from: 'bot', text: 'Xin chào Quý Khách! Tôi là trợ lý AI của Secret Pizza 😊' },
      { from: 'bot', text: 'Tôi rất sẵn lòng hỗ trợ Bạn' }
    ];
    setMessages(defaultMessages);
    setShowSuggestions(true);

    // Xóa cache local
    clearCache();

    // Nếu đã đăng nhập, xóa cả trên server
    if (isLoggedIn && token) {
      try {
        const res = await fetch(`http://localhost:3001/api/chatbot/history/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
          handleAuthExpired();
          return;
        }

        const data = await res.json();

        if (data.success) {
          console.log('[ChatHistory] Server history cleared');
        } else {
          console.warn('[ChatHistory] Clear server history failed:', data.message);
        }
      } catch (err) {
        console.error('[ChatHistory] Clear error:', err);
      }
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={styles.wrapper}>

      {/* MINI BUBBLE */}
      {showBubble && !open && (
        <div
          className={styles.miniBubble}
          onClick={() => {
            setOpen(true);
            setShowBubble(false);
          }}
        >
          <div className={styles.miniHeader}>
            <strong>Secret Pizza</strong>
          </div>

          <div className={styles.miniText}>{bubbleText}</div>

          <button
            className={styles.bubbleClose}
            onClick={(e) => {
              e.stopPropagation();
              setShowBubble(false);
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* CHAT WINDOW */}
      {open && (
        <div className={styles.chatWindow}>

          {/* HEADER */}
          <div className={styles.chatHeader}>
            <span>Hỗ trợ khách hàng</span>

            <div className={styles.headerActions}>
              {isLoggedIn && (
                <button
                  onClick={refreshHistory}
                  disabled={historyLoading}
                  title="Làm mới lịch sử"
                  className={styles.iconBtn}
                >
                  {historyLoading ? '⏳' : '🔄'}
                </button>
              )}

              <button
                onClick={clearChat}
                title="Xóa cuộc trò chuyện"
                className={styles.iconBtn}
              >
                🗑
              </button>

              <button
                className={styles.headerClose}
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>

          {/* NOTICE GUEST */}
          {!isLoggedIn && (
            <div className={styles.guestNotice}>
              ⚠️ Bạn đang chat với tư cách khách (không lưu lịch sử)
            </div>
          )}

          {/* LOGIN NOTICE */}
          {isLoggedIn && (
            <div className={styles.loginNotice}>
              ✓ Đã đăng nhập {authInfo.user?.hoTen ? `- ${authInfo.user.hoTen}` : ''} - Lịch sử được lưu 24h
            </div>
          )}

          {/* CHAT BODY */}
          <div className={styles.chatBody}>
            {historyLoading && (
              <div className={styles.loadingIndicator}>
                Đang tải lịch sử...
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={m.from === 'user' ? styles.msgUser : styles.msgBot}
              >
                {m.text}
              </div>
            ))}

            {loading && (
              <div className={styles.msgBot}>
                <span className={styles.typing}>Đang trả lờ</span>
                <span className={styles.dots}>...</span>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* SUGGESTIONS */}
          {showSuggestions && (
            <div className={styles.suggestionBox}>
              {dynamicSuggestions.map((s, i) => (
                <button
                  key={i}
                  className={styles.suggestionBtn}
                  onClick={() => send(s)}
                  disabled={loading}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* FOOTER */}
          <div className={styles.chatFooter}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && send()}
              placeholder="Gõ câu hỏi..."
              disabled={loading}
            />

            <button onClick={() => send()} disabled={loading}>
              {loading ? '...' : 'Gửi'}
            </button>
          </div>

          {/* DISCLAIMER */}
          <div className={styles.disclaimer}>
            Thông tin chỉ mang tính tham khảo (AI)
          </div>

        </div>
      )}

      {/* FAB */}
      <button
        className={styles.fab}
        onClick={() => {
          setOpen(s => !s);
          setShowBubble(false);
        }}
      >
        {open ? '✕' : '💬'}
      </button>

    </div>
  );
}
