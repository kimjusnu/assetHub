/**
 * 로그인/회원가입 폼 컴포넌트
 *
 * 이 컴포넌트는 사용자 로그인과 회원가입을 처리하는 UI를 제공합니다.
 * 기능:
 * - 이메일/비밀번호 로그인
 * - 이메일/비밀번호 회원가입
 * - Google 로그인
 * - 로그인/회원가입 모드 전환
 */

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function LoginForm() {
  // 로그인 모드인지 회원가입 모드인지 관리하는 state
  const [isSignUp, setIsSignUp] = useState(false);

  // 입력 필드의 값들을 관리하는 state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState(""); // 비밀번호 확인 필드

  // 에러 메시지를 저장하는 state
  const [error, setError] = useState("");

  // 로딩 상태를 관리하는 state
  const [isLoading, setIsLoading] = useState(false);

  // 비밀번호 보기/숨기기 상태
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // 유효성 검사 상태
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    passwordConfirm: false,
  });

  // useAuth 훅을 사용하여 인증 관련 함수들을 가져옵니다
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  /**
   * 이메일 유효성 검사
   */
  const validateEmail = (emailValue: string) => {
    if (!emailValue) {
      return "이메일을 입력해주세요";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      return "올바른 이메일 형식이 아닙니다";
    }
    return "";
  };

  /**
   * 비밀번호 유효성 검사
   */
  const validatePassword = (passwordValue: string) => {
    if (!passwordValue) {
      return "비밀번호를 입력해주세요";
    }
    if (passwordValue.length < 6) {
      return "비밀번호는 최소 6자 이상이어야 합니다";
    }
    return "";
  };

  /**
   * 비밀번호 확인 유효성 검사
   */
  const validatePasswordConfirm = (passwordConfirmValue: string) => {
    if (!passwordConfirmValue) {
      return "비밀번호 확인을 입력해주세요";
    }
    if (passwordConfirmValue !== password) {
      return "비밀번호가 일치하지 않습니다";
    }
    return "";
  };

  /**
   * 에러 메시지 변환 (Firebase 에러를 더 친화적으로)
   */
  const getErrorMessage = (errorCode: string) => {
    const errorMessages: { [key: string]: string } = {
      "auth/user-not-found": "등록된 이메일이 없습니다",
      "auth/wrong-password": "비밀번호가 올바르지 않습니다",
      "auth/email-already-in-use": "이미 사용 중인 이메일입니다",
      "auth/weak-password": "비밀번호가 너무 약합니다. 6자 이상 입력해주세요",
      "auth/invalid-email": "올바른 이메일 형식이 아닙니다",
      "auth/too-many-requests":
        "너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요",
      "auth/network-request-failed": "네트워크 연결을 확인해주세요",
      "auth/popup-closed-by-user": "로그인 팝업이 닫혔습니다",
    };
    return errorMessages[errorCode] || "오류가 발생했습니다. 다시 시도해주세요";
  };

  /**
   * 폼 제출 핸들러
   *
   * 이메일/비밀번호 로그인 또는 회원가입을 처리합니다.
   * isSignUp 상태에 따라 로그인 또는 회원가입을 수행합니다.
   *
   * @param e - 폼 제출 이벤트
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 기본 폼 제출 동작 방지 (페이지 새로고침 방지)
    setError(""); // 이전 에러 메시지 초기화
    setTouched({
      email: true,
      password: true,
      passwordConfirm: isSignUp ? true : false,
    }); // 모든 필드를 touched로 표시

    // 유효성 검사
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const passwordConfirmErr = isSignUp
      ? validatePasswordConfirm(passwordConfirm)
      : "";

    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setPasswordConfirmError(passwordConfirmErr);

    // 유효성 검사 실패 시 제출 중단
    if (emailErr || passwordErr || passwordConfirmErr) {
      return;
    }

    setIsLoading(true); // 로딩 시작

    try {
      if (isSignUp) {
        // 회원가입 모드인 경우
        await signUpWithEmail(email, password);
        // 성공 시 자동으로 로그인되어 대시보드로 이동합니다.
      } else {
        // 로그인 모드인 경우
        await signInWithEmail(email, password);
        // 성공 시 대시보드로 이동합니다.
      }
    } catch (err: any) {
      // 에러 발생 시 에러 메시지를 표시합니다.
      const errorCode = err.code || "";
      const friendlyMessage = getErrorMessage(errorCode);
      setError(friendlyMessage);
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  /**
   * Google 로그인 핸들러
   *
   * Google 로그인 팝업을 띄워서 사용자가 Google 계정으로 로그인할 수 있게 합니다.
   */
  const handleGoogleSignIn = async () => {
    setError(""); // 이전 에러 메시지 초기화
    setIsLoading(true); // 로딩 시작

    try {
      await signInWithGoogle();
      // 성공 시 자동으로 로그인되어 대시보드로 이동합니다.
    } catch (err: any) {
      // 에러 발생 시 에러 메시지를 표시합니다.
      const errorCode = err.code || "";
      const friendlyMessage = getErrorMessage(errorCode);
      setError(friendlyMessage || "Google 로그인에 실패했습니다.");
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* 제목 */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold mb-1 text-slate-800">
          {isSignUp ? "회원가입" : "로그인"}
        </h2>
        <p className="text-sm text-slate-600">
          {isSignUp
            ? "새로운 계정을 만들어보세요"
            : "AssetHub에 오신 것을 환영합니다"}
        </p>
      </div>

      {/* 이메일/비밀번호 로그인 폼 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 이메일 입력 필드 */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            이메일
          </label>
          <input
            id="email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched.email) {
                setEmailError(validateEmail(e.target.value));
              }
            }}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, email: true }));
              setEmailError(validateEmail(email));
            }}
            required
            disabled={isLoading}
            className={`w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-1 bg-white text-slate-900 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              emailError && touched.email
                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400"
            }`}
          />
          {emailError && touched.email && (
            <p className="mt-1 text-xs text-red-600">{emailError}</p>
          )}
          {!emailError && touched.email && email && (
            <p className="mt-1 text-xs text-slate-500">
              올바른 이메일 형식입니다
            </p>
          )}
        </div>

        {/* 비밀번호 입력 필드 */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            비밀번호
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={isSignUp ? "최소 6자 이상" : "비밀번호를 입력하세요"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (touched.password) {
                  setPasswordError(validatePassword(e.target.value));
                }
                // 비밀번호 변경 시 비밀번호 확인도 다시 검증
                if (touched.passwordConfirm && passwordConfirm) {
                  setPasswordConfirmError(
                    validatePasswordConfirm(passwordConfirm)
                  );
                }
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, password: true }));
                setPasswordError(validatePassword(password));
              }}
              onCopy={(e) => {
                e.preventDefault(); // 복사 방지
              }}
              onPaste={(e) => {
                e.preventDefault(); // 붙여넣기 방지
              }}
              onCut={(e) => {
                e.preventDefault(); // 잘라내기 방지
              }}
              required
              disabled={isLoading}
              className={`w-full px-3 py-2.5 pr-10 border rounded-md focus:outline-none focus:ring-1 bg-white text-slate-900 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                passwordError && touched.password
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              disabled={isLoading}
            >
              {showPassword ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
          {passwordError && touched.password && (
            <p className="mt-1 text-xs text-red-600">{passwordError}</p>
          )}
          {!passwordError && touched.password && password && (
            <p className="mt-1 text-xs text-slate-500">
              {isSignUp
                ? "비밀번호가 유효합니다"
                : "비밀번호가 올바르게 입력되었습니다"}
            </p>
          )}
          {!touched.password && isSignUp && (
            <p className="mt-1 text-xs text-slate-500">
              비밀번호는 최소 6자 이상이어야 합니다
            </p>
          )}
        </div>

        {/* 비밀번호 확인 필드 (회원가입 모드일 때만 표시) */}
        {isSignUp && (
          <div>
            <label
              htmlFor="passwordConfirm"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              비밀번호 확인
            </label>
            <div className="relative">
              <input
                id="passwordConfirm"
                type={showPasswordConfirm ? "text" : "password"}
                placeholder="비밀번호를 다시 입력하세요"
                value={passwordConfirm}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  if (touched.passwordConfirm) {
                    setPasswordConfirmError(
                      validatePasswordConfirm(e.target.value)
                    );
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, passwordConfirm: true }));
                  setPasswordConfirmError(
                    validatePasswordConfirm(passwordConfirm)
                  );
                }}
                onCopy={(e) => {
                  e.preventDefault(); // 복사 방지
                }}
                onPaste={(e) => {
                  e.preventDefault(); // 붙여넣기 방지
                }}
                onCut={(e) => {
                  e.preventDefault(); // 잘라내기 방지
                }}
                required={isSignUp}
                disabled={isLoading}
                className={`w-full px-3 py-2.5 pr-10 border rounded-md focus:outline-none focus:ring-1 bg-white text-slate-900 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  passwordConfirmError && touched.passwordConfirm
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                disabled={isLoading}
              >
                {showPasswordConfirm ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {passwordConfirmError && touched.passwordConfirm && (
              <p className="mt-1 text-xs text-red-600">
                {passwordConfirmError}
              </p>
            )}
            {!passwordConfirmError &&
              touched.passwordConfirm &&
              passwordConfirm && (
                <p className="mt-1 text-xs text-slate-500">
                  비밀번호가 일치합니다
                </p>
              )}
            {!touched.passwordConfirm && (
              <p className="mt-1 text-xs text-slate-500">
                위에서 입력한 비밀번호를 다시 입력해주세요
              </p>
            )}
          </div>
        )}

        {/* 에러 메시지 표시 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-red-600 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-700 flex-1">{error}</p>
            </div>
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white rounded-md font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              처리 중...
            </>
          ) : isSignUp ? (
            "회원가입"
          ) : (
            "로그인"
          )}
        </button>
      </form>

      {/* 구분선 및 Google 로그인 버튼 */}
      <div className="mt-5">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-slate-500">또는</span>
          </div>
        </div>

        {/* Google 로그인 버튼 */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="mt-4 w-full py-2.5 bg-white border border-gray-300 rounded-md font-medium text-slate-700 hover:bg-gray-50 hover:border-slate-400 transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md active:bg-gray-100"
        >
          {/* Google 로고 SVG */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google로 로그인
        </button>
      </div>

      {/* 로그인/회원가입 모드 전환 버튼 */}
      <div className="mt-5 text-center">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError("");
            setEmailError("");
            setPasswordError("");
            setPasswordConfirmError("");
            setPasswordConfirm("");
            setShowPassword(false);
            setShowPasswordConfirm(false);
            setTouched({
              email: false,
              password: false,
              passwordConfirm: false,
            });
          }}
          disabled={isLoading}
          className="text-sm text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer underline decoration-slate-400 hover:decoration-slate-600"
        >
          {isSignUp
            ? "이미 계정이 있으신가요? 로그인"
            : "계정이 없으신가요? 회원가입"}
        </button>
      </div>
    </div>
  );
}
