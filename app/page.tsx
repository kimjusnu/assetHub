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
import Link from "next/link";

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
   * 서비스 소개와 로그인 폼을 함께 표시합니다.
   */
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* 헤더 - 전체 너비 */}
        <header className="w-full bg-white border-b border-slate-200 py-4 shadow-sm">
          <h1
            className="text-xl sm:text-2xl font-semibold text-slate-800 pl-10"
            style={{ fontFamily: "'YesMyungjo', sans-serif" }}
          >
            Asset Hub
          </h1>
        </header>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* 왼쪽: 서비스 소개 */}
          <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-white lg:bg-slate-50">
            <div className="max-w-md mx-auto lg:mx-0">
              <div className="mb-8">
                <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                  AssetHub
                </h1>
                <p className="text-lg text-slate-600 mb-6">
                  개인 자산을 체계적으로 관리하고
                  <br />
                  투자 성과를 한눈에 확인하세요
                </p>
              </div>

              {/* 주요 기능 */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">
                      실시간 자산 현황
                    </h3>
                    <p className="text-sm text-slate-600">
                      현금, 투자, 총 자산을 한눈에 파악
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      className="w-5 h-5 text-white"
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
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">
                      투자 성과 분석
                    </h3>
                    <p className="text-sm text-slate-600">
                      포트폴리오 성과를 상세히 분석하고 추적
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">
                      안전한 데이터 관리
                    </h3>
                    <p className="text-sm text-slate-600">
                      암호화된 데이터 저장으로 개인정보 보호
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 로그인 폼 */}
          <div className="flex-1 flex items-center justify-center p-4 lg:p-8 lg:bg-white">
            <div className="w-full max-w-md">
              <LoginForm />
            </div>
          </div>
        </div>
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 헤더 - 전체 너비 */}
      <header className="w-full bg-white border-b border-slate-200 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <Link href="/" className="pl-10">
            <h1
              className="text-xl sm:text-2xl font-semibold text-slate-800 cursor-pointer hover:text-slate-600 transition-colors"
              style={{ fontFamily: "'YesMyungjo', sans-serif" }}
            >
              Asset Hub
            </h1>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 pr-4">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 rounded text-sm">
              <span className="text-slate-700">{user.email}</span>
            </div>
            <Link
              href="/settings"
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-medium transition-all duration-200 flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm hover:shadow-md active:bg-slate-800"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              설정
            </Link>
            <button
              onClick={logout}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-all duration-200 flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm hover:shadow-md active:bg-red-800"
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
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
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
                  <h3 className="font-medium text-sm text-slate-700">
                    총 자산
                  </h3>
                </div>
                <p className="text-xl font-semibold text-slate-900">0원</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
