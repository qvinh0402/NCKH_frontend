import React, { useEffect, useRef, useState } from 'react';
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

export default function ChatShortcut() {

const rawUserId = localStorage.getItem("chat_user");
const isLoggedIn =
  rawUserId &&
  rawUserId !== "guest" &&
  rawUserId !== "null" &&
  rawUserId !== "undefined";
  const userId = isLoggedIn ? rawUserId : "guest";

  const [open, setOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [bubbleText, setBubbleText] = useState('Xin chào Quý Khách! Tôi là trợ lý AI của Secret Pizza 😊');

  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Xin chào Quý Khách! Tôi là trợ lý AI của Secret Pizza 😊' },
    { from: 'bot', text: 'Tôi rất sẵn lòng hỗ trợ Bạn' }
  ]);

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const [showSuggestions, setShowSuggestions] = useState(true);
  const [dynamicSuggestions, setDynamicSuggestions] = useState(defaultSuggestions);

  const endRef = useRef(null);

  // ============================================
  // BUBBLE TEXT
  // ============================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setBubbleText('Tôi rất sẵn lòng hỗ trợ Bạn');
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  // ============================================
  // LOAD CACHE (CHỈ KHI LOGIN)
  // ============================================

  useEffect(() => {
    if (!isLoggedIn) return;

    const cache = localStorage.getItem("chat_cache");

    if (cache) {
      try {
        setMessages(JSON.parse(cache));
      } catch {
        localStorage.removeItem("chat_cache");
      }
    }
  }, [isLoggedIn]);

  // ============================================
  // LOAD HISTORY SERVER (CHỈ LOGIN)
  // ============================================

  useEffect(() => {
    if (open && isLoggedIn) {
      fetch(`http://localhost:3001/api/chatbot/history/${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data.length > 0) {
            setMessages(data.data);
          }
        })
        .catch(err => console.error("Load history error:", err));
    }
  }, [open, isLoggedIn, userId]);

  // ============================================
  // SAVE CACHE (CHỈ LOGIN)
  // ============================================

  useEffect(() => {
    if (isLoggedIn && messages.length > 0) {
      localStorage.setItem("chat_cache", JSON.stringify(messages));
    }
  }, [messages, isLoggedIn]);

  // ============================================
  // AUTO SCROLL
  // ============================================

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

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

      const aiSuggestions =
        data?.data?.suggestions ||
        data?.suggestions;

      if (aiSuggestions && Array.isArray(aiSuggestions)) {
        setDynamicSuggestions(aiSuggestions);
        setShowSuggestions(true);
      }
      else if (q.toLowerCase().includes("đơn")) {
        setDynamicSuggestions([
          "Cách kiểm tra đơn hàng",
          "Hướng dẫn đánh giá đơn hàng"
        ]);
        setShowSuggestions(true);
      }
      else if (q.toLowerCase().includes("món")) {
        setDynamicSuggestions([
          "Xem món đắt nhất",
          "Xem món rẻ nhất",
          "Xem món bán chạy"
        ]);
        setShowSuggestions(true);
      }
      else {
        setDynamicSuggestions(defaultSuggestions);
      }

    } catch (error) {

      console.error('Chatbot API error:', error);

      setMessages(m => [
        ...m,
        { from: 'bot', text: 'Xin lỗi, có lỗi xảy ra.', timestamp: new Date() }
      ]);

    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CLEAR CHAT
  // ============================================

  const clearChat = () => {
    setMessages([]);

    if (isLoggedIn) {
      localStorage.removeItem("chat_cache");
    }
  };

  // ============================================
  // UI
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

          <div className={styles.chatHeader}>
            Hỗ trợ khách hàng

            <div>
              <button onClick={clearChat} style={{ marginRight: 8 }}>
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
            <div style={{ fontSize: 12, color: '#999', padding: 6 }}>
              ⚠️ Bạn đang chat với tư cách khách (không lưu lịch sử)
            </div>
          )}

          <div className={styles.chatBody}>

            {messages.map((m, i) => (
              <div
                key={i}
                className={m.from === 'user'
                  ? styles.msgUser
                  : styles.msgBot}
              >
                {m.text}
              </div>
            ))}

            {loading && (
              <div className={styles.msgBot}>
                Đang trả lời...
              </div>
            )}

            <div ref={endRef} />

          </div>

          {/* Suggestions */}
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