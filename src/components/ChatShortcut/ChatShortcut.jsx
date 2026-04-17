import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './ChatShortcut.module.css';

const defaultSuggestions = [
  'Xem món bán chạy',
  'Hướng dẫn đặt hàng',
  'Cách kiểm tra đơn hàng',
  'Hướng dẫn đánh giá món',
  'Hướng dẫn đánh giá đơn hàng',
  'Thông tin chi nhánh'
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
// SAVED CHATS UTILITIES - 24h TTL per chat
// ============================================
const SAVED_CHATS_KEY = 'saved_chats';
const SAVED_CHAT_TTL = 24 * 60 * 60 * 1000;

const getSavedChats = () => {
  try {
    const saved = localStorage.getItem(SAVED_CHATS_KEY);
    if (!saved) return [];
    const chats = JSON.parse(saved);
    // Filter out expired chats
    const now = Date.now();
    const validChats = chats.filter(chat => now <= chat.expiry);
    // If any expired, update storage
    if (validChats.length < chats.length) {
      if (validChats.length > 0) {
        localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(validChats));
      } else {
        localStorage.removeItem(SAVED_CHATS_KEY);
      }
    }
    return validChats;
  } catch {
    localStorage.removeItem(SAVED_CHATS_KEY);
    return [];
  }
};

const saveChatSnapshot = (messages, title) => {
  try {
    const newChat = {
      id: `chat_${Date.now()}`,
      title: title || `Chat ${new Date().toLocaleString('vi-VN')}`,
      messages: messages,
      savedAt: new Date().toLocaleString('vi-VN'),
      expiry: Date.now() + SAVED_CHAT_TTL
    };
    const chats = getSavedChats();
    chats.push(newChat);
    localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(chats));
    return newChat;
  } catch (err) {
    console.error('[SavedChats] Save error:', err);
    return null;
  }
};

const deleteSavedChat = (chatId) => {
  try {
    let chats = getSavedChats();
    chats = chats.filter(chat => chat.id !== chatId);
    if (chats.length > 0) {
      localStorage.setItem(SAVED_CHATS_KEY, JSON.stringify(chats));
    } else {
      localStorage.removeItem(SAVED_CHATS_KEY);
    }
  } catch (err) {
    console.error('[SavedChats] Delete error:', err);
  }
};

