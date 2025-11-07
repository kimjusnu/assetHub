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
import {
  MoreVertical,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// 대시보드 탭 전환 화살표 버튼 컴포넌트
const DashboardNavButton = ({
  direction,
  onClick,
  title,
}: {
  direction: "left" | "right";
  onClick: () => void;
  title: string;
}) => {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  const positionClass = direction === "left" ? "left-4" : "right-4";

  return (
    <button
      onClick={onClick}
      className={`fixed ${positionClass} top-1/2 -translate-y-1/2 p-3 bg-white hover:bg-slate-100 rounded-full transition-colors shadow-lg hover:shadow-xl z-50 border border-slate-200 cursor-pointer`}
      title={title}
    >
      <Icon className="w-6 h-6 text-slate-700" />
    </button>
  );
};

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

  // 카테고리 접기/펼치기 상태
  const [expandedCategories, setExpandedCategories] = useState<
    Record<AssetCategory, boolean>
  >({
    depositSavings: false,
    trustISA: false,
    insurance: false,
    pension: false,
    investment: false,
  });

  // 카테고리 토글 함수
  const toggleCategory = (category: AssetCategory) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category],
    });
  };

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
  // 각 자산 항목별 월별 저축액 변화를 저장
  // 예: { "수협 예금": { "2025-08": 500000 (저축액), "2025-09": -100000 (인출액), ... } }
  const [monthlyTrends, setMonthlyTrends] = useState<
    Record<string, Record<string, number>>
  >({});

  // 월별 자산 추이에서 자산 순서 관리
  const [monthlyTrendsOrder, setMonthlyTrendsOrder] = useState<string[]>([]);

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

  // 월별 가용 계획 저축 항목 접기/펼치기 상태
  const [expandedSavings, setExpandedSavings] = useState(false);

  // 월별 가용 계획 현금 항목 접기/펼치기 상태
  const [expandedCash, setExpandedCash] = useState(false);

  // 대시보드 탭 상태 ("management" | "charts")
  const [dashboardTab, setDashboardTab] = useState<"management" | "charts">(
    "management"
  );

  // 연도별 자산 추이 상태
  // 예: { "2025": { "01": 23500000, "02": 23800000, ... } }
  const [annualTrends, setAnnualTrends] = useState<
    Record<string, Record<string, number>>
  >({});

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

          // 월별 자산 추이 순서 로드
          if (userData.monthlyTrendsOrder) {
            setMonthlyTrendsOrder(userData.monthlyTrendsOrder || []);
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
    } catch (err) {
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
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "자산 저장에 실패했습니다.";
      console.error("자산 저장 실패:", err);
      setError(errorMessage);
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
          monthlyTrendsOrder,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setSuccess("월별 자산 추이가 저장되었습니다.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "저장에 실패했습니다.";
      console.error("월별 자산 추이 저장 실패:", err);
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // SortableRow 컴포넌트
  interface SortableRowProps {
    product: {
      name: string;
      category: AssetCategory;
      uniqueKey: string;
    };
    trends: Record<string, number>;
    maturityDate?: string;
    months: string[];
    monthlyTrends: typeof monthlyTrends;
    setMonthlyTrends: (trends: typeof monthlyTrends) => void;
    isSaving: boolean;
    formatNumber: (num: number) => string;
  }

  const SortableRow = ({
    product,
    trends,
    maturityDate,
    months,
    monthlyTrends,
    setMonthlyTrends,
    isSaving,
    formatNumber,
  }: SortableRowProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: product.uniqueKey });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    // 각 월별 입력값을 별도로 관리
    const [inputValues, setInputValues] = useState<Record<string, string>>({});

    // 만기일 포맷팅
    const formatMaturityDate = (dateStr?: string) => {
      if (!dateStr) return "-";
      try {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}.${month}.${day}`;
      } catch {
        return "-";
      }
    };

    return (
      <tr ref={setNodeRef} style={style} className="hover:bg-slate-50">
        <td className="sticky left-0 z-10 border border-slate-200 px-2 py-2 text-xs font-medium text-slate-700 bg-slate-50">
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing touch-none select-none p-1 -ml-1 hover:bg-slate-200 rounded transition-colors"
            >
              <GripVertical className="w-4 h-4 text-slate-400" />
            </div>
            <div className="select-none">{product.name}</div>
          </div>
        </td>
        <td className="border border-slate-200 px-2 py-2 text-xs text-slate-600 bg-slate-50">
          {formatMaturityDate(maturityDate)}
        </td>
        {months.map((month) => {
          const monthKey = month;
          const changeAmount = trends[monthKey] || 0;
          const inputKey = `${product.uniqueKey}-${monthKey}`;
          const rawInputValue = inputValues[inputKey];

          // 표시할 값: 입력 중이면 입력값에 쉼표 추가, 아니면 저장된 값에 쉼표 추가
          let displayValue = "";
          if (rawInputValue !== undefined) {
            // 입력 중인 값에 쉼표 추가
            const numericPart = rawInputValue.replace(/[^0-9]/g, "");
            if (numericPart) {
              const formatted = numericPart.replace(
                /\B(?=(\d{3})+(?!\d))/g,
                ","
              );
              displayValue = rawInputValue.startsWith("-")
                ? `-${formatted}`
                : formatted;
            } else if (rawInputValue === "-") {
              displayValue = "-";
            }
          } else if (changeAmount !== 0) {
            // 저장된 값에 쉼표 추가
            displayValue = formatNumber(Math.abs(changeAmount));
            if (changeAmount < 0) {
              displayValue = `-${displayValue}`;
            }
          }

          return (
            <td key={monthKey} className="border border-slate-200 px-1 py-1">
              <input
                type="text"
                placeholder="0"
                value={displayValue}
                onChange={(e) => {
                  const inputValue = e.target.value;

                  // 쉼표 제거하고 숫자와 마이너스만 추출
                  let cleanedValue = inputValue.replace(/[^0-9-]/g, "");

                  // 마이너스가 여러 개 있으면 첫 번째만 유지
                  if (cleanedValue.includes("-")) {
                    const firstMinusIndex = cleanedValue.indexOf("-");
                    if (firstMinusIndex !== 0) {
                      // 마이너스가 맨 앞이 아니면 제거
                      cleanedValue = cleanedValue.replace(/-/g, "");
                    } else {
                      // 맨 앞에 마이너스가 있으면 나머지 마이너스 제거
                      cleanedValue =
                        "-" + cleanedValue.slice(1).replace(/-/g, "");
                    }
                  }

                  // 입력값만 저장 (setMonthlyTrends 호출하지 않음)
                  setInputValues((prev) => ({
                    ...prev,
                    [inputKey]: cleanedValue,
                  }));
                }}
                onBlur={(e) => {
                  const inputValue = e.target.value;

                  // 쉼표 제거
                  const cleanedValue = inputValue.replace(/[^0-9-]/g, "");

                  // 빈 문자열이면 0으로 설정
                  if (cleanedValue === "" || cleanedValue === "-") {
                    setMonthlyTrends({
                      ...monthlyTrends,
                      [product.name]: {
                        ...trends,
                        [monthKey]: 0,
                      },
                    });
                    setInputValues((prev) => {
                      const newValues = { ...prev };
                      delete newValues[inputKey];
                      return newValues;
                    });
                    return;
                  }

                  // 마이너스 처리
                  let finalValue = cleanedValue;
                  if (cleanedValue.includes("-")) {
                    const firstMinusIndex = cleanedValue.indexOf("-");
                    if (firstMinusIndex !== 0) {
                      finalValue = cleanedValue.replace(/-/g, "");
                    } else {
                      finalValue =
                        "-" + cleanedValue.slice(1).replace(/-/g, "");
                    }
                  }

                  // 숫자만 추출 (마이너스 제외)
                  const numbersOnly = finalValue.replace(/-/g, "");

                  // 빈 값이거나 마이너스만 있으면 0
                  if (numbersOnly === "" || finalValue === "-") {
                    setMonthlyTrends({
                      ...monthlyTrends,
                      [product.name]: {
                        ...trends,
                        [monthKey]: 0,
                      },
                    });
                  } else {
                    // 숫자로 변환
                    const amount = finalValue.startsWith("-")
                      ? -Number(numbersOnly)
                      : Number(numbersOnly);

                    setMonthlyTrends({
                      ...monthlyTrends,
                      [product.name]: {
                        ...trends,
                        [monthKey]: amount,
                      },
                    });
                  }

                  // 포커스를 잃으면 입력값 초기화 (다음에 표시할 때는 저장된 값 사용)
                  setInputValues((prev) => {
                    const newValues = { ...prev };
                    delete newValues[inputKey];
                    return newValues;
                  });
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                disabled={isSaving}
                className="w-full px-1.5 py-1 border rounded text-xs bg-white text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400 h-7 text-center"
              />
            </td>
          );
        })}
      </tr>
    );
  };
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
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "저장에 실패했습니다.";
      console.error("월별 가용 계획 저장 실패:", err);
      setError(errorMessage);
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
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "저장에 실패했습니다.";
      console.error("연도별 자산 추이 저장 실패:", err);
      setError(errorMessage);
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
            <div className="max-w-2xl mx-auto lg:mx-0 w-full">
              <div className="mb-12">
                <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                  복잡한 자산관리
                  <br />
                  쉽고 간단하게 관리하세요
                </h1>
                <p className="text-base text-slate-600 leading-relaxed">
                  전문가가 설계한 자산관리 툴로 자산별 추이를 그래프로 확인하고
                  관리하세요
                </p>
              </div>

              {/* 그래프 및 차트 섹션 */}
              <div className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 자산 추이 그래프 (더미 데이터) */}
                <div className="px-4">
                  <div className="flex items-center justify-between mb-0">
                    <div>
                      <h3 className="text-slate-900 font-semibold text-lg mb-0">
                        월별 자산 성장 추이
                      </h3>
                      <p className="text-slate-500 text-sm">
                        지난 12개월 성장률
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-2xl font-bold"
                        style={{ color: "#2ED896" }}
                      >
                        +24.8%
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        전월 대비 증가
                      </div>
                    </div>
                  </div>
                  <div className="relative" style={{ height: "180px" }}>
                    <svg
                      width="120%"
                      height="100%"
                      viewBox="0 0 600 320"
                      className="overflow-visible -translate-x-[10%]"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {/* 그리드 라인 */}
                      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <line
                          key={i}
                          x1="40"
                          y1={32 + i * 40}
                          x2="580"
                          y2={32 + i * 40}
                          stroke="rgba(0,0,0,0.1)"
                          strokeWidth="1"
                        />
                      ))}
                      {/* 월별 라벨 */}
                      {[
                        "1월",
                        "2월",
                        "3월",
                        "4월",
                        "5월",
                        "6월",
                        "7월",
                        "8월",
                        "9월",
                        "10월",
                        "11월",
                        "12월",
                      ].map((month, i) => (
                        <text
                          key={i}
                          x={60 + i * 45}
                          y={308}
                          fill="rgba(0,0,0,0.6)"
                          fontSize="20"
                          textAnchor="middle"
                        >
                          {month}
                        </text>
                      ))}
                      {/* 라인 차트 */}
                      <polyline
                        points="60,240 105,220 150,200 195,170 240,150 285,135 330,115 375,100 420,85 465,70 510,60 555,50"
                        fill="none"
                        stroke="#00FF9C"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* 영역 채우기 */}
                      <defs>
                        <linearGradient
                          id="areaGradient"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            stopColor="rgba(0, 255, 156, 0.3)"
                          />
                          <stop
                            offset="100%"
                            stopColor="rgba(0, 255, 156, 0)"
                          />
                        </linearGradient>
                      </defs>
                      <polygon
                        points="60,240 105,220 150,200 195,170 240,150 285,135 330,115 375,100 420,85 465,70 510,60 555,50 555,320 60,320"
                        fill="url(#areaGradient)"
                      />
                      {/* 데이터 포인트 */}
                      {[
                        240, 220, 200, 170, 150, 135, 115, 100, 85, 70, 60, 50,
                      ].map((y, i) => (
                        <circle
                          key={i}
                          cx={60 + i * 45}
                          cy={y}
                          r="4"
                          fill="#00FF9C"
                          className="hover:r-6 transition-all"
                        />
                      ))}
                    </svg>
                  </div>
                </div>

                {/* 자산 구성 차트 */}
                <div className="px-4 flex flex-col">
                  <h3 className="text-slate-900 font-semibold text-lg mb-0">
                    자산 구성 현황
                  </h3>
                  <div className="flex items-center gap-6 mt-12">
                    {/* 도넛 차트 */}
                    <div className="relative w-32 h-32">
                      <svg width="128" height="128" viewBox="0 0 128 128">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="12"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#0065F8"
                          strokeWidth="12"
                          strokeDasharray={`${2 * Math.PI * 56 * 0.45} ${
                            2 * Math.PI * 56
                          }`}
                          strokeDashoffset={2 * Math.PI * 56 * 0.25}
                          transform="rotate(-90 64 64)"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#00CAFF"
                          strokeWidth="12"
                          strokeDasharray={`${2 * Math.PI * 56 * 0.3} ${
                            2 * Math.PI * 56
                          }`}
                          strokeDashoffset={2 * Math.PI * 56 * 0.7}
                          transform="rotate(-90 64 64)"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#00FFDE"
                          strokeWidth="12"
                          strokeDasharray={`${2 * Math.PI * 56 * 0.25} ${
                            2 * Math.PI * 56
                          }`}
                          strokeDashoffset={2 * Math.PI * 56 * 0.975}
                          transform="rotate(-90 64 64)"
                        />
                        <text
                          x="64"
                          y="70"
                          fill="#1e293b"
                          fontSize="16"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          총 자산
                        </text>
                        <text
                          x="64"
                          y="85"
                          fill="#64748b"
                          fontSize="12"
                          textAnchor="middle"
                        >
                          2.4억원
                        </text>
                      </svg>
                    </div>
                    {/* 범례 */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: "#0065F8" }}
                        ></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900">
                            예금/적금
                          </div>
                          <div className="text-xs text-slate-500">
                            45% · 1억 800만원
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: "#00CAFF" }}
                        ></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900">
                            투자
                          </div>
                          <div className="text-xs text-slate-500">
                            30% · 7,200만원
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: "#00FFDE" }}
                        ></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900">
                            기타
                          </div>
                          <div className="text-xs text-slate-500">
                            25% · 6,000만원
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 주요 기능 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="w-6 h-6 text-slate-800"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-slate-900">
                      간단한 자산 기록
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    복잡한 절차 없이 자산을 쉽고 간단하게
                    {/* <br /> */}
                    기록하여 관리할 수 있습니다
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="w-6 h-6 text-slate-800"
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
                    <h3 className="text-lg font-semibold text-slate-900">
                      목표 달성 지원
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    목표 금액을 설정하고 필요한 금액을 모으기 위해
                    {/* <br /> */}
                    체계적으로 도와드립니다
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="w-6 h-6 text-slate-800"
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
                    <h3 className="text-lg font-semibold text-slate-900">
                      통계 데이터 시각화
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    자산에 대한 통계 데이터를 그래프로 제공하여
                    {/* <br /> */}
                    한눈에 파악하고 분석할 수 있습니다
                  </p>
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
        {/* 왼쪽 화살표 버튼 (관리 대시보드에서만 표시) */}
        {dashboardTab === "management" && (
          <DashboardNavButton
            direction="left"
            onClick={() => setDashboardTab("charts")}
            title="차트 대시보드로 이동"
          />
        )}

        {/* 오른쪽 화살표 버튼 (차트 대시보드에서만 표시) */}
        {dashboardTab === "charts" && (
          <DashboardNavButton
            direction="right"
            onClick={() => setDashboardTab("management")}
            title="자산 관리 대시보드로 이동"
          />
        )}

        <div className="max-w-6xl mx-auto">
          <main className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 shadow-sm">
            {dashboardTab === "management" ? (
              <>
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
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-800">
                        자산 현황
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSubmit(e);
                        }}
                        disabled={isSaving}
                        className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md"
                      >
                        저장
                      </button>
                    </div>
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
                                <button
                                  type="button"
                                  onClick={() => toggleCategory(category)}
                                  className="flex items-center gap-2 flex-1 text-left hover:opacity-70 transition-opacity"
                                >
                                  {expandedCategories[category] ? (
                                    <ChevronUp className="w-4 h-4 text-slate-600" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-600" />
                                  )}
                                  <div>
                                    <h4 className="text-sm font-semibold text-slate-800">
                                      {categoryLabels[category]}
                                    </h4>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                      총 {formatNumber(categoryTotal)}원
                                      {products.length > 0 && (
                                        <span className="ml-1">
                                          ({products.length}개)
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    addProduct(category);
                                    // 추가 시 자동으로 펼치기
                                    if (!expandedCategories[category]) {
                                      setExpandedCategories({
                                        ...expandedCategories,
                                        [category]: true,
                                      });
                                    }
                                  }}
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

                              {/* 상품 목록 (접기/펼치기) */}
                              {expandedCategories[category] && (
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
                                                  onChange={(
                                                    date: Date | null
                                                  ) => {
                                                    updateProduct(
                                                      category,
                                                      product.id,
                                                      {
                                                        maturityDate: date
                                                          ? `${date.getFullYear()}-${String(
                                                              date.getMonth() +
                                                                1
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
                                                        ? formatNumber(
                                                            product.amount
                                                          )
                                                        : ""
                                                    }
                                                    onChange={(e) => {
                                                      const numericValue =
                                                        e.target.value.replace(
                                                          /[^0-9]/g,
                                                          ""
                                                        );
                                                      const amount =
                                                        numericValue
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
                                                {openMenu.category ===
                                                  category &&
                                                openMenu.productId ===
                                                  product.id ? (
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
                                                      toggleMenu(
                                                        category,
                                                        product.id
                                                      )
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
                                            editingMemo.productId ===
                                              product.id && (
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
                                                      deleteMemo(
                                                        category,
                                                        product.id
                                                      )
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
                              )}
                            </div>
                          );
                        }
                      )}

                      {/* 저장 버튼 제거 - 헤더로 이동 */}
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
                      각 자산별 월별 저축액 변화를 입력하세요 (양수: 저축, 음수:
                      인출)
                    </p>
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                      {/* 모든 자산 상품 목록 가져오기 */}
                      {(() => {
                        const allProducts: Array<{
                          name: string;
                          category: AssetCategory;
                          uniqueKey: string;
                        }> = [];
                        (
                          Object.keys(categoryLabels) as AssetCategory[]
                        ).forEach((category) => {
                          assets[category].forEach((product) => {
                            if (product.name && product.name.trim() !== "") {
                              allProducts.push({
                                name: product.name,
                                category,
                                uniqueKey: `${category}-${product.name}`,
                              });
                            }
                          });
                        });

                        if (allProducts.length === 0) {
                          return (
                            <p className="text-xs text-slate-400 text-center py-4">
                              자산 현황에서 상품을 먼저 등록해주세요.
                            </p>
                          );
                        }

                        // 순서가 있으면 순서대로 정렬, 없으면 현재 순서 유지
                        let sortedProducts = [...allProducts];
                        if (monthlyTrendsOrder.length > 0) {
                          // 순서에 있는 것들을 먼저 배치하고, 나머지는 뒤에 추가
                          const orderedProducts: typeof allProducts = [];
                          const unorderedProducts: typeof allProducts = [];

                          monthlyTrendsOrder.forEach((uniqueKey) => {
                            const found = allProducts.find(
                              (p) => p.uniqueKey === uniqueKey
                            );
                            if (found) {
                              orderedProducts.push(found);
                            }
                          });

                          allProducts.forEach((product) => {
                            if (
                              !monthlyTrendsOrder.includes(product.uniqueKey)
                            ) {
                              unorderedProducts.push(product);
                            }
                          });

                          sortedProducts = [
                            ...orderedProducts,
                            ...unorderedProducts,
                          ];
                        } else {
                          // 순서가 없으면 초기 순서를 설정
                          const initialOrder = allProducts.map(
                            (p) => p.uniqueKey
                          );
                          setMonthlyTrendsOrder(initialOrder);
                          sortedProducts = allProducts;
                        }

                        // 현재 연도의 1월~12월
                        const currentYear = new Date().getFullYear();
                        const months = Array.from({ length: 12 }, (_, i) => {
                          const month = String(i + 1).padStart(2, "0");
                          return `${currentYear}-${month}`;
                        });

                        // 드래그 가능한 아이템 ID 배열
                        const itemIds = sortedProducts.map((p) => p.uniqueKey);

                        // 드래그 종료 핸들러 (인라인으로 정의하여 itemIds에 접근)
                        const handleDragEndLocal = (event: DragEndEvent) => {
                          const { active, over } = event;

                          if (over && active.id !== over.id) {
                            const oldIndex = itemIds.indexOf(
                              active.id as string
                            );
                            const newIndex = itemIds.indexOf(over.id as string);

                            if (oldIndex !== -1 && newIndex !== -1) {
                              // itemIds를 기준으로 새로운 순서 생성
                              const newOrder = arrayMove(
                                itemIds,
                                oldIndex,
                                newIndex
                              );
                              setMonthlyTrendsOrder(newOrder);
                            }
                          }
                        };

                        return (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEndLocal}
                          >
                            <div className="min-w-full">
                              <table className="w-full border-collapse">
                                <thead className="sticky top-0 bg-slate-50 z-10">
                                  <tr>
                                    <th className="sticky left-0 z-20 border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700 text-left bg-slate-100 min-w-[120px]">
                                      자산명
                                    </th>
                                    <th className="border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700 text-left bg-slate-100">
                                      만기일
                                    </th>
                                    {months.map((month) => {
                                      const monthNum = month.split("-")[1];
                                      return (
                                        <th
                                          key={month}
                                          className="border border-slate-200 px-1.5 py-1.5 text-xs font-semibold text-slate-700 text-center bg-slate-100 min-w-[80px]"
                                        >
                                          {monthNum}월
                                        </th>
                                      );
                                    })}
                                  </tr>
                                </thead>
                                <tbody>
                                  <SortableContext
                                    items={itemIds}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    {sortedProducts.map((product) => {
                                      const assetName = product.name;
                                      const trends =
                                        monthlyTrends[assetName] || {};

                                      // 자산의 만기일 찾기 (해당 카테고리에서만)
                                      let maturityDate: string | undefined;
                                      const found = assets[
                                        product.category
                                      ].find((p) => p.name === assetName);
                                      if (found) {
                                        maturityDate = found.maturityDate;
                                      }

                                      return (
                                        <SortableRow
                                          key={product.uniqueKey}
                                          product={product}
                                          trends={trends}
                                          maturityDate={maturityDate}
                                          months={months}
                                          monthlyTrends={monthlyTrends}
                                          setMonthlyTrends={setMonthlyTrends}
                                          isSaving={isSaving}
                                          formatNumber={formatNumber}
                                        />
                                      );
                                    })}
                                  </SortableContext>
                                  {/* 월별 총합 행 */}
                                  <tr className="bg-slate-100 hover:bg-slate-200">
                                    <td
                                      colSpan={2}
                                      className="sticky left-0 z-10 border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-900 bg-slate-200"
                                    >
                                      월별 총합
                                    </td>
                                    {months.map((month) => {
                                      // 해당 월의 모든 자산 저축액 합계 계산
                                      const total = sortedProducts.reduce(
                                        (sum, product) => {
                                          const assetName = product.name;
                                          const trends =
                                            monthlyTrends[assetName] || {};
                                          const amount = trends[month] || 0;
                                          return sum + amount;
                                        },
                                        0
                                      );
                                      return (
                                        <td
                                          key={month}
                                          className="border border-slate-200 px-1.5 py-2 text-xs font-semibold text-slate-900 text-right bg-slate-200"
                                        >
                                          {total !== 0
                                            ? `${
                                                total < 0 ? "-" : ""
                                              }${formatNumber(Math.abs(total))}`
                                            : "-"}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                  {/* 증감액(저축액) 행 */}
                                  <tr className="bg-slate-50 hover:bg-slate-100">
                                    <td
                                      colSpan={2}
                                      className="sticky left-0 z-10 border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-800 bg-slate-100"
                                    >
                                      증감액(저축액)
                                    </td>
                                    {months.map((month, monthIndex) => {
                                      // 현재 월의 총합 계산
                                      const currentTotal =
                                        sortedProducts.reduce(
                                          (sum, product) => {
                                            const assetName = product.name;
                                            const trends =
                                              monthlyTrends[assetName] || {};
                                            const amount = trends[month] || 0;
                                            return sum + amount;
                                          },
                                          0
                                        );

                                      // 이전 달의 총합 계산
                                      let previousTotal = 0;
                                      if (monthIndex > 0) {
                                        const previousMonth =
                                          months[monthIndex - 1];
                                        previousTotal = sortedProducts.reduce(
                                          (sum, product) => {
                                            const assetName = product.name;
                                            const trends =
                                              monthlyTrends[assetName] || {};
                                            const amount =
                                              trends[previousMonth] || 0;
                                            return sum + amount;
                                          },
                                          0
                                        );
                                      }

                                      // 증감액 계산 (현재 총합 - 이전 총합)
                                      const changeAmount =
                                        currentTotal - previousTotal;
                                      const isPositive = changeAmount > 0;
                                      const isNegative = changeAmount < 0;

                                      return (
                                        <td
                                          key={month}
                                          className={`border border-slate-200 px-1.5 py-2 text-xs font-semibold text-right bg-slate-100 ${
                                            isPositive
                                              ? "text-green-600"
                                              : isNegative
                                              ? "text-red-600"
                                              : "text-slate-600"
                                          }`}
                                        >
                                          {monthIndex === 0
                                            ? "-" // 1월은 이전 달이 없으므로 "-"
                                            : changeAmount !== 0
                                            ? `${
                                                isPositive ? "+" : ""
                                              }${formatNumber(
                                                Math.abs(changeAmount)
                                              )}`
                                            : "-"}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </DndContext>
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
                            const amount = numericValue
                              ? Number(numericValue)
                              : 0;
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
                        <button
                          type="button"
                          onClick={() => setExpandedSavings(!expandedSavings)}
                          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                        >
                          {expandedSavings ? (
                            <ChevronUp className="w-4 h-4 text-slate-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                          )}
                          <h4 className="text-xs font-semibold text-slate-700">
                            저축 항목
                          </h4>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            addMonthlyPlanItem("savings");
                            // 추가 시 자동으로 펼치기
                            if (!expandedSavings) {
                              setExpandedSavings(true);
                            }
                          }}
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
                      {expandedSavings && (
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
                                      updateMonthlyPlanItem(
                                        "savings",
                                        item.id,
                                        {
                                          name: e.target.value,
                                        }
                                      )
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
                                      item.amount
                                        ? formatNumber(item.amount)
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const numericValue =
                                        e.target.value.replace(/[^0-9]/g, "");
                                      const amount = numericValue
                                        ? Number(numericValue)
                                        : 0;
                                      updateMonthlyPlanItem(
                                        "savings",
                                        item.id,
                                        {
                                          amount,
                                        }
                                      );
                                    }}
                                    disabled={isSaving}
                                    className="flex-1 px-2 py-1 border rounded text-xs bg-white text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400 h-7 text-right"
                                  />
                                  <span className="text-xs text-slate-500">
                                    원
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
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
                        <button
                          type="button"
                          onClick={() => setExpandedCash(!expandedCash)}
                          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                        >
                          {expandedCash ? (
                            <ChevronUp className="w-4 h-4 text-slate-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                          )}
                          <h4 className="text-xs font-semibold text-slate-700">
                            현금 항목
                          </h4>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            addMonthlyPlanItem("cash");
                            // 추가 시 자동으로 펼치기
                            if (!expandedCash) {
                              setExpandedCash(true);
                            }
                          }}
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
                      {expandedCash && (
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
                                      item.amount
                                        ? formatNumber(item.amount)
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const numericValue =
                                        e.target.value.replace(/[^0-9]/g, "");
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
                                  <span className="text-xs text-slate-500">
                                    원
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 오른쪽 아래: 연도별 자산 추이 */}
                  <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-800">
                        연도별 자산 추이
                      </h3>
                      <button
                        type="button"
                        onClick={handleSaveAnnualTrends}
                        disabled={isSaving}
                        className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow-md"
                      >
                        저장
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">
                      연도별 월별 총 자산 추이를 확인하세요
                    </p>
                    <div className="overflow-x-auto">
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

                        // 연도 목록 생성 (2025년부터 최근 6년)
                        const currentYear = new Date().getFullYear();
                        const startYear = 2025;
                        const years: string[] = [];
                        const endYear = Math.max(currentYear, startYear);
                        for (let year = startYear; year <= endYear; year++) {
                          years.push(String(year));
                        }

                        return (
                          <div className="min-w-full">
                            <table className="w-full border-collapse">
                              <thead className="sticky top-0 bg-slate-50 z-10">
                                <tr>
                                  <th className="border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700 text-left bg-slate-100 min-w-[60px]">
                                    연도
                                  </th>
                                  {months.map((month) => (
                                    <th
                                      key={month}
                                      className="border border-slate-200 px-1.5 py-1.5 text-xs font-semibold text-slate-700 text-center bg-slate-100 min-w-[80px]"
                                    >
                                      {month}월
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {years.map((year) => {
                                  const yearTrends = annualTrends[year] || {};

                                  return (
                                    <tr
                                      key={year}
                                      className="hover:bg-slate-50"
                                    >
                                      <td className="border border-slate-200 px-2 py-2 text-xs font-medium text-slate-700 bg-slate-50">
                                        {year}년
                                      </td>
                                      {months.map((month) => {
                                        const monthKey = month;
                                        const value = yearTrends[monthKey] || 0;

                                        return (
                                          <td
                                            key={monthKey}
                                            className="border border-slate-200 px-1 py-1"
                                          >
                                            <input
                                              type="text"
                                              value={
                                                value ? formatNumber(value) : ""
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

                                                setAnnualTrends({
                                                  ...annualTrends,
                                                  [year]: {
                                                    ...yearTrends,
                                                    [monthKey]: amount,
                                                  },
                                                });
                                              }}
                                              disabled={isSaving}
                                              placeholder="0"
                                              className="w-full px-1.5 py-1 border rounded text-xs bg-white text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 focus:ring-slate-600 focus:border-slate-600 hover:border-slate-400 h-7 text-center"
                                            />
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 차트 대시보드 */}
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold mb-1 text-slate-800">
                    차트 대시보드
                  </h2>
                  <p className="text-sm text-slate-600">
                    자산 데이터를 시각적으로 분석하세요
                  </p>
                </div>

                {/* 차트 섹션 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 자산 성장 추이 차트 */}
                  <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                      자산 성장 추이
                    </h3>
                    <div className="h-64 flex items-center justify-center text-slate-400">
                      <p className="text-sm">차트 영역 (추후 구현 예정)</p>
                    </div>
                  </div>

                  {/* 자산 구성 차트 */}
                  <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                      자산 구성 현황
                    </h3>
                    <div className="h-64 flex items-center justify-center text-slate-400">
                      <p className="text-sm">차트 영역 (추후 구현 예정)</p>
                    </div>
                  </div>

                  {/* 월별 추이 차트 */}
                  <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                      월별 자산 추이
                    </h3>
                    <div className="h-64 flex items-center justify-center text-slate-400">
                      <p className="text-sm">차트 영역 (추후 구현 예정)</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
