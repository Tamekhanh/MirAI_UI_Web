"use client";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import styles from "./ChatBox.module.css";

// MỚI: Định nghĩa URL của server
const SERVER_URL = "http://localhost:8000";

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
      const res = await axios.post(`${SERVER_URL}/api/chat`, {
        message: input,
      });
      
      const reply = res.data.reply;
      const audioFile = res.data.audio_file; // MỚI: Nhận file âm thanh

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

      // 5. MỚI: Phát file âm thanh
      if (audioFile) {
        // Tạo URL đầy đủ để truy cập file âm thanh
        const audioUrl = `${SERVER_URL}${audioFile}`;
        
        // Tạo một đối tượng Audio và phát nó
        const audio = new Audio(audioUrl);
        
        audio.play().catch(error => {
          // Xử lý lỗi nếu trình duyệt chặn phát
          console.warn("Lỗi phát âm thanh:", error);
        });
      }

    } catch (error) {
      console.error("Error when sending message:", error);
      setMessages((prev) => [...prev, { role: "bot", content: "Oops, there was an error. Please try again later." }]);
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
            Start chatting with Mirai AI! Ask me anything.
          </div>
        )}
        
        {/* Render tin nhắn */}
        {messages.map((msg, i) => (
          // MỚI: Áp dụng style cho message và vai trò (user/bot)
          <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
            {/* MỚI: Áp dụng style cho bubble và bubble theo vai trò */}
            <div className={`${styles.bubble} ${msg.role === 'user' ? styles.userBubble : styles.botBubble}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {/* Thẻ div rỗng để tham chiếu cuộn */}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputContainer}>
        <input
          className={styles.input} // MỚI: Thêm style
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập tin nhắn..."
        />
        <button className={styles.button} onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}