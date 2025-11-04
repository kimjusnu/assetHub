/**
 * 메인 페이지 컴포넌트
 *
 * 이 컴포넌트는 앱의 진입점입니다.
 * - 로그인하지 않은 사용자: 로그인 화면 표시
 * - 로그인한 사용자: 자산 관리 대시보드 표시
 */

"use client";

import { useAuth } from "@/lib/auth-context";
import LoginForm from "@/components/LoginForm";

export default function Home() {
  // useAuth 훅을 사용하여 현재 로그인 상태와 로그아웃 함수를 가져옵니다
  const { user, loading, logout } = useAuth();

  /**
   * 로딩 중일 때 표시할 UI
   *
   * 앱이 처음 시작될 때 Firebase에서 인증 상태를 확인하는 동안
   * 로딩 화면을 표시합니다.
   */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-400 border-t-transparent mb-3"></div>
          <p className="text-sm text-slate-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  /**
   * 로그인하지 않은 사용자용 UI
   *
   * user가 null이면 로그인하지 않은 상태이므로
   * 로그인 폼을 표시합니다.
   */
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <LoginForm />
      </div>
    );
  }

  /**
   * 로그인한 사용자용 UI (대시보드)
   *
   * user가 있으면 로그인한 상태이므로
   * 자산 관리 대시보드를 표시합니다.
   */
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <header className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-800">
                자산 포트폴리오
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                개인 자산을 효율적으로 관리하세요
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 rounded text-sm">
                <span className="text-slate-700">{user.email}</span>
              </div>
              <button
                onClick={logout}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ml-auto sm:ml-0 cursor-pointer shadow-sm hover:shadow-md active:bg-red-800"
              >
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                로그아웃
              </button>
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 shadow-sm">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-1 text-slate-800">
              자산 관리 대시보드
            </h2>
            <p className="text-sm text-slate-600">
              모든 자산을 한눈에 확인하고 관리하세요
            </p>
          </div>

          {/* 자산 카드들 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* 현금 자산 카드 */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-all duration-200 cursor-default hover:shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-slate-600 rounded flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-medium text-sm text-slate-700">
                  현금 자산
                </h3>
              </div>
              <p className="text-xl font-semibold text-slate-900">0원</p>
            </div>

            {/* 투자 자산 카드 */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-all duration-200 cursor-default hover:shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <h3 className="font-medium text-sm text-slate-700">
                  투자 자산
                </h3>
              </div>
              <p className="text-xl font-semibold text-slate-900">0원</p>
            </div>

            {/* 총 자산 카드 */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-all duration-200 cursor-default hover:shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="font-medium text-sm text-slate-700">총 자산</h3>
              </div>
              <p className="text-xl font-semibold text-slate-900">0원</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
