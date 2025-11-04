/**
 * 404 Not Found 페이지
 *
 * 존재하지 않는 페이지에 접근했을 때 표시되는 페이지입니다.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 헤더 */}
      <header className="w-full bg-white border-b border-slate-200 py-4 shadow-sm">
        <div className="pl-10">
          <Link href="/">
            <h1
              className="text-xl sm:text-2xl font-semibold text-slate-800 cursor-pointer hover:text-slate-600 transition-colors"
              style={{ fontFamily: "'YesMyungjo', sans-serif" }}
            >
              Asset Hub
            </h1>
          </Link>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="relative">
              {/* 배경 그림자 */}
              <h2 className="text-6xl sm:text-8xl font-bold text-slate-400/50 mb-4 select-none">
                404
              </h2>
            </div>
            <h3 className="text-2xl sm:text-3xl font-semibold text-slate-800 mb-3">
              페이지를 찾을 수 없습니다
            </h3>
            <p className="text-slate-600 mb-8">
              요청하신 페이지가 존재하지 않거나 이동되었습니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-sm font-medium transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md active:bg-slate-900"
            >
              홈으로 돌아가기
            </Link>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer"
            >
              이전 페이지로
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
