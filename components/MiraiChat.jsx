//MiraiChat.jsx
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ChatBox from "../components/ChatBox";
import styles from "./MiraiChat.module.css";
import Avatar2D from "./Avatar/Avatar2D";

export default function MiraiChat({ setEmotion }) {
  const [isTalking, setIsTalking] = useState(false);
  return (
    <main className={styles.mainContainer}>
      <div className={styles.avatarContainer}>
        <Avatar2D />
      </div>
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <h2>MirAI Chat</h2>
          {/* Button với icon mic */}
          <div
            className={styles.micButton}
            onClick={() => setIsTalking(!isTalking)}
          >
            {isTalking ? (
              <i className="material-icons" style={{ cursor: 'pointer', userSelect: 'none' }}>volume_up</i>
            ) : (
              <i className="material-icons" style={{ cursor: 'pointer', userSelect: 'none' }}>volume_mute</i>
            )}
          </div>
        </div>
        <ChatBox onEmotionChange={setEmotion} isTalking={isTalking} />
      </div>
    </main>
  );
}