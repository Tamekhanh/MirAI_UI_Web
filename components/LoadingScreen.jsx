import styles from './LoadingScreen.module.css';

export default function LoadingScreen({ 
  status, 
  progress, 
  errorMessage, 
  debugMode = false 
}) {
  
  // Quyết định có hiển thị lỗi hay không
  // Sẽ hiển thị lỗi NẾU status là 'error' VÀ debugMode là 'false'
  const showError = (status === 'error' && !debugMode);

  return (
    <div className={styles.loadingContainer}>
      {/* 1. Logo của bạn */}
      <img 
        src={showError ? "/Avatar2D/FailLoading.png":"/Avatar2D/LoadingLogo.png" } // !!! THAY THẾ bằng đường dẫn đến logo của bạn
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
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className={styles.loadingText}>
            {/* Hiển thị thông báo khác nhau tùy theo trạng thái */}
            {status === 'loading' && 'Loading Mirai...'}
            {status === 'error' && debugMode && 'Debug Mode: Drop error, continuing...'}
          </p>
        </div>
      )}
    </div>
  );
}