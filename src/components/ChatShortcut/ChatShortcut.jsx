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
// MAIN COMPONENT
// ============================================
export default function ChatShortcut() {
  // User authentication
  const rawUserId = localStorage.getItem("chat_user");
  const isLoggedIn =
    rawUserId &&
    rawUserId !== "guest" &&
    rawUserId !== "null" &&
    rawUserId !== "undefined";
  const userId = isLoggedIn ? rawUserId : "guest";

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
        const res = await fetch(`http://localhost:3001/api/chatbot/history/${userId}`);
        const data = await res.json();

        if (data.success && data.data.length > 0) {
          // Merge server history với cache nếu cần
          setMessages(data.data);
          // Cập nhật cache
          setCache(data.data);
        }
      } catch (err) {
        console.error("[ChatHistory] Load error:", err);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [open, isLoggedIn, userId]);

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
  // REFRESH HISTORY (CHỈ LOGIN)
  // ============================================
  const refreshHistory = useCallback(async () => {
    if (!isLoggedIn) return;

    setHistoryLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/chatbot/history/${userId}`);
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
  }, [isLoggedIn, userId]);

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
      const response = await fetch('http://localhost:3001/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          userId: userId
        })
      });

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
        setShowSuggestions(true);
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
    if (isLoggedIn) {
      try {
        const res = await fetch(`http://localhost:3001/api/chatbot/history/${userId}`, {
          method: 'DELETE'
        });
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
              ✓ Đã đăng nhập - Lịch sử được lưu 24h
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
