import React, { useEffect, useRef, useState } from 'react';
import styles from './ChatShortcut.module.css';

export default function ChatShortcut() {
  const [open, setOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [bubbleText, setBubbleText] = useState('Xin chào Quý Khách! Tôi là trợ lý AI của Secret Pizza 😊');
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Xin chào Quý Khách! Tôi là trợ lý AI của Secret Pizza 😊' },
    { from: 'bot', text: 'Tôi rất sẵn lòng hỗ trợ Bạn' }
  ]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBubbleText('Tôi rất sẵn lòng hỗ trợ Bạn');
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);

  const send = async () => {
    if (!text.trim() || loading) return;
    const q = text.trim();
    const userMsg = { from: 'user', text: q };
    setMessages(m => [...m, userMsg]);
    setText('');
    setLoading(true);

    try {
      // Call chatbot API endpoint
      const response = await fetch('http://localhost:3001/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          userId: localStorage.getItem("chat_user") || "guest"
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Chatbot response:", data);

      const botReply =
        data?.data?.reply ||
        data?.reply ||
        data?.message ||
          'Xin lỗi, Mình không hiểu. Vui lòng thử lại.';   
      setMessages(m => [...m, { from: 'bot', text: botReply }]);
    } catch (error) {
      console.error('Chatbot API error:', error);
      setMessages(m => [...m, { from: 'bot', text: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      {showBubble && !open && (
        <div className={styles.miniBubble} onClick={() => { setOpen(true); setShowBubble(false); }}>
          <div className={styles.miniHeader}><strong>Secret Pizza</strong></div>
          <div className={styles.miniText}>{bubbleText}</div>
          <button
            className={styles.bubbleClose}
            onClick={(e) => { e.stopPropagation(); setShowBubble(false); }}
            aria-label="Đóng"
          >✕</button>
        </div>
      )}

      {open && (
        <div className={styles.chatWindow} role="dialog" aria-label="Hỗ trợ khách hàng">
          <div className={styles.chatHeader}>
            Hỗ trợ khách hàng
            <button className={styles.headerClose} onClick={() => setOpen(false)} aria-label="Đóng">✕</button>
          </div>

          <div className={styles.chatBody}>
            {messages.map((m, i) => (
              <div key={i} className={m.from === 'user' ? styles.msgUser : styles.msgBot}>{m.text}</div>
            ))}
            <div ref={endRef} />
          </div>

          <div className={styles.chatFooter}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && send()}
              placeholder="Gõ câu hỏi..."
              aria-label="Gõ câu hỏi"
              disabled={loading}
            />
            <button onClick={send} disabled={loading} aria-label="Gửi">
              {loading ? '...' : 'Gửi'}
            </button>
          </div>

          <div className={styles.disclaimer}>
            Thông tin chỉ mang tính tham khảo, được tư vấn bởi Trí Tuệ Nhân Tạo
          </div>
        </div>
      )}

      <button
        className={styles.fab}
        onClick={() => { setOpen(s => !s); setShowBubble(false); }}
        aria-label="Mở chat"
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
