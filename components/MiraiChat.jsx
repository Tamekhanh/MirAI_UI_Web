//MiraiChat.jsx
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ChatBox from "../components/ChatBox";
import styles from "../app/Page.module.css";
import Avatar2D from "../components/Avatar2D";

export default function MiraiChat({ setEmotion }) {
    return (
        <main className={styles.mainContainer}>
      <div className={styles.avatarContainer}>
        <Avatar2D/>
      </div>
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>MirAI Chat</div>
        <ChatBox onEmotionChange={setEmotion} />
      </div>
    </main>
    );
}