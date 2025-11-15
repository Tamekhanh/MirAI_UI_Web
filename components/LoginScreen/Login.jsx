import style from "./Login.module.css";

export default function Login({ onLogin, onGuestLogin }) {
    return (
        <div className={style.ScreenContainer}>
            <div className={style.loginBox}>
                <h1 className={style.title}>MirAI</h1>
                <p className={style.subtitle}>Personal AI</p>

                <form className={style.form}>
                    <input type="text" placeholder="Enter your Username" className={style.input} />
                    <input type="password" placeholder="Enter your Password" className={style.input} />
                    <button type="submit" className={style.loginButton}>Login</button>
                </form>

                <div className={style.divider}>
                    <span>or</span>
                </div>

                {/* Guest Login */}
                
                <button
                    className={style.guestButton}
                    onClick={() => { onGuestLogin(); onLogin(); }}
                >
                    Login as Guest
                </button>

                <div className={style.socialLogin}>
                    {/* Add social login buttons here if needed */}
                    {/* e.g., Google, GitHub */}
                </div>
            </div>
        </div>
    );
}
