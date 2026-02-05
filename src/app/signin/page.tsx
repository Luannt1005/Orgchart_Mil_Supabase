"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./signin.module.css";
import { supabase } from "@/lib/supabase";

export default function SigninPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleMicrosoftLogin = async () => {
        try {
            setLoading(true);
            setError("");

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'azure',
                options: {
                    redirectTo: `${window.location.origin}/login`,
                    scopes: 'email profile',
                },
            });

            if (error) {
                throw error;
            }

            // Supabase handles the redirect automatically
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.message || "Đã xảy ra lỗi khi kết nối với Microsoft.");
            setLoading(false);
        }
    };

    return (
        <div className={styles['login-container']}>
            <div className={styles['login-card']}>
                {/* Logo */}
                <div className={styles['login-logo']}>
                    <div className={styles['logo-wrapper']}>
                        <Image
                            src="/Milwaukee-logo-red.png"
                            width={200}
                            height={90}
                            alt="Milwaukee Tool"
                            style={{ objectFit: 'contain' }}
                            priority
                            unoptimized
                        />
                    </div>
                </div>

                {/* Header */}
                <div className={styles['login-header']}>
                    <h1>Test Microsoft Login</h1>
                    <p>Testing Supabase Auth with Azure AD</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className={`${styles.alert} ${styles['alert-error']}`}>
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Microsoft Button */}
                <button
                    onClick={handleMicrosoftLogin}
                    disabled={loading}
                    className={styles['microsoft-button']}
                >
                    {loading ? (
                        <>
                            <span className={styles['button-spinner']}></span>
                            <span>Đang chuyển hướng...</span>
                        </>
                    ) : (
                        <>
                            {/* Microsoft Icon */}
                            <svg className={styles['microsoft-icon']} viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                                <path fill="#f35325" d="M1 1h10v10H1z" />
                                <path fill="#81bc06" d="M12 1h10v10H12z" />
                                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                                <path fill="#ffba08" d="M12 12h10v10H12z" />
                            </svg>
                            <span>Đăng nhập với Microsoft</span>
                        </>
                    )}
                </button>

                <div className={styles['divider-text']}>
                    <span>hoặc</span>
                </div>

                <Link href="/login" className={styles['back-link']}>
                    Quay lại trang Login chính
                </Link>
            </div>
            {/* Background Elements */}
            <div className={`${styles['bg-decoration']} ${styles['bg-1']}`}></div>
            <div className={`${styles['bg-decoration']} ${styles['bg-2']}`}></div>
        </div>
    );
}
