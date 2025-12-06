"use client";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import styles from "./ChatBox.module.css";

// MỚI: Định nghĩa URL của server
const SERVER_URL = "http://localhost:8000";

export default function ChatBox({ onEmotionChange, onAudioPlay, isTalking }) {
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
      const res = await axios.post(`${SERVER_URL}/api/v1/chat`, {
        message: input,
        isTalking: isTalking,
      });
      
      const reply = res.data.reply;
      const audioFile = res.data.audio_file;
      const emotion = res.data.emotion;

      // 1. Cập nhật cảm xúc cho Avatar
      onEmotionChange(emotion);
      
      // 2. Cập nhật tin nhắn của bot (đã được làm sạch ở backend)
      setMessages((prev) => [...prev, { role: "bot", content: reply }]);

      // 3. Phát file âm thanh nếu có và isTalking là true
      if (audioFile && isTalking) {
        const audioUrl = `${SERVER_URL}${audioFile}`;
        // Construct lip sync URL (assuming .json extension)
        const lipSyncUrl = audioUrl.replace(".mp3", ".json");
        
        if (onAudioPlay) {
            onAudioPlay(audioUrl, lipSyncUrl);
        }
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
          placeholder="Ask Mirai AI..."
        />
        <button className={styles.button} onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}