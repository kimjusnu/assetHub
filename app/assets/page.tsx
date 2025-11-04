/**
 * 자산 입력 페이지 컴포넌트
 *
 * 사용자의 자산을 입력하고 관리할 수 있는 페이지입니다.
 * 각 대분류별로 여러 상품을 추가할 수 있습니다.
 * - 예금/적금
 * - 신탁/ISA
 * - 보험/공제
 * - 퇴직연금
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";
import { MoreVertical, FileText, Trash2 } from "lucide-react";

// 자산 상품 인터페이스
interface AssetProduct {
  id: string; // 고유 ID
  name: string; // 상품 이름 (필수)
  maturityDate?: string; // 만기일 (선택) - YYYY-MM-DD 형식
  amount: number; // 예치금액
  memo?: string; // 메모 (선택)
}

// 자산 데이터 인터페이스
interface AssetData {
  depositSavings: AssetProduct[]; // 예금/적금
  trustISA: AssetProduct[]; // 신탁/ISA
  insurance: AssetProduct[]; // 보험/공제
  pension: AssetProduct[]; // 퇴직연금
}

// 대분류 타입
type AssetCategory = "depositSavings" | "trustISA" | "insurance" | "pension";

// 대분류 한글 이름 매핑
const categoryLabels: Record<AssetCategory, string> = {
  depositSavings: "예금/적금",
  trustISA: "신탁/ISA",
  insurance: "보험/공제",
  pension: "퇴직연금",
};

export default function AssetsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // 자산 데이터 상태
  const [assets, setAssets] = useState<AssetData>({
    depositSavings: [],
    trustISA: [],
    insurance: [],
    pension: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 삭제 확인 상태 (어떤 상품이 확인 대기 중인지)
  const [confirmingDelete, setConfirmingDelete] = useState<{
    category: AssetCategory | null;
    productId: string | null;
  }>({
    category: null,
    productId: null,
  });

  // 메뉴 열림 상태 (어떤 상품의 메뉴가 열려있는지)
  const [openMenu, setOpenMenu] = useState<{
    category: AssetCategory | null;
    productId: string | null;
  }>({
    category: null,
    productId: null,
  });

  // 메모 입력 상태 (어떤 상품의 메모가 열려있는지)
  const [editingMemo, setEditingMemo] = useState<{
    category: AssetCategory | null;
    productId: string | null;
  }>({
    category: null,
    productId: null,
  });

  // 자산 데이터 로드
  useEffect(() => {
    const loadAssets = async () => {
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
          if (userData.assets) {
            setAssets({
              depositSavings: userData.assets.depositSavings || [],
              trustISA: userData.assets.trustISA || [],
              insurance: userData.assets.insurance || [],
              pension: userData.assets.pension || [],
            });
          }
        }
      } catch (err) {
        console.error("자산 정보 로드 실패:", err);
        setError("자산 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      if (user) {
        loadAssets();
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

  // 삭제 버튼 클릭 시 바로 삭제
  const handleDelete = (category: AssetCategory, productId: string) => {
    setAssets({
      ...assets,
      [category]: assets[category].filter(
        (product) => product.id !== productId
      ),
    });
    closeMenu();
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

  // 총 자산 계산
  const calculateTotal = (products: AssetProduct[]): number => {
    return products.reduce((sum, product) => sum + (product.amount || 0), 0);
  };

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
          },
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setSuccess("자산 정보가 성공적으로 저장되었습니다.");
    } catch (err: any) {
      console.error("자산 저장 실패:", err);
      setError(err.message || "자산 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 총 자산 계산
  const totalAssets =
    calculateTotal(assets.depositSavings) +
    calculateTotal(assets.trustISA) +
    calculateTotal(assets.insurance) +
    calculateTotal(assets.pension);

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
    return null;
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
            <Link
              href="/"
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-medium transition-all duration-200 flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm hover:shadow-md"
            >
              대시보드로
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 p-4">
        <div className="max-w-5xl mx-auto">
          <main className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                자산 입력
              </h2>
              <p className="text-sm text-slate-600">
                보유하신 자산을 입력하세요
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

            {/* 총 자산 요약 */}
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  총 자산
                </span>
                <span className="text-2xl font-bold text-slate-900">
                  {formatNumber(totalAssets)}원
                </span>
              </div>
            </div>

            {/* 자산 입력 폼 */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-400 border-t-transparent mb-3"></div>
                <p className="text-sm text-slate-600">정보를 불러오는 중...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* 각 대분류별 섹션 */}
                {(Object.keys(categoryLabels) as AssetCategory[]).map(
                  (category) => {
                    const products = assets[category];
                    const categoryTotal = calculateTotal(products);

                    return (
                      <div
                        key={category}
                        className="border-b border-slate-200 pb-6 last:border-b-0"
                      >
                        {/* 대분류 헤더 */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800">
                              {categoryLabels[category]}
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                              총 {formatNumber(categoryTotal)}원
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => addProduct(category)}
                            disabled={isSaving}
                            className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md flex items-center gap-1.5"
                          >
                            <svg
                              className="w-4 h-4"
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
                            상품 추가
                          </button>
                        </div>

                        {/* 상품 목록 */}
                        <div className="space-y-4">
                          {products.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">
                              등록된 상품이 없습니다. 상품을 추가해주세요.
                            </p>
                          ) : (
                            products.map((product) => {
                              const maturityDate = product.maturityDate
                                ? new Date(product.maturityDate)
                                : null;

                              return (
                                <div
                                  key={product.id}
                                  className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3"
                                >
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {/* 상품 이름 */}
                                    <div>
                                      <label className="block text-xs font-medium text-slate-700 mb-1">
                                        상품 이름{" "}
                                        <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="예: 정기예금"
                                        value={product.name}
                                        onChange={(e) =>
                                          updateProduct(category, product.id, {
                                            name: e.target.value,
                                          })
                                        }
                                        disabled={isSaving}
                                        required
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 bg-white text-slate-900 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400 h-10"
                                      />
                                    </div>

                                    {/* 만기일 */}
                                    <div>
                                      <label className="block text-xs font-medium text-slate-700 mb-1">
                                        만기일
                                      </label>
                                      <DatePicker
                                        selected={maturityDate}
                                        onChange={(date: Date | null) => {
                                          updateProduct(category, product.id, {
                                            maturityDate: date
                                              ? `${date.getFullYear()}-${String(
                                                  date.getMonth() + 1
                                                ).padStart(2, "0")}-${String(
                                                  date.getDate()
                                                ).padStart(2, "0")}`
                                              : undefined,
                                          });
                                        }}
                                        dateFormat="yyyy년 MM월 dd일"
                                        locale={ko}
                                        placeholderText="만기일 선택"
                                        disabled={isSaving}
                                        className="w-full"
                                      />
                                    </div>

                                    {/* 예치금액 */}
                                    <div>
                                      <label className="block text-xs font-medium text-slate-700 mb-1">
                                        예치금액
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
                                            // 쉼표 제거하여 숫자만 추출
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
                                          className="w-full px-3 py-2 pr-12 border rounded-md focus:outline-none focus:ring-1 bg-white text-slate-900 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400 h-10"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                                          원
                                        </span>
                                      </div>
                                    </div>

                                    {/* 더보기 버튼 */}
                                    <div className="flex items-end menu-container">
                                      {openMenu.category === category &&
                                      openMenu.productId === product.id ? (
                                        <div className="flex flex-col gap-1 bg-white border border-slate-200 rounded-md shadow-lg p-1 min-w-[100px]">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              startMemoEdit(
                                                category,
                                                product.id
                                              )
                                            }
                                            disabled={isSaving}
                                            className="px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 rounded flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            <FileText className="w-3.5 h-3.5" />
                                            메모
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleDelete(category, product.id)
                                            }
                                            disabled={isSaving}
                                            className="px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 rounded flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
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
                                          className="px-2 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex flex-col items-center gap-0.5"
                                        >
                                          <MoreVertical className="w-5 h-5 mb-1" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* 메모 입력 영역 */}
                                  {editingMemo.category === category &&
                                    editingMemo.productId === product.id && (
                                      <div className="mt-3 p-3 bg-white border border-slate-200 rounded-md">
                                        <div className="flex items-start gap-2">
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
                                            rows={3}
                                            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-1 bg-white text-slate-900 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400 resize-none"
                                          />
                                          <div className="flex flex-col gap-1">
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
                                              className="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-md text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                            >
                                              저장
                                            </button>
                                            <button
                                              type="button"
                                              onClick={cancelMemoEdit}
                                              disabled={isSaving}
                                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                            >
                                              취소
                                            </button>
                                            {product.memo &&
                                              product.memo.trim() !== "" && (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    deleteMemo(
                                                      category,
                                                      product.id
                                                    )
                                                  }
                                                  disabled={isSaving}
                                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-red-200"
                                                >
                                                  삭제
                                                </button>
                                              )}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                  {/* 메모 표시 영역 */}
                                  {!editingMemo.category &&
                                    !editingMemo.productId &&
                                    product.memo &&
                                    product.memo.trim() !== "" && (
                                      <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
                                        <div className="flex items-start gap-2">
                                          <FileText className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                                          <p className="text-sm text-slate-700 flex-1 whitespace-pre-wrap">
                                            {product.memo}
                                          </p>
                                          <div className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                startMemoEdit(
                                                  category,
                                                  product.id
                                                )
                                              }
                                              disabled={isSaving}
                                              className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              수정
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                deleteMemo(category, product.id)
                                              }
                                              disabled={isSaving}
                                              className="px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              삭제
                                            </button>
                                          </div>
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
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
