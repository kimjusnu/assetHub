/**
 * 설정 페이지 컴포넌트
 *
 * 사용자 추가 정보를 입력하고 수정할 수 있는 페이지입니다.
 * - 이름
 * - 성별
 * - 생년월일
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";

export default function SettingsPage() {
  const { user, loading: authLoading, updateUserProfile } = useAuth();
  const router = useRouter();

  // 폼 상태
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 사용자 정보 로드
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setName(userData.name || "");
          setGender(userData.gender || "");
          
          // 생년월일 파싱 (YYYY-MM-DD 형식)
          if (userData.birthDate) {
            const date = new Date(userData.birthDate);
            if (!isNaN(date.getTime())) {
              setBirthDate(date);
            }
          }
        }
      } catch (err) {
        console.error("사용자 정보 로드 실패:", err);
        setError("사용자 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      if (user) {
        loadUserData();
      } else {
        setIsLoading(false);
      }
    }
  }, [user, authLoading]);

  // 로그인하지 않은 경우 리다이렉트
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setIsSaving(true);
      // 입력된 값만 Firebase에 저장
      const profileData: { name?: string; gender?: string; birthDate?: string } = {};
      
      if (name.trim()) {
        profileData.name = name.trim();
      }
      
      if (gender) {
        profileData.gender = gender;
      }
      
      // 생년월일을 YYYY-MM-DD 형식으로 변환
      if (birthDate) {
        const year = birthDate.getFullYear();
        const month = String(birthDate.getMonth() + 1).padStart(2, "0");
        const day = String(birthDate.getDate()).padStart(2, "0");
        profileData.birthDate = `${year}-${month}-${day}`;
      }

      await updateUserProfile(profileData);
      setSuccess("정보가 성공적으로 저장되었습니다.");
    } catch (err: any) {
      console.error("프로필 업데이트 실패:", err);
      setError(err.message || "정보 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 인증 로딩 중인 경우
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-400 border-t-transparent mb-3"></div>
          <p className="text-sm text-slate-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우 리다이렉트
  if (!user) {
    return null; // router.push가 실행되므로 null 반환
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 헤더 */}
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
            <button
              onClick={() => router.push("/")}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-medium transition-all duration-200 flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm hover:shadow-md"
            >
              대시보드로
            </button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto">
          <main className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                설정
              </h2>
              <p className="text-sm text-slate-600">
                사용자 정보를 입력하거나 수정하세요
              </p>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-red-600"
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
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* 성공 메시지 */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-600"
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
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              </div>
            )}

            {/* 설정 폼 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {isLoading && (
                <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent"></div>
                    <p className="text-sm text-slate-600">정보를 불러오는 중...</p>
                  </div>
                </div>
              )}
                {/* 이름 입력 */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    이름
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSaving}
                    className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-1 bg-white text-slate-900 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400"
                  />
                </div>

                {/* 성별 선택 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    성별
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={gender === "male"}
                        onChange={(e) => setGender(e.target.value)}
                        disabled={isSaving}
                        className="w-4 h-4 text-slate-600 focus:ring-slate-500 border-gray-300"
                      />
                      <span className="text-sm text-slate-700">남성</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={gender === "female"}
                        onChange={(e) => setGender(e.target.value)}
                        disabled={isSaving}
                        className="w-4 h-4 text-slate-600 focus:ring-slate-500 border-gray-300"
                      />
                      <span className="text-sm text-slate-700">여성</span>
                    </label>
                  </div>
                </div>

                {/* 생년월일 입력 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    생년월일
                  </label>
                  <DatePicker
                    selected={birthDate}
                    onChange={(date: Date | null) => setBirthDate(date)}
                    dateFormat="yyyy년 MM월 dd일"
                    locale={ko}
                    placeholderText="생년월일을 선택하세요"
                    disabled={isSaving}
                    maxDate={new Date()}
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={100}
                    scrollableYearDropdown
                    className="w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-1 bg-white text-slate-900 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    생년월일을 선택해주세요
                  </p>
                </div>

                {/* 저장 버튼 */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md active:bg-slate-900 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        저장 중...
                      </>
                    ) : (
                      "저장하기"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    disabled={isSaving}
                    className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    취소
                  </button>
                </div>
              </form>
          </main>
        </div>
      </div>
    </div>
  );
}

