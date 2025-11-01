// page.tsx
"use client";
import { useState } from "react";
import Avatar3D from "../components/Avatar3D";
import ChatBox from "../components/ChatBox";
import styles from "./Page.module.css"; // Sử dụng CSS Modules

export default function Page() {
  const [emotion, setEmotion] = useState("neutral");

  return (
    <main className={styles.mainContainer}>
      <div className={styles.avatarContainer}>
        <Avatar3D emotion={emotion} />
      </div>
      <div className={styles.chatContainer}>
        <ChatBox onEmotionChange={setEmotion} />
      </div>
    </main>
  );
}