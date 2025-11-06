"use client";
import { useState, useEffect } from "react";
import axios from "axios"; // Cần import axios ở đây
import Avatar3D from "../components/Avatar3D";
import ChatBox from "../components/ChatBox";
import styles from "./Page.module.css";
import Avatar2D from "../components/Avatar2D";
import LoadingScreen from "../components/LoadingScreen"; // <-- 1. Import component mới

import MiraiChat from "../components/MiraiChat";

// !!! CHỈNH SỬA Ở ĐÂY !!!
// Đặt là 'true' để bỏ qua kiểm tra server và vào thẳng app (để debug UI)
// Đặt là 'false' để chạy logic kiểm tra server thật
const DEBUG_MODE = false; 

export default function Page() {
  const [emotion, setEmotion] = useState("neutral");

  // --- 2. State cho việc tải trang ---
  const [serverStatus, setServerStatus] = useState(DEBUG_MODE ? 'ready' : 'loading'); // 'loading', 'ready', 'error'
  const [loadProgress, setLoadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // --- 3. Logic kiểm tra server khi component mount ---
  useEffect(() => {
    // Nếu ở chế độ debug, không làm gì cả, vào thẳng app
    if (DEBUG_MODE) {
      setServerStatus('ready'); // Đặt là 'ready' ngay lập tức
      return; // Dừng useEffect
    }

    // Nếu không debug, bắt đầu quá trình tải
    setServerStatus('loading');

    // Giả lập tiến trình tải (ví dụ: tải assets, models...)
    const progressInterval = setInterval(() => {
      setLoadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval); // Dừng ở 95% để chờ server
          return 95;
        }
        return prev + 5; // Tăng 5% mỗi 100ms
      });
    }, 100);

    // Kiểm tra kết nối server
    const checkServer = async () => {
      try {
        // Thử "ping" server. Giả sử server có 1 endpoint /api/health
        // Bạn cũng có thể dùng chính endpoint chat: "http://localhost:8000/api/chat"
        await axios.get("http://localhost:8000/api/health", { timeout: 3000 }); // Đặt timeout 3 giây
        
        // Server OK
        clearInterval(progressInterval); // Dừng giả lập
        setLoadProgress(100); // Hoàn thành
        
        // Đợi 1 chút để user thấy 100% rồi mới vào app
        setTimeout(() => setServerStatus('ready'), 300); 

      } catch (error) {
        // Server Lỗi
        clearInterval(progressInterval); // Dừng giả lập
        console.error("Server connection failed:", error);
        setErrorMessage("Can't connect to the MirAI server. Please try again later.");
        setServerStatus('error');
      }
    };

    // Chạy kiểm tra server sau 1 giây (cho thanh tiến trình có thời gian chạy)
    const serverCheckTimeout = setTimeout(checkServer, 1000);

    // Cleanup function: Dọn dẹp khi component unmount
    return () => {
      clearInterval(progressInterval);
      clearTimeout(serverCheckTimeout);
    };

  }, []); // Mảng rỗng đảm bảo useEffect chỉ chạy 1 lần khi mount

  // --- 4. Render có điều kiện ---

  // Nếu CHƯA sẵn sàng (hoặc lỗi), hiển thị LoadingScreen
  if (serverStatus !== 'ready') {
    return (
      <LoadingScreen 
        status={serverStatus}
        progress={loadProgress}
        errorMessage={errorMessage}
        debugMode={DEBUG_MODE} // Prop này cho phép bỏ qua lỗi
      />
    );
  }

  // Nếu ĐÃ sẵn sàng, hiển thị app chính của bạn
  return (
    <MiraiChat setEmotion={setEmotion} />
  );
}