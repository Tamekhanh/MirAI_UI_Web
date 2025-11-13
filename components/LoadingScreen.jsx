import { useEffect, useState } from 'react';
import styles from './LoadingScreen.module.css';

// Danh sách ảnh trong public/Avatar2D để preload
const AVATAR2D_IMAGES = [
  '/Avatar2D/LoadingLogo.png',
  '/Avatar2D/FailLoading.png',
  '/Avatar2D/neutral.webp',
];

export default function LoadingScreen({ 
  status, 
  progress, 
  errorMessage, 
  debugMode = false 
}) {
  // Quyết định có hiển thị lỗi hay không
  // Sẽ hiển thị lỗi NẾU status là 'error' VÀ debugMode là 'false'
  const showError = (status === 'error' && !debugMode);

  // State để theo dõi tiến trình preload ảnh
  const [assetsLoaded, setAssetsLoaded] = useState(0);
  const totalAssets = AVATAR2D_IMAGES.length;

  useEffect(() => {
    let mounted = true;
    // Preload images
    const imgs = AVATAR2D_IMAGES.map((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        if (!mounted) return;
        setAssetsLoaded((v) => v + 1);
      };
      img.onerror = () => {
        if (!mounted) return;
        console.warn('Failed to preload', src);
        setAssetsLoaded((v) => v + 1); // still count to avoid blocking
      };
      return img;
    });

    return () => {
      mounted = false;
      // optional: clear image handlers
      imgs.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, []);

  // Combine server progress and asset preload progress so UX feels responsive.
  const assetProgress = totalAssets === 0 ? 100 : Math.round((assetsLoaded / totalAssets) * 100);
  const displayProgress = Math.max(progress || 0, assetProgress);

  return (
    <div className={styles.loadingContainer}>
      {/* 1. Logo của bạn */}
      <img 
        src={showError ? "/Avatar2D/FailLoading.png" : "/Avatar2D/LoadingLogo.png" }
        alt="MirAI Logo" 
        className={styles.logo} 
      />

      {showError ? (
        // 2. Giao diện khi bị lỗi
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>
            {errorMessage || "Can't connect to the MirAI server. Please try again later."}
          </p>
          <button 
            className={styles.retryButton} 
            onClick={() => window.location.reload()} // Tải lại trang
          >
            Thử lại
          </button>
        </div>
      ) : (
        // 3. Giao diện khi đang tải (hoặc ở chế độ debug)
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${displayProgress}%` }}
            ></div>
          </div>
          <p className={styles.loadingText}>
            {/* Hiển thị thông báo khác nhau tùy theo trạng thái */}
            {status === 'loading' && `Loading Mirai... (${displayProgress}%)`}
            {status === 'error' && debugMode && 'Debug Mode: Drop error, continuing...'}
          </p>
          {/* Hiển thị số lượng assets đã preload để debug */}
          <p className={styles.smallText}>
            Preloaded images: {assetsLoaded}/{totalAssets}
          </p>
        </div>
      )}
    </div>
  );
}