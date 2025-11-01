// ChatBox.jsx
"use client";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import styles from "./ChatBox.module.css"; // Sử dụng CSS Modules

export default function ChatBox({ onEmotionChange }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  
  // Ref để tự động cuộn
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Tự động cuộn khi có tin nhắn mới
  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput(""); // Xóa input ngay lập tức để UX tốt hơn

    try {
      const res = await axios.post("http://localhost:8000/api/chat", {
        message: input,
      });
      const reply = res.data.reply;
      
      // 1. Phân tích cảm xúc
      const emotion =
        reply.includes("[smile]") ? "smile" :
        reply.includes("[angry]") ? "angry" :
        reply.includes("[curious]") ? "curious" : "neutral";
      
      // 2. Cập nhật cảm xúc cho Avatar
      onEmotionChange(emotion);

      // 3. Làm sạch tin nhắn (loại bỏ tag)
      const cleanReply = reply.replace(/\[.*?\]/g, "").trim();
      
      // 4. Cập nhật tin nhắn của bot
      setMessages((prev) => [...prev, { role: "bot", content: cleanReply }]);

    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      setMessages((prev) => [...prev, { role: "bot", content: "Oops, có lỗi xảy ra. Bạn thử lại nhé." }]);
    }
  };

  // Xử lý gửi bằng phím Enter
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Ngăn xuống dòng
      sendMessage();
    }
  };

  return (
    <div className={styles.chatbox}>
      <div className={styles.messages}>
        {/* Tin nhắn chào mừng mặc định */}
        {messages.length === 0 && (
          <div className={styles.welcomeMessage}>
            Bắt đầu cuộc trò chuyện với Mirai!
          </div>
        )}
        
        {/* Render tin nhắn */}
        {messages.map((msg, i) => (
          <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
            <div className={styles.bubble}>
              {msg.content}
            </div>
          </div>
        ))}
        {/* Thẻ div rỗng để tham chiếu cuộn */}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputContainer}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập tin nhắn..."
        />
        <button onClick={sendMessage}>Gửi</button>
      </div>
    </div>
  );
}