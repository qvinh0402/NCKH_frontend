import React, { useEffect, useRef, useState } from 'react';
import styles from './ChatShortcut.module.css';

export default function ChatShortcut() {
  const [open, setOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [bubbleText, setBubbleText] = useState('Xin chào Anh/Chị! Em là trợ lý AI của Secret Pizza 😊');
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Xin chào Anh/Chị! Em là trợ lý AI của Secret Pizza 😊' },
    { from: 'bot', text: 'Em rất sẵn lòng hỗ trợ Anh/Chị' }
  ]);
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBubbleText('Em rất sẵn lòng hỗ trợ Anh/Chị');
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);

  const send = () => {
    if (!text.trim()) return;
    const q = text.trim();
    const userMsg = { from: 'user', text: q };
    setMessages(m => [...m, userMsg]);
    setText('');

    // TODO: replace with real API call to backend/chat service
    setTimeout(() => {
      setMessages(m => [...m, { from: 'bot', text: `Demo trả lời: "${q}"` }]);
    }, 600);
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
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Gõ câu hỏi..."
              aria-label="Gõ câu hỏi"
            />
            <button onClick={send} aria-label="Gửi">Gửi</button>
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
