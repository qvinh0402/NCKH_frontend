import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
const CACHE_TTL = 24 * 60 * 60 * 1000;

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
    const payload = { data, expiry: Date.now() + CACHE_TTL };
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
  // ✅ Dùng AuthContext + Fallback localStorage
  const auth = useAuth();
  const isAuthenticated = auth.isAuthenticated;
  const user = auth.user;
  
  // ✅ FIX: Fallback lấy token từ localStorage nếu context chưa có
  const token = auth.token || localStorage.getItem('auth_token');
  
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
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [dynamicSuggestions, setDynamicSuggestions] = useState(defaultSuggestions);

  const endRef = useRef(null);
  const isLoggedIn = isAuthenticated;
  const userId = user?.maTaiKhoan || 'guest';

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
  // LOAD CACHE (24H TTL - CHO TẤT CẢ USER)
  // ============================================
  useEffect(() => {
    const cached = getCache();
    if (cached && cached.length > 0) {
      setMessages(cached);
    }
  }, []);

  // ============================================
  // LOAD HISTORY FROM SERVER (CHO TẤT CẢ USER)
  // ============================================
  useEffect(() => {
    if (!open) return;

    const loadHistory = async () => {
      const currentToken = token || localStorage.getItem('auth_token');
      
      console.log('[ChatHistory] Loading with token:', currentToken ? 'Có' : 'Không');
      
      setHistoryLoading(true);
      try {
        const res = await fetch(`http://localhost:3001/api/chatbot/history/${userId}`, {
          headers: currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}
        });
        
        if (res.status === 401) {
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
  }, [open, userId, token]);

  // ============================================
  // SAVE CACHE (24H TTL - CHO TẤT CẢ USER)
  // ============================================
  useEffect(() => {
    if (messages.length > 0) {
      setCache(messages);
    }
  }, [messages]);

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
    setMessages([
      { from: 'bot', text: 'Xin chào Quý Khách! Tôi là trợ lý AI của Secret Pizza 😊' },
      { from: 'bot', text: 'Tôi rất sẵn lòng hỗ trợ Bạn' }
    ]);
    clearCache();

  }, []);

  // ============================================
  // REFRESH HISTORY (CHO TẤT CẢ USER)
  // ============================================
  const refreshHistory = useCallback(async () => {
    // ✅ FIX: Lấy token mới nhất
    const currentToken = token || localStorage.getItem('auth_token');

    setHistoryLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/chatbot/history/${userId}`, {
        headers: currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}
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
  }, [userId, token, handleAuthExpired]);

  // ============================================
  // SEND MESSAGE
  // ============================================
  const send = async (customText) => {
    const q = (customText || text).trim();
    if (!q || loading) return;

    const userMsg = { from: 'user', text: q, timestamp: new Date() };
    setMessages(m => [...m, userMsg]);
    setText('');
    setShowSuggestions(false);
    setLoading(true);

    try {
      // ✅ FIX: Lấy token mới nhất
      const currentToken = token || localStorage.getItem('auth_token');
      
      const headers = { 'Content-Type': 'application/json' };
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }

      const response = await fetch('http://localhost:3001/api/chatbot/message', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: q, userId: userId || 'guest' })
      });

      if (response.status === 401) {
        handleAuthExpired();
        setLoading(false);
        return;
      }

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const botReply = data?.data?.reply || data?.reply || data?.message || 'Xin lỗi, Mình không hiểu. Vui lòng thử lại.';
      const botMsg = { from: 'bot', text: botReply, timestamp: new Date() };
      setMessages(m => [...m, botMsg]);

      // Suggestions
      const aiSuggestions = data?.data?.suggestions || data?.suggestions;
      if (aiSuggestions && Array.isArray(aiSuggestions)) {
        setDynamicSuggestions(aiSuggestions);
        setShowSuggestions(true);
      } else if (q.toLowerCase().includes("đơn")) {
        setDynamicSuggestions(["Cách kiểm tra đơn hàng", "Hướng dẫn đánh giá đơn hàng"]);
        setShowSuggestions(true);
      } else if (q.toLowerCase().includes("món")) {
        setDynamicSuggestions(["Xem món đắt nhất", "Xem món rẻ nhất", "Xem món bán chạy"]);
        setShowSuggestions(true);
      } else {
        setDynamicSuggestions(defaultSuggestions);
      }
    } catch (error) {
      console.error('[Chatbot] API error:', error);
      setMessages(m => [...m, { from: 'bot', text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FORMAT TIME FOR DISPLAY
  // ============================================
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0 && minutes === 0) return 'Vừa xong';
    if (hours === 0) return `${minutes}p trước`;
    if (hours < 24) return `${hours}h trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={styles.wrapper}>
      {/* MINI BUBBLE */}
      {showBubble && !open && (
        <div className={styles.miniBubble} onClick={() => { setOpen(true); setShowBubble(false); }}>
          <div className={styles.miniHeader}><strong>Secret Pizza</strong></div>
          <div className={styles.miniText}>{bubbleText}</div>
          <button className={styles.bubbleClose} onClick={(e) => { e.stopPropagation(); setShowBubble(false); }}>✕</button>
        </div>
      )}

      {/* CHAT WINDOW */}
      {open && (
        <div className={styles.chatWindow}>
          {/* HEADER */}
          <div className={styles.chatHeader}>
            <span>Hỗ trợ khách hàng</span>
            <div className={styles.headerActions}>
              <button className={styles.headerClose} onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          {/* CHAT BODY */}
          <div className={styles.chatBody}>
            {messages.map((m, i) => (
              <div key={i} className={m.from === 'user' ? styles.msgUser : styles.msgBot}>{m.text}</div>
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
                <button key={i} className={styles.suggestionBtn} onClick={() => send(s)} disabled={loading}>{s}</button>
              ))}
            </div>
          )}

          {/* FOOTER */}
          <div className={styles.chatFooter}>
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !loading && send()} placeholder="Gõ câu hỏi..." disabled={loading} />
            <button onClick={() => send()} disabled={loading}>{loading ? '...' : 'Gửi'}</button>
          </div>

          {/* DISCLAIMER */}
          <div className={styles.disclaimer}>Thông tin chỉ mang tính tham khảo (AI)</div>
        </div>
      )}

      {/* FAB */}
      <button className={styles.fab} onClick={() => { setOpen(s => !s); setShowBubble(false); }}>
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}