const getTimeRemaining = (expiryTime) => {
  const now = Date.now();
  const remaining = expiryTime - now;
  if (remaining <= 0) return 'Hết hạn';
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}p còn lại`;
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
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [dynamicSuggestions, setDynamicSuggestions] = useState(defaultSuggestions);
  const [showSavedChats, setShowSavedChats] = useState(false);
  const [savedChats, setSavedChats] = useState([]);
  const [saveTitle, setSaveTitle] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveNotification, setSaveNotification] = useState(null);

  const endRef = useRef(null);
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
  // LOAD SAVED CHATS
  // ============================================
  useEffect(() => {
    const chats = getSavedChats();
    setSavedChats(chats);
    // Check for expired chats and notify
    chats.forEach(chat => {
      if (Date.now() > chat.expiry) {
        setSaveNotification({ type: 'info', message: `Đoạn chat "${chat.title}" đã hết hạn lưu trữ (24h)` });
      }
    });
  }, [showSavedChats]);

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
  // SAVE CHAT SNAPSHOT
  // ============================================
  const handleSaveChat = () => {
    if (messages.length <= 2) {
      setSaveNotification({ type: 'warning', message: 'Không có đoạn chat để lưu!' });
      setTimeout(() => setSaveNotification(null), 3000);
      return;
    }
    setShowSaveForm(true);
  };

  const handleConfirmSave = () => {
    const title = saveTitle.trim() || `Chat ${new Date().toLocaleTimeString('vi-VN')}`;
    const savedChat = saveChatSnapshot(messages, title);
    
    if (savedChat) {
      setSaveNotification({ 
        type: 'success', 
        message: `✅ Lưu thành công: "${title}" (24h)` 
      });
      setSaveTitle('');
      setShowSaveForm(false);
      const updated = getSavedChats();
      setSavedChats(updated);
      setTimeout(() => setSaveNotification(null), 3000);
    } else {
      setSaveNotification({ 
        type: 'error', 
        message: 'Lỗi khi lưu đoạn chat' 
      });
      setTimeout(() => setSaveNotification(null), 3000);
    }
  };

  const handleLoadChat = (chatId) => {
    const chat = savedChats.find(c => c.id === chatId);
    if (chat) {
      if (Date.now() > chat.expiry) {
        deleteSavedChat(chatId);
        setSaveNotification({ 
          type: 'info', 
          message: '⏰ Đoạn chat đã hết hạn (24h) và bị xóa tự động' 
        });
        const updated = getSavedChats();
        setSavedChats(updated);
        setTimeout(() => setSaveNotification(null), 3000);
        return;
      }
      setMessages(chat.messages);
      setShowSavedChats(false);
      setSaveNotification({ 
        type: 'success', 
        message: `📂 Tải đoạn chat: "${chat.title}"` 
      });
      setTimeout(() => setSaveNotification(null), 2000);
    }
  };

  const handleDeleteChat = (chatId) => {
    if (window.confirm('Xác nhận xóa đoạn chat này?')) {
      deleteSavedChat(chatId);
      const updated = getSavedChats();
      setSavedChats(updated);
      setSaveNotification({ 
        type: 'success', 
        message: '🗑️ Xóa đoạn chat thành công' 
      });
      setTimeout(() => setSaveNotification(null), 2000);
    }
  };

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
              <button 
                onClick={handleSaveChat} 
                title="Lưu đoạn chat" 
                className={styles.iconBtn}
              >
                💾
              </button>
              <button 
                onClick={() => setShowSavedChats(!showSavedChats)} 
                title="Xem đoạn chat đã lưu" 
                className={styles.iconBtn}
              >
                📂
              </button>
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

      {/* SAVED CHATS PANEL */}
      {showSavedChats && open && (
        <div className={styles.savedChatsPanel}>
          <div className={styles.panelHeader}>
            <h4>📂 Đoạn chat đã lưu</h4>
            <button 
              onClick={() => setShowSavedChats(false)} 
              className={styles.panelClose}
            >
              ✕
            </button>
          </div>
          
          {savedChats.length === 0 ? (
            <div className={styles.emptyState}>Chưa có đoạn chat nào được lưu</div>
          ) : (
            <div className={styles.chatsList}>
              {savedChats.map(chat => (
                <div key={chat.id} className={styles.chatItem}>
                  <div className={styles.chatInfo}>
                    <div className={styles.chatTitle}>{chat.title}</div>
                    <div className={styles.chatMeta}>
                      💬 {chat.messages.length} tin nhắn • {chat.savedAt}
                    </div>
                    <div className={styles.chatExpiry}>
                      ⏰ {getTimeRemaining(chat.expiry)}
                    </div>
                  </div>
                  <div className={styles.chatActions}>
                    <button 
                      onClick={() => handleLoadChat(chat.id)}
                      className={styles.loadBtn}
                      title="Tải"
                    >
                      📥
                    </button>
                    <button 
                      onClick={() => handleDeleteChat(chat.id)}
                      className={styles.deleteBtn}
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SAVE CHAT FORM */}
      {showSaveForm && open && (
        <div className={styles.saveFormModal}>
          <div className={styles.saveFormContent}>
            <h5>💾 Lưu đoạn chat</h5>
            <input
              type="text"
              placeholder="Nhập tên cho đoạn chat (tùy chọn)..."
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              maxLength={50}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmSave();
                if (e.key === 'Escape') setShowSaveForm(false);
              }}
              className={styles.saveInput}
              autoFocus
            />
            <div className={styles.saveFormActions}>
              <button 
                onClick={handleConfirmSave}
                className={styles.saveBtn}
              >
                ✅ Lưu
              </button>
              <button 
                onClick={() => setShowSaveForm(false)}
                className={styles.cancelBtn}
              >
                ❌ Hủy
              </button>
            </div>
            <div className={styles.saveInfo}>
              ⏱️ Sẽ được lưu trong 24h
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION */}
      {saveNotification && (
        <div className={`${styles.notification} ${styles[`notification-${saveNotification.type}`]}`}>
          {saveNotification.message}
        </div>
      )}
    </div>
  );
}