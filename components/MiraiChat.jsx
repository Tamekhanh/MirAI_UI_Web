//MiraiChat.jsx
import { useState, useRef, useEffect } from "react";
import ChatBox from "../components/ChatBox";
import styles from "./MiraiChat.module.css";
import LoginPage from "./LoginScreen/Login";
import Avatar3D from "./Avatar/Avatar3D";

export default function MiraiChat({ emotion, setEmotion, isDebug }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [audioData, setAudioData] = useState(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleGuestLogin = () => {
    setIsGuest(true);
  };

  const handleAudioPlay = (audioUrl, lipSyncUrl) => {
    setAudioData({ audioUrl, lipSyncUrl });
  };

  return (
    <main className={styles.mainContainer}>
      {isLoggedIn || isDebug ? (
        <div className={styles.MiraiChatContainer}>
          <div className={styles.avatarContainer}>
            <Avatar3D emotion={emotion} audioData={audioData} />
          </div>
          <div className={styles.chatContainer}>
            <div className={styles.chatHeader}>
              <h2>MirAI Chat</h2>
              <div className={styles.Menu}>
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
                <div className={styles.userIcon}>
                  {isGuest ? (
                    <i className="material-icons" style={{ cursor: 'pointer', userSelect: 'none' }}>person</i>
                  ) : (
                    <i className="material-icons" style={{ cursor: 'pointer', userSelect: 'none' }}>person_outline</i>
                  )}
                </div>
              </div>
            </div>
            <ChatBox onEmotionChange={setEmotion} onAudioPlay={handleAudioPlay} isTalking={isTalking} />
          </div>
        </div>
      ) : (
        <LoginPage onLogin={handleLogin} onGuestLogin={handleGuestLogin} />
      )}
    </main>
  );
}