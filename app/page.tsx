/**
 * 메인 페이지 컴포넌트
 *
 * 이 컴포넌트는 앱의 진입점입니다.
 * - 로그인하지 않은 사용자: 로그인 화면 표시
 * - 로그인한 사용자: 자산 관리 대시보드 표시
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import LoginForm from "@/components/LoginForm";
import Link from "next/link";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";
import { MoreVertical, FileText, Trash2 } from "lucide-react";

export default function Home() {
  // useAuth 훅을 사용하여 현재 로그인 상태와 로그아웃 함수를 가져옵니다
  const { user, loading, logout } = useAuth();

  // 자산 데이터 상태 (배열 형태로 변경)
  interface AssetProduct {
    id: string;
    name: string;
    maturityDate?: string;
    amount: number;
    memo?: string; // 메모 (선택)
  }

  // 대분류 타입
  type AssetCategory =
    | "depositSavings"
    | "trustISA"
    | "insurance"
    | "pension"
    | "investment";

  // 대분류 한글 이름 매핑
  const categoryLabels: Record<AssetCategory, string> = {
    depositSavings: "예금/적금",
    trustISA: "신탁/ISA",
    insurance: "보험/공제",
    pension: "퇴직연금",
    investment: "투자",
  };

  const [assets, setAssets] = useState<{
    depositSavings: AssetProduct[];
    trustISA: AssetProduct[];
    insurance: AssetProduct[];
    pension: AssetProduct[];
    investment: AssetProduct[];
  }>({
    depositSavings: [],
    trustISA: [],
    insurance: [],
    pension: [],
    investment: [],
  });
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 메뉴 열림 상태
  const [openMenu, setOpenMenu] = useState<{
    category: AssetCategory | null;
    productId: string | null;
  }>({
    category: null,
    productId: null,
  });

  // 메모 입력 상태
  const [editingMemo, setEditingMemo] = useState<{
    category: AssetCategory | null;
    productId: string | null;
  }>({
    category: null,
    productId: null,
  });

  // 월별 자산 추이 상태
  // 예: { "수협 예금": { "2025-08": 11700000, "2025-09": 11700000, ... } }
  const [monthlyTrends, setMonthlyTrends] = useState<
    Record<string, Record<string, number>>
  >({});

  // 월별 가용 계획 상태
  // 구조: { income: 수입, savings: [{ name: string, amount: number }], cash: [{ name: string, amount: number }] }
  interface MonthlyPlanItem {
    id: string;
    name: string;
    amount: number;
  }

  const [monthlyPlans, setMonthlyPlans] = useState<{
    income: number;
    savings: MonthlyPlanItem[];
    cash: MonthlyPlanItem[];
  }>({
    income: 0,
    savings: [],
    cash: [],
  });

  // 연도별 자산 추이 상태
  // 예: { "2025": { "01": 23500000, "02": 23800000, ... } }
  const [annualTrends, setAnnualTrends] = useState<
    Record<string, Record<string, number>>
  >({});

  // 선택된 연도 상태
  const [selectedYear, setSelectedYear] = useState<string>(
    String(new Date().getFullYear())
  );

  // 자산 데이터 로드
  useEffect(() => {
    const loadAssets = async () => {
      if (!user) return;

      try {
        setAssetsLoading(true);
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();

          // 자산 데이터 로드
          if (userData.assets) {
            const depositSavings = Array.isArray(userData.assets.depositSavings)
              ? userData.assets.depositSavings
              : [];
            const trustISA = Array.isArray(userData.assets.trustISA)
              ? userData.assets.trustISA
              : [];
            const insurance = Array.isArray(userData.assets.insurance)
              ? userData.assets.insurance
              : [];
            const pension = Array.isArray(userData.assets.pension)
              ? userData.assets.pension
              : [];
            const investment = Array.isArray(userData.assets.investment)
              ? userData.assets.investment
              : [];

            setAssets({
              depositSavings,
              trustISA,
              insurance,
              pension,
              investment,
            });
          }

          // 월별 자산 추이 로드
          if (userData.monthlyTrends) {
            setMonthlyTrends(userData.monthlyTrends || {});
          }

          // 월별 가용 계획 로드
          if (userData.monthlyPlans) {
            // 구버전 호환: Record<string, number> 형태도 처리
            if (userData.monthlyPlans.income !== undefined) {
              setMonthlyPlans({
                income: userData.monthlyPlans.income || 0,
                savings: userData.monthlyPlans.savings || [],
                cash: userData.monthlyPlans.cash || [],
              });
            } else {
              // 구버전 데이터 변환
              const oldPlans = userData.monthlyPlans as Record<string, number>;
              const savings: MonthlyPlanItem[] = [];
              const cash: MonthlyPlanItem[] = [];

              Object.entries(oldPlans).forEach(([key, amount]) => {
                if (
                  [
                    "청년도약",
                    "주택청약",
                    "IRP",
                    "ISA",
                    "토스굴비적금",
                  ].includes(key)
                ) {
                  savings.push({
                    id:
                      Date.now().toString() +
                      Math.random().toString(36).substr(2, 9),
                    name: key,
                    amount,
                  });
                } else if (["교통비", "비상금(CMA)", "가용금"].includes(key)) {
                  cash.push({
                    id:
                      Date.now().toString() +
                      Math.random().toString(36).substr(2, 9),
                    name: key,
                    amount,
                  });
                }
              });

              setMonthlyPlans({
                income: 0,
                savings,
                cash,
              });
            }
          }

          // 연도별 자산 추이 로드
          if (userData.annualTrends) {
            setAnnualTrends(userData.annualTrends || {});
          }
        }
      } catch (err) {
        console.error("자산 정보 로드 실패:", err);
      } finally {
        setAssetsLoading(false);
      }
    };

    if (user) {
      loadAssets();
    }
  }, [user]);

  // 숫자 포맷팅 함수
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 상품 배열의 총합 계산 함수
  const calculateTotal = (products: AssetProduct[]): number => {
    return products.reduce((sum, product) => sum + (product.amount || 0), 0);
  };

  // 상품 추가
  const addProduct = (category: AssetCategory) => {
    const newProduct: AssetProduct = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: "",
      amount: 0,
      memo: "",
    };

    setAssets({
      ...assets,
      [category]: [...assets[category], newProduct],
    });
  };

  // 상품 수정
  const updateProduct = (
    category: AssetCategory,
    productId: string,
    updates: Partial<AssetProduct>
  ) => {
    setAssets({
      ...assets,
      [category]: assets[category].map((product) =>
        product.id === productId ? { ...product, ...updates } : product
      ),
    });
  };

  // 메뉴 토글
  const toggleMenu = (category: AssetCategory, productId: string) => {
    if (openMenu.category === category && openMenu.productId === productId) {
      setOpenMenu({ category: null, productId: null });
    } else {
      setOpenMenu({ category, productId });
    }
  };

  // 메뉴 닫기
  const closeMenu = () => {
    setOpenMenu({ category: null, productId: null });
  };

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".menu-container")) {
        closeMenu();
      }
    };

    if (openMenu.category) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [openMenu]);

  // 삭제 버튼 클릭 시 바로 삭제 및 DB 저장
  const handleDelete = async (category: AssetCategory, productId: string) => {
    // 상태에서 먼저 제거 (즉시 UI 반영)
    const updatedAssets = {
      ...assets,
      [category]: assets[category].filter(
        (product) => product.id !== productId
      ),
    };
    setAssets(updatedAssets);
    closeMenu();

    // DB에 즉시 저장
    try {
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const existingData = userDoc.exists() ? userDoc.data() : {};

      await setDoc(
        userDocRef,
        {
          ...existingData,
          assets: {
            depositSavings: updatedAssets.depositSavings,
            trustISA: updatedAssets.trustISA,
            insurance: updatedAssets.insurance,
            pension: updatedAssets.pension,
            investment: updatedAssets.investment,
          },
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err: any) {
      console.error("삭제 저장 실패:", err);
      setError("삭제 저장에 실패했습니다.");
      // 실패 시 원래 상태로 복구
      setAssets(assets);
    }
  };

  // 메모 입력 시작
  const startMemoEdit = (category: AssetCategory, productId: string) => {
    setEditingMemo({ category, productId });
    closeMenu();
  };

  // 메모 입력 취소
  const cancelMemoEdit = () => {
    setEditingMemo({ category: null, productId: null });
  };

  // 메모 저장
  const saveMemo = (
    category: AssetCategory,
    productId: string,
    memo: string
  ) => {
    updateProduct(category, productId, { memo });
    setEditingMemo({ category: null, productId: null });
  };

  // 메모 삭제
  const deleteMemo = (category: AssetCategory, productId: string) => {
    updateProduct(category, productId, { memo: "" });
    setEditingMemo({ category: null, productId: null });
  };

  // 자산 저장 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // 유효성 검사: 상품 이름이 비어있는지 확인
    const allProducts = [
      ...assets.depositSavings,
      ...assets.trustISA,
      ...assets.insurance,
      ...assets.pension,
      ...assets.investment,
    ];

    const emptyNameProducts = allProducts.filter(
      (product) => !product.name || product.name.trim() === ""
    );

    if (emptyNameProducts.length > 0) {
      setError("상품 이름을 입력해주세요.");
      return;
    }

    try {
      setIsSaving(true);
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const existingData = userDoc.exists() ? userDoc.data() : {};

      await setDoc(
        userDocRef,
        {
          ...existingData,
          assets: {
            depositSavings: assets.depositSavings,
            trustISA: assets.trustISA,
            insurance: assets.insurance,
            pension: assets.pension,
            investment: assets.investment,
          },
          monthlyTrends,
          monthlyPlans,
          annualTrends,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setSuccess("자산 정보가 성공적으로 저장되었습니다.");

      // 성공 메시지 3초 후 자동 제거
      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      console.error("자산 저장 실패:", err);
      setError(err.message || "자산 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 월별 자산 추이 저장 핸들러
  const handleSaveMonthlyTrends = async () => {
    try {
      setIsSaving(true);
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const existingData = userDoc.exists() ? userDoc.data() : {};

      await setDoc(
        userDocRef,
        {
          ...existingData,
          monthlyTrends,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setSuccess("월별 자산 추이가 저장되었습니다.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("월별 자산 추이 저장 실패:", err);
      setError(err.message || "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 월별 가용 계획 항목 추가
  const addMonthlyPlanItem = (type: "savings" | "cash") => {
    const newItem: MonthlyPlanItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: "",
      amount: 0,
    };

    setMonthlyPlans({
      ...monthlyPlans,
      [type]: [...monthlyPlans[type], newItem],
    });
  };

  // 월별 가용 계획 항목 수정
  const updateMonthlyPlanItem = (
    type: "savings" | "cash",
    id: string,
    updates: Partial<MonthlyPlanItem>
  ) => {
    setMonthlyPlans({
      ...monthlyPlans,
      [type]: monthlyPlans[type].map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    });
  };

  // 월별 가용 계획 항목 삭제
  const deleteMonthlyPlanItem = (type: "savings" | "cash", id: string) => {
    setMonthlyPlans({
      ...monthlyPlans,
      [type]: monthlyPlans[type].filter((item) => item.id !== id),
    });
  };

  // 가용금액 계산 (수입 - 저축 항목 합계)
  const calculateAvailableAmount = (): number => {
    const savingsTotal = monthlyPlans.savings.reduce(
      (sum, item) => sum + (item.amount || 0),
      0
    );
    return Math.max(0, monthlyPlans.income - savingsTotal);
  };

  // 월별 가용 계획 저장 핸들러
  const handleSaveMonthlyPlans = async () => {
    try {
      setIsSaving(true);
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const existingData = userDoc.exists() ? userDoc.data() : {};

      await setDoc(
        userDocRef,
        {
          ...existingData,
          monthlyPlans,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setSuccess("월별 가용 계획이 저장되었습니다.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("월별 가용 계획 저장 실패:", err);
      setError(err.message || "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 연도별 자산 추이 저장 핸들러
  const handleSaveAnnualTrends = async () => {
    try {
      setIsSaving(true);
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const existingData = userDoc.exists() ? userDoc.data() : {};

      await setDoc(
        userDocRef,
        {
          ...existingData,
          annualTrends,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setSuccess("연도별 자산 추이가 저장되었습니다.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("연도별 자산 추이 저장 실패:", err);
      setError(err.message || "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 총 자산 계산
  const depositSavingsTotal = calculateTotal(assets.depositSavings);
  const investmentTotal =
    calculateTotal(assets.trustISA) +
    calculateTotal(assets.insurance) +
    calculateTotal(assets.pension) +
    calculateTotal(assets.investment);
  const totalAssets = depositSavingsTotal + investmentTotal;

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
                <p className="text-xl font-semibold text-slate-900">
                  {assetsLoading ? (
                    <span className="text-slate-400">로딩 중...</span>
                  ) : (
                    `${formatNumber(depositSavingsTotal)}원`
                  )}
                </p>
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
                <p className="text-xl font-semibold text-slate-900">
                  {assetsLoading ? (
                    <span className="text-slate-400">로딩 중...</span>
                  ) : (
                    `${formatNumber(investmentTotal)}원`
                  )}
                </p>
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
                <p className="text-xl font-semibold text-slate-900">
                  {assetsLoading ? (
                    <span className="text-slate-400">로딩 중...</span>
                  ) : (
                    `${formatNumber(totalAssets)}원`
                  )}
                </p>
              </div>
            </div>

            {/* 4개 섹션 레이아웃 */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 왼쪽 위: 자산 입력 폼 */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  자산 현황
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* 각 대분류별 섹션 */}
                  {(Object.keys(categoryLabels) as AssetCategory[]).map(
                    (category) => {
                      const products = assets[category];
                      const categoryTotal = calculateTotal(products);

                      return (
                        <div
                          key={category}
                          className="border-b border-slate-200 pb-4 last:border-b-0"
                        >
                          {/* 대분류 헤더 */}
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-800">
                                {categoryLabels[category]}
                              </h4>
                              <p className="text-xs text-slate-600 mt-0.5">
                                총 {formatNumber(categoryTotal)}원
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => addProduct(category)}
                              disabled={isSaving}
                              className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md flex items-center gap-1"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                              추가
                            </button>
                          </div>

                          {/* 상품 목록 */}
                          <div className="space-y-2">
                            {products.length === 0 ? (
                              <p className="text-xs text-slate-400 text-center py-2">
                                등록된 상품이 없습니다.
                              </p>
                            ) : (
                              products.map((product) => {
                                const maturityDate = product.maturityDate
                                  ? new Date(product.maturityDate)
                                  : null;

                                return (
                                  <div
                                    key={product.id}
                                    className="p-2 bg-slate-50 rounded border border-slate-200 space-y-2"
                                  >
                                    <div className="grid grid-cols-1 gap-2">
                                      {/* 상품 이름 */}
                                      <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-0.5">
                                          상품 이름{" "}
                                          <span className="text-red-500">
                                            *
                                          </span>
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="예: 정기예금"
                                          value={product.name}
                                          onChange={(e) =>
                                            updateProduct(
                                              category,
                                              product.id,
                                              {
                                                name: e.target.value,
                                              }
                                            )
                                          }
                                          disabled={isSaving}
                                          required
                                          className="w-full px-2 py-1.5 border rounded text-xs bg-white text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400 h-8"
                                        />
                                      </div>

                                      <div className="grid grid-cols-2 gap-2">
                                        {/* 만기일 */}
                                        <div>
                                          <label className="block text-xs font-medium text-slate-700 mb-0.5">
                                            만기일
                                          </label>
                                          <DatePicker
                                            selected={maturityDate}
                                            onChange={(date: Date | null) => {
                                              updateProduct(
                                                category,
                                                product.id,
                                                {
                                                  maturityDate: date
                                                    ? `${date.getFullYear()}-${String(
                                                        date.getMonth() + 1
                                                      ).padStart(
                                                        2,
                                                        "0"
                                                      )}-${String(
                                                        date.getDate()
                                                      ).padStart(2, "0")}`
                                                    : undefined,
                                                }
                                              );
                                            }}
                                            dateFormat="yy.MM.dd"
                                            locale={ko}
                                            placeholderText="만기일"
                                            disabled={isSaving}
                                            className="w-full text-xs"
                                          />
                                        </div>

                                        {/* 예치금액 */}
                                        <div>
                                          <label className="block text-xs font-medium text-slate-700 mb-0.5">
                                            금액(원)
                                          </label>
                                          <div className="relative">
                                            <input
                                              type="text"
                                              placeholder="0"
                                              value={
                                                product.amount
                                                  ? formatNumber(product.amount)
                                                  : ""
                                              }
                                              onChange={(e) => {
                                                const numericValue =
                                                  e.target.value.replace(
                                                    /[^0-9]/g,
                                                    ""
                                                  );
                                                const amount = numericValue
                                                  ? Number(numericValue)
                                                  : 0;
                                                updateProduct(
                                                  category,
                                                  product.id,
                                                  {
                                                    amount,
                                                  }
                                                );
                                              }}
                                              disabled={isSaving}
                                              className="w-full px-2 py-1.5 pr-8 border rounded text-xs bg-white text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400 h-8"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
                                              원
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* 더보기 버튼 */}
                                      <div className="flex justify-end">
                                        <div className="menu-container">
                                          {openMenu.category === category &&
                                          openMenu.productId === product.id ? (
                                            <div className="flex gap-1 bg-white border border-slate-200 rounded shadow-lg p-1">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  startMemoEdit(
                                                    category,
                                                    product.id
                                                  )
                                                }
                                                disabled={isSaving}
                                                className="px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 rounded flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                              >
                                                <FileText className="w-3 h-3" />
                                                메모
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleDelete(
                                                    category,
                                                    product.id
                                                  )
                                                }
                                                disabled={isSaving}
                                                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                                삭제
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                toggleMenu(category, product.id)
                                              }
                                              disabled={isSaving}
                                              className="px-1.5 py-1 text-slate-600 hover:bg-slate-100 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                            >
                                              <MoreVertical className="w-4 h-4" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* 메모 입력/표시 영역 (간소화) */}
                                    {editingMemo.category === category &&
                                      editingMemo.productId === product.id && (
                                        <div className="mt-2 p-2 bg-white border border-slate-200 rounded">
                                          <textarea
                                            placeholder="메모를 입력하세요"
                                            value={product.memo || ""}
                                            onChange={(e) =>
                                              updateProduct(
                                                category,
                                                product.id,
                                                {
                                                  memo: e.target.value,
                                                }
                                              )
                                            }
                                            disabled={isSaving}
                                            rows={2}
                                            className="w-full px-2 py-1 border rounded text-xs bg-white text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400 resize-none"
                                          />
                                          <div className="flex gap-1 mt-1">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                saveMemo(
                                                  category,
                                                  product.id,
                                                  product.memo || ""
                                                )
                                              }
                                              disabled={isSaving}
                                              className="px-2 py-0.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                            >
                                              저장
                                            </button>
                                            <button
                                              type="button"
                                              onClick={cancelMemoEdit}
                                              disabled={isSaving}
                                              className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                            >
                                              취소
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                    {!editingMemo.category &&
                                      !editingMemo.productId &&
                                      product.memo &&
                                      product.memo.trim() !== "" && (
                                        <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded">
                                          <p className="text-xs text-slate-700">
                                            {product.memo}
                                          </p>
                                          <div className="flex gap-1 mt-1">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                startMemoEdit(
                                                  category,
                                                  product.id
                                                )
                                              }
                                              disabled={isSaving}
                                              className="px-1.5 py-0.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              수정
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                deleteMemo(category, product.id)
                                              }
                                              disabled={isSaving}
                                              className="px-1.5 py-0.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              삭제
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}

                  {/* 저장 버튼 */}
                  <div className="pt-2 border-t border-slate-200">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md active:bg-slate-900 flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                          저장 중...
                        </>
                      ) : (
                        "저장하기"
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* 오른쪽 위: 월별 자산 추이 */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    월별 자산 추이
                  </h3>
                  <button
                    type="button"
                    onClick={handleSaveMonthlyTrends}
                    disabled={isSaving}
                    className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md"
                  >
                    저장
                  </button>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  각 자산별 월별 금액을 입력하세요
                </p>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {/* 모든 자산 상품 목록 가져오기 */}
                  {(() => {
                    const allProducts: Array<{ name: string }> = [];
                    (Object.keys(categoryLabels) as AssetCategory[]).forEach(
                      (category) => {
                        assets[category].forEach((product) => {
                          if (product.name && product.name.trim() !== "") {
                            allProducts.push({ name: product.name });
                          }
                        });
                      }
                    );

                    if (allProducts.length === 0) {
                      return (
                        <p className="text-xs text-slate-400 text-center py-4">
                          자산 현황에서 상품을 먼저 등록해주세요.
                        </p>
                      );
                    }

                    // 현재 연도와 월 목록 생성 (최근 6개월)
                    const months: string[] = [];
                    const now = new Date();
                    for (let i = 5; i >= 0; i--) {
                      const date = new Date(
                        now.getFullYear(),
                        now.getMonth() - i,
                        1
                      );
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      months.push(`${year}-${month}`);
                    }

                    return (
                      <div className="space-y-3">
                        {allProducts.map((product) => {
                          const assetName = product.name;
                          const trends = monthlyTrends[assetName] || {};

                          return (
                            <div
                              key={assetName}
                              className="p-2 bg-slate-50 rounded border border-slate-200"
                            >
                              <div className="text-xs font-medium text-slate-700 mb-2">
                                {assetName}
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                {months.map((month) => {
                                  const monthKey = month;
                                  const value = trends[monthKey] || 0;

                                  return (
                                    <div key={monthKey} className="space-y-0.5">
                                      <label className="text-xs text-slate-600">
                                        {month.replace("-", ".")}
                                      </label>
                                      <input
                                        type="text"
                                        value={value ? formatNumber(value) : ""}
                                        onChange={(e) => {
                                          const numericValue =
                                            e.target.value.replace(
                                              /[^0-9]/g,
                                              ""
                                            );
                                          const amount = numericValue
                                            ? Number(numericValue)
                                            : 0;

                                          setMonthlyTrends({
                                            ...monthlyTrends,
                                            [assetName]: {
                                              ...trends,
                                              [monthKey]: amount,
                                            },
                                          });
                                        }}
                                        disabled={isSaving}
                                        placeholder="0"
                                        className="w-full px-1.5 py-1 border rounded text-xs bg-white text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400 h-7"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* 왼쪽 아래: 월별 가용 계획 */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    월별 가용 계획
                  </h3>
                  <button
                    type="button"
                    onClick={handleSaveMonthlyPlans}
                    disabled={isSaving}
                    className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md"
                  >
                    저장
                  </button>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  월 수입과 저축 계획을 입력하세요
                </p>

                {/* 수입 입력 */}
                <div className="mb-4 p-3 bg-slate-50 rounded border border-slate-200">
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    월 수입
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={
                        monthlyPlans.income
                          ? formatNumber(monthlyPlans.income)
                          : ""
                      }
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(
                          /[^0-9]/g,
                          ""
                        );
                        const amount = numericValue ? Number(numericValue) : 0;
                        setMonthlyPlans({
                          ...monthlyPlans,
                          income: amount,
                        });
                      }}
                      disabled={isSaving}
                      placeholder="0"
                      className="flex-1 px-2 py-1.5 border rounded text-xs bg-white text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400 h-8 text-right"
                    />
                    <span className="text-xs text-slate-500">원</span>
                  </div>
                </div>

                {/* 저축 섹션 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-slate-700">
                      저축 항목
                    </h4>
                    <button
                      type="button"
                      onClick={() => addMonthlyPlanItem("savings")}
                      disabled={isSaving}
                      className="px-2 py-0.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md flex items-center gap-1"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      추가
                    </button>
                  </div>
                  <div className="space-y-2">
                    {monthlyPlans.savings.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">
                        저축 항목이 없습니다. 추가 버튼을 클릭하세요.
                      </p>
                    ) : (
                      monthlyPlans.savings.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 bg-slate-50 rounded border border-slate-200 space-y-1.5"
                        >
                          <div className="grid grid-cols-[1fr_auto] gap-2">
                            <input
                              type="text"
                              placeholder="항목명 (예: 청년도약)"
                              value={item.name}
                              onChange={(e) =>
                                updateMonthlyPlanItem("savings", item.id, {
                                  name: e.target.value,
                                })
                              }
                              disabled={isSaving}
                              className="px-2 py-1 border rounded text-xs bg-white text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400 h-7"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                deleteMonthlyPlanItem("savings", item.id)
                              }
                              disabled={isSaving}
                              className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="금액"
                              value={
                                item.amount ? formatNumber(item.amount) : ""
                              }
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(
                                  /[^0-9]/g,
                                  ""
                                );
                                const amount = numericValue
                                  ? Number(numericValue)
                                  : 0;
                                updateMonthlyPlanItem("savings", item.id, {
                                  amount,
                                });
                              }}
                              disabled={isSaving}
                              className="flex-1 px-2 py-1 border rounded text-xs bg-white text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400 h-7 text-right"
                            />
                            <span className="text-xs text-slate-500">원</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 가용금액 자동 계산 표시 */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between p-3 bg-slate-100 rounded border border-slate-300">
                    <span className="text-sm font-semibold text-slate-800">
                      가용금액
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {formatNumber(calculateAvailableAmount())}원
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    (수입 - 저축 합계)
                  </p>
                </div>

                {/* 현금 섹션 (선택사항) */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-slate-700">
                      현금 항목
                    </h4>
                    <button
                      type="button"
                      onClick={() => addMonthlyPlanItem("cash")}
                      disabled={isSaving}
                      className="px-2 py-0.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md flex items-center gap-1"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      추가
                    </button>
                  </div>
                  <div className="space-y-2">
                    {monthlyPlans.cash.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">
                        현금 항목이 없습니다. 추가 버튼을 클릭하세요.
                      </p>
                    ) : (
                      monthlyPlans.cash.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 bg-slate-50 rounded border border-slate-200 space-y-1.5"
                        >
                          <div className="grid grid-cols-[1fr_auto] gap-2">
                            <input
                              type="text"
                              placeholder="항목명 (예: 교통비)"
                              value={item.name}
                              onChange={(e) =>
                                updateMonthlyPlanItem("cash", item.id, {
                                  name: e.target.value,
                                })
                              }
                              disabled={isSaving}
                              className="px-2 py-1 border rounded text-xs bg-white text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400 h-7"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                deleteMonthlyPlanItem("cash", item.id)
                              }
                              disabled={isSaving}
                              className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="금액"
                              value={
                                item.amount ? formatNumber(item.amount) : ""
                              }
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(
                                  /[^0-9]/g,
                                  ""
                                );
                                const amount = numericValue
                                  ? Number(numericValue)
                                  : 0;
                                updateMonthlyPlanItem("cash", item.id, {
                                  amount,
                                });
                              }}
                              disabled={isSaving}
                              className="flex-1 px-2 py-1 border rounded text-xs bg-white text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400 h-7 text-right"
                            />
                            <span className="text-xs text-slate-500">원</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 오른쪽 아래: 연도별 자산 추이 */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    연도별 자산 추이
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* 연도 선택 */}
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      disabled={isSaving}
                      className="px-2 py-1 border rounded text-xs bg-white text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400"
                    >
                      {(() => {
                        const years: string[] = [];
                        const currentYear = new Date().getFullYear();
                        for (let i = 5; i >= 0; i--) {
                          years.push(String(currentYear - i));
                        }
                        return years.map((year) => (
                          <option key={year} value={year}>
                            {year}년
                          </option>
                        ));
                      })()}
                    </select>
                    <button
                      type="button"
                      onClick={handleSaveAnnualTrends}
                      disabled={isSaving}
                      className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md"
                    >
                      저장
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-4">
                  연도별 월별 총 자산 추이를 확인하세요
                </p>
                <div className="space-y-3">
                  {(() => {
                    const months = [
                      "01",
                      "02",
                      "03",
                      "04",
                      "05",
                      "06",
                      "07",
                      "08",
                      "09",
                      "10",
                      "11",
                      "12",
                    ];

                    const yearTrends = annualTrends[selectedYear] || {};

                    return (
                      <div className="p-2 bg-slate-50 rounded border border-slate-200">
                        <div className="text-xs font-medium text-slate-700 mb-2">
                          {selectedYear}년도
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {months.map((month) => {
                            const monthKey = month;
                            const value = yearTrends[monthKey] || 0;

                            return (
                              <div key={monthKey} className="space-y-0.5">
                                <label className="text-xs text-slate-600">
                                  {month}월
                                </label>
                                <input
                                  type="text"
                                  value={value ? formatNumber(value) : ""}
                                  onChange={(e) => {
                                    const numericValue = e.target.value.replace(
                                      /[^0-9]/g,
                                      ""
                                    );
                                    const amount = numericValue
                                      ? Number(numericValue)
                                      : 0;

                                    setAnnualTrends({
                                      ...annualTrends,
                                      [selectedYear]: {
                                        ...yearTrends,
                                        [monthKey]: amount,
                                      },
                                    });
                                  }}
                                  disabled={isSaving}
                                  placeholder="0"
                                  className="w-full px-1.5 py-1 border rounded text-xs bg-white text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400 h-7"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
