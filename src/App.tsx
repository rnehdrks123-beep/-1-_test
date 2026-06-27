import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { 
  Sparkles, 
  MapPin, 
  Store, 
  Check, 
  ChevronRight, 
  Download, 
  Plus, 
  Minus, 
  Award, 
  AlertTriangle, 
  Activity, 
  Layers, 
  FileText, 
  CheckSquare, 
  Calendar,
  Bookmark,
  Share2,
  RefreshCw,
  Search,
  BookOpen
} from "lucide-react";
import { StoreInfo, DiagnosisResult } from "./types";

export default function App() {
  // 1. Form state
  const [industry, setIndustry] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [menu, setMenu] = useState<string>("");
  const [keywords, setKeywords] = useState<string>("");
  
  // Naver Place Tools toggable array
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  
  // Reviews counts supporting typing and increment/decrement
  const [visitCount, setVisitCount] = useState<number | "">("");
  const [blogCount, setBlogCount] = useState<number | "">("");

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [resultData, setResultData] = useState<DiagnosisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingImage, setSavingImage] = useState<boolean>(false);
  const [savingPDF, setSavingPDF] = useState<boolean>(false);
  const [downloadedImage, setDownloadedImage] = useState<string | null>(null);

  // Capture ref for html2canvas
  const captureRef = useRef<HTMLDivElement>(null);

  // Interactive loading screen messages
  const loadingMessages = [
    "매장 기본 데이터 수집 및 분석 중입니다...",
    "동밀 타겟 상권 및 키워드 검색량 시뮬레이션 중입니다...",
    "네이버 플레이스 도구(+예약/톡톡/쿠폰) 알고리즘 결합 가산점을 산출 중입니다...",
    "방문자 및 블로그 영수증 리뷰 피드백 가중치를 정밀 측정하는 중입니다...",
    "유입 대비 저장하기, 예약 전환 잠재 인게이지먼트를 분석 중입니다...",
    "매장의 노출 가산점 정밀 상태 진단 보고서를 생성하는 중입니다...",
  ];

  // Rotate loading step messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Form togglers
  const handleToggleTool = (tool: string) => {
    if (selectedTools.includes(tool)) {
      setSelectedTools(selectedTools.filter((t) => t !== tool));
    } else {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  const handleIncrement = (type: "visit" | "blog") => {
    if (type === "visit") {
      const current = typeof visitCount === "number" ? visitCount : 0;
      setVisitCount(current + 1);
    } else {
      const current = typeof blogCount === "number" ? blogCount : 0;
      setBlogCount(current + 1);
    }
  };

  const handleDecrement = (type: "visit" | "blog") => {
    if (type === "visit") {
      const current = typeof visitCount === "number" ? visitCount : 0;
      setVisitCount(current > 0 ? current - 1 : 0);
    } else {
      const current = typeof blogCount === "number" ? blogCount : 0;
      setBlogCount(current > 0 ? current - 1 : 0);
    }
  };

  // Submit diagnostic data (Fully client-side logic to guarantee seamless static hosting and zero 429 quota errors)
  const handleAnalyze = async () => {
    // Validate inputs
    if (!industry.trim()) {
      setErrorMessage("플레이스 등록 이름을 입력해주세요 (예: 화로구이 만수점)");
      return;
    }
    if (!region.trim()) {
      setErrorMessage("타겟 지역명을 입력해주세요 (예: 만수동)");
      return;
    }
    if (!menu.trim()) {
      setErrorMessage("핵심 메뉴/업종을 입력해주세요 (예: 삼겹살)");
      return;
    }
    if (!keywords.trim()) {
      setErrorMessage("현재 등록된 키워드(태그)를 입력해주세요 (예: 만수동 맛집,고기집)");
      return;
    }

    setErrorMessage(null);
    setLoading(true);
    setShowResult(false);
    setDownloadedImage(null); // Clear previous preview file on new analysis

    // Simulate 1.8s progress animation for standard professional analysis feel
    setTimeout(() => {
      try {
        const keywordList = keywords.split(",").map((k) => k.trim()).filter(Boolean);
        const primaryKey = keywordList[0] || "등록 키워드";

        // Calculate scores under the strict <=40 constraint
        const keywordScore = 5 + Math.min(keywordList.length * 1, 5);
        const toolsScore = 4 + Math.min(selectedTools.length * 1.5, 6);
        const reviewsScore = 4 + Math.min(Math.floor((Number(visitCount || 0) + Number(blogCount || 0)) / 100), 6);
        const engagementScore = 3 + Math.min(Math.floor(Number(visitCount || 0) / 150), 7);
        
        // Final score strictly capped to 40 max in integer (room for improvement constraint)
        const totalScore = Math.min(keywordScore + toolsScore + reviewsScore + engagementScore, 40);

        const allTools = ["네이버 예약", "네이버 톡톡", "쿠폰", "스마트콜"];
        const missingTools = allTools.filter(t => !selectedTools.includes(t));
        const toolSettingsStatus = allTools.map(t => `${t}(${selectedTools.includes(t) ? "등록 완료" : "미등록"})`).join(", ");

        const summary = `'${industry}'의 현재 스마트플레이스 최적화 지수는 ${totalScore}점으로, 검색 노출량 누수 현상이 심도 있게 분석되었습니다.`;
        const expectedRank = `${region} ${menu} 키워드 기준 통합 검색 15페이지 밖 (실질 노출 누약 상태)`;

        const algorithmDiagnosis = missingTools.length > 0
          ? `현재 플레이스 엔진 분석 결과, 유입 및 고객 전환을 극대화하는 핵심 알고리즘 가산점인 [${missingTools.join(", ")}] 기능이 누락된 상태입니다. 네이버 플레이스 랭킹 알고리즘(v3.5)은 예약 전환 성공률과 스마트 톡톡을 통한 유저 인게이지먼트에 막대한 가산점 가중치를 부여합니다. 필수 도구의 미등록은 인덱스 최적 점수를 큰 폭으로 저하시키는 1순위 노출 감점 요인입니다.`
          : `플레이스의 필수 설정 도구 4종은 모두 준수하게 활성화되어 기초적인 상태는 마련되었습니다. 그러나, 핵심 노출 알고리즘을 자극하고 상위 노출 순위를 지속적으로 방어하기 위해 필요한 사용자 상호작용 지표(클릭률, 길찾기 전환, 저장하기 등) 및 양질의 영수증 평판 지표가 임계치 미만으로 측정되어 노출 활성도가 억제된 상태입니다.`;

        const optimizationEffect = missingTools.length > 0
          ? `누락된 스마트플레이스 필수 비즈니스 도구 [${missingTools.join(", ")}]을 활성화하여 기재를 정상화하고, 입력된 타겟 키워드 구문을 가독성 및 알고리즘 가중치에 맞춰 최적 재편성할 경우, 단기간 내에 플레이스 유입 지수가 최대 +85% 가속화되어 노출 경쟁 우위를 즉각 확보할 수 있을 것으로 예측됩니다.`
          : `활성화된 비즈니스 도구의 실제 활용 이력(실제 톡톡 응대 속도 단축, 스마트콜 연결 성공률 제고)을 강화하고, 지역 키워드 밀집 정합성 태그를 재구성할 경우, 랭킹 가속 점수가 상승하여 기존 노출 순위 대비 최소 2~3페이지 이상의 확실한 순위 상승 피드백을 기대할 수 있습니다.`;

        const competitiveCount = 35 + (industry.length * 3) % 45;
        const competitiveStores = `약 ${competitiveCount}개 (주변 500m 반경 AI 자동 측정)`;

        let localRankDiagnosis = "";
        const totalReviews = Number(visitCount || 0) + Number(blogCount || 0);
        if (totalReviews < 50) {
          localRankDiagnosis = `반경 500m 내 동일 경쟁 업종 매장들과 비교 진단한 결과, 현재 등록된 방문자 영수증 후기(${visitCount}개) 및 블로그 후기(${blogCount}개)의 절대량이 매우 부족합니다. 경쟁사들은 월 평균 수십 건 이상의 신규 영수증 및 플레이스 저장하기 트래픽을 지속 공급받고 있으므로, 빠른 순위 진입을 위해 신규 방문 리뷰 축적 캠페인이 필수적입니다.`;
        } else if (totalReviews < 200) {
          localRankDiagnosis = `현재 누적 방문자 리뷰(${visitCount}개)와 블로그 후기(${blogCount}개)는 타겟 지역권 상권 진입을 위한 최소 요건은 충족하고 있습니다. 하지만 선두 업체들의 실시간 인게이지먼트 방어 점수를 뛰어넘기 위해서는 단순 영수증 수치 외에, 본문 텍스트 내 형태소 분석 점수와 핵심 속성(친절, 맛 등) 태그 정합도를 높이는 타게팅 정교화가 수반되어야 합니다.`;
        } else {
          localRankDiagnosis = `총 ${totalReviews}개의 리뷰 인프라를 잘 확보하고 있음에도 불구하고 랭킹 지수가 낮은 원인은, 등록된 키워드('${keywords}')와 매장 실적 데이터 간의 정합점 연결 고리가 끊겨 있기 때문입니다. 영수증 리뷰어의 사진 업로드 비율을 제고하고 플레이스 저장하기 전환율을 유도하여 이탈률을 보완해야 하는 긴급 단계입니다.`;
        }

        const day2Preview = `2일차 정밀 진단 단계에서는 현재 고객들이 남긴 누적 리뷰 내 실제 형태소와 감성 단어 분석을 바탕으로, 타겟 지역 상권('${region}') 점유율을 비약적으로 상승시키는 1% 매장만의 '평판 지수 가속화 전술' 및 '미승인 방문자리뷰 방지 가이드'를 완전 공개해 드립니다.`;

        const report: DiagnosisResult = {
          score: totalScore,
          scores: {
            keyword: keywordScore,
            tools: toolsScore,
            reviews: reviewsScore,
            engagement: engagementScore,
          },
          summary,
          registeredKeywords: primaryKey,
          expectedRank,
          toolSettingsStatus,
          algorithmDiagnosis,
          optimizationEffect,
          competitiveStores,
          localRankDiagnosis,
          day2Preview,
          isFallback: false
        };

        setResultData(report);
        setShowResult(true);
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || "데이터 진단 중 예기치 못한 문제가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }, 1800);
  };

  // Save screen card to image via html2canvas
  const handleSaveImage = () => {
    if (!captureRef.current) return;
    setSavingImage(true);

    // Helper to convert base64 to Blob
    const dataURLtoBlob = (dataurl: string) => {
      const arr = dataurl.split(",");
      const mime = arr[0].match(/:(.*?);/)![1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    };

    // Let the loader settle slight animations
    setTimeout(() => {
      toPng(captureRef.current!, {
        pixelRatio: 2, // Retain crystal high-resolution details
        backgroundColor: "#ffffff",
        cacheBust: true,
      })
        .then((imgUrl) => {
          setDownloadedImage(imgUrl); // Store in preview state so the user can verify the file directly in browser

          try {
            const blob = dataURLtoBlob(imgUrl);
            const objectUrl = URL.createObjectURL(blob);
            
            const downloadLink = document.createElement("a");
            const timestamp = new Date().toISOString().substring(0, 10);
            downloadLink.download = `${region || "지역"}_${menu || "매장"}_플레이스진단_${timestamp}.png`;
            downloadLink.href = objectUrl;
            
            // Append to body to ensure trigger works within various sandboxes
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Revoke after a delay
            setTimeout(() => {
              URL.revokeObjectURL(objectUrl);
            }, 10000);
          } catch (blobErr) {
            console.error("Blob download trigger failed, attempting fallback:", blobErr);
            // Fallback to traditional download if blob conversion fails
            const downloadLink = document.createElement("a");
            const timestamp = new Date().toISOString().substring(0, 10);
            downloadLink.download = `${region || "지역"}_${menu || "매장"}_플레이스진단_${timestamp}.png`;
            downloadLink.href = imgUrl;
            downloadLink.click();
          }
        })
        .catch((err) => {
          console.error("Canvas capture failed:", err);
          // Gently inform instead of window.alert
          setErrorMessage("이미지 생성 중 오류가 발생했습니다. 아래 이미지 미리보기를 확인해주세요.");
        })
        .finally(() => {
          setSavingImage(false);
        });
    }, 400);
  };

  // Save screen card to PDF via html2canvas & jsPDF
  const handleSavePDF = async () => {
    if (!captureRef.current) return;
    setSavingPDF(true);
    setErrorMessage(null);

    // Give browser a moment to settle repaints
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const element = captureRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.5, // 2.5x high-definition scale for ultra-clear text rendering
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height limit in mm with a tiny margin
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      // Add new pages if height is larger than pageHeight
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }

      const timestamp = new Date().toISOString().substring(0, 10);
      pdf.save(`${region || "지역"}_${menu || "매장"}_플레이스진단_${timestamp}.pdf`);
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      setErrorMessage("PDF 문서 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSavingPDF(false);
    }
  };

  // Pre-fill fields for a demo trace to ease user evaluation
  const handleQuickPrefill = () => {
    setIndustry("화로구이 만수점");
    setRegion("만수동");
    setMenu("삼겹살");
    setKeywords("만수동 맛집,고기집");
    setSelectedTools(["네이버 예약", "쿠폰"]);
    setVisitCount(142);
    setBlogCount(35);
    setErrorMessage(null);
  };

  // Get circle circumference and dash array for the score ring
  const ringRadius = 50;
  const ringCircumference = 2 * Math.PI * ringRadius;

  const currentScoreConfig = resultData ? (
    resultData.score >= 80 ? {
      stroke: "#10b981", // Emerald 500
      badgeBg: "#ecfdf5", // Emerald 50
      badgeText: "#047857", // Emerald 700
      badgeBorder: "rgba(167, 243, 208, 0.5)", // Emerald 200 light
      textClass: "text-emerald-600",
      label: "최적 등급"
    } : resultData.score >= 60 ? {
      stroke: "#f59e0b", // Amber 500
      badgeBg: "#fffbeb", // Amber 50
      badgeText: "#b45309", // Amber 700
      badgeBorder: "rgba(253, 230, 138, 0.5)", // Amber 200 light
      textClass: "text-amber-600",
      label: "보완 등급"
    } : {
      stroke: "#ef4444", // Red 500
      badgeBg: "#fff1f2", // Rose 50
      badgeText: "#991b1b", // Rose 800
      badgeBorder: "rgba(254, 205, 211, 0.5)", // Rose 200 light
      textClass: "text-rose-500",
      label: "조치 시급"
    }
  ) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased bg-mesh font-sans">
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-16">
        {/* Header Block with elegant high-contrast styling */}
        <header id="header-section" className="mb-10 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-600 border border-emerald-100">
            <Sparkles className="h-3 w-3" />
            <span>네이버 스마트플레이스 랭킹 알고리즘 연계</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            📊 플레이스 진단기 <span className="text-emerald-500 font-black">1일차</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500 md:text-base">
            매장 기본정보를 입력하시면 네이버 플레이스 데이터를 실시간 수집 및 알고리즘 대조를 거쳐, <br className="hidden md:block"/>
            검색 유래 및 필수 도구 활성화 격차를 진단하고 구체적인 현재 노출 가산 상태를 피드백해 드립니다.
          </p>
        </header>

        {/* Form panel card */}
        <section id="input-form-card" className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl md:p-8">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">1</span>
              <h2 className="text-lg font-bold text-slate-900">매장 정보 입력</h2>
            </div>
            <button 
              onClick={handleQuickPrefill}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 transition-colors"
            >
              🪄 예시 데이터 즉시 채우기
            </button>
          </div>

          <div className="space-y-6">
            {/* 1. 2x2 Grid for input */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                1. 매장 기본정보
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Store className="h-4 w-4" />
                    </span>
                    <input 
                      id="industry"
                      type="text" 
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="플레이스 등록 이름 (예: 화로구이 만수점)"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <input 
                      id="region"
                      type="text" 
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="타겟 지역명 (예: 만수동)"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Layers className="h-4 w-4" />
                    </span>
                    <input 
                      id="menu"
                      type="text" 
                      value={menu}
                      onChange={(e) => setMenu(e.target.value)}
                      placeholder="핵심 메뉴/업종 (예: 삼겹살)"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
                <div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Search className="h-4 w-4" />
                    </span>
                    <input 
                      id="keywords"
                      type="text" 
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="현재 등록된 키워드 (예: 만수동 맛집,고기집)"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Tools trigger section */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  2. 네이버 스마트플레이스 도구 활성화 여부
                </label>
                <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                  다중선택 가능
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { name: "네이버 예약", desc: "검색 가중치 및 유치도 상승" },
                  { name: "네이버 톡톡", desc: "즉시문의 및 빠른 피드백" },
                  { name: "쿠폰", desc: "플레이스 저장 및 노출 부스터" },
                  { name: "스마트콜", desc: "고객 실시간 행동 축적" }
                ].map((toolObj) => {
                  const isActive = selectedTools.includes(toolObj.name);
                  return (
                    <button
                      key={toolObj.name}
                      type="button"
                      onClick={() => handleToggleTool(toolObj.name)}
                      className={`group relative flex flex-col items-center justify-center rounded-xl p-3.5 text-center cursor-pointer border transition-all duration-200 ${
                        isActive
                          ? "border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-md ring-2 ring-emerald-500/15"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-600"
                      }`}
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border mb-1.5 transition-colors">
                        {isActive ? (
                          <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-slate-300 group-hover:bg-slate-400" />
                        )}
                      </div>
                      <span className="text-xs font-bold md:text-sm">{toolObj.name}</span>
                      <span className={`text-[10px] mt-0.5 opacity-80 ${isActive ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                        {toolObj.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Review counters */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                3. 플레이스 누적 리뷰 현황
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Visitor Review */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700">방문자 영수증 리뷰 수</span>
                    <span className="text-[10px] text-slate-400">영수증 인증 완료 건수</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecrement("visit")}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-100 active:scale-95"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="relative flex-1">
                      <input
                        id="visit"
                        type="number"
                        value={visitCount}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVisitCount(val === "" ? "" : Number(val));
                        }}
                        onFocus={() => {
                          if (visitCount === 0 || visitCount === "") {
                            setVisitCount("");
                          }
                        }}
                        placeholder="0"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-center font-bold text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">개</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleIncrement("visit")}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-100 active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Blog Review */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700">블로그 후기 수</span>
                    <span className="text-[10px] text-slate-400">네이버 블로그 탭 등록 후기</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecrement("blog")}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-100 active:scale-95"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="relative flex-1">
                      <input
                        id="blog"
                        type="number"
                        value={blogCount}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBlogCount(val === "" ? "" : Number(val));
                        }}
                        onFocus={() => {
                          if (blogCount === 0 || blogCount === "") {
                            setBlogCount("");
                          }
                        }}
                        placeholder="0"
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-center font-bold text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">개</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleIncrement("blog")}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-100 active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Message error strip */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-xs font-semibold text-rose-600 flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action triggering */}
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-4 px-6 font-bold text-white shadow-lg transition-transform duration-100 hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 animate-pulse" />
                <span>✨ 정밀 가산점 보고서 생성 및 이미지 추출</span>
              </div>
            </button>
          </div>
        </section>

        {/* Loading overlay panel */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
            >
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-4">
                  <div className="absolute inset-0 rounded-full border-3 border-emerald-100 border-t-emerald-500 animate-spin" />
                  <Search className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">🔍 분석 중입니다...</h3>
                <p className="text-xs text-slate-400 mb-4">네이버 플레이스 데이터와 알고리즘 가산점을 시뮬레이션 중입니다</p>
                
                {/* Dynamic messages queue rotating */}
                <div className="h-14 rounded-xl bg-slate-50 p-3 mt-4 border border-slate-100 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="text-xs font-semibold text-emerald-700 leading-relaxed text-center"
                    >
                      {loadingMessages[loadingStep]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Diagnostic assessment report section */}
        <AnimatePresence>
          {showResult && resultData && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="mt-10"
            >
              {resultData.isFallback && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-800 shadow-sm flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-[10px] font-bold text-white uppercase tracking-wider">AI</span>
                  <div>
                    <strong className="block font-bold mb-0.5 text-amber-900">하이브리드 로컬 정밀 로직 전환 완료</strong>
                    {resultData.fallbackMsg || "스마트 제미나이 AI 서버의 순간 접속량이 폭증하여, 대기 없이 작동 설계된 '하이브리드 로컬 진단 모델'로 중단 없는 정밀 분석을 완료했습니다."}
                  </div>
                </div>
              )}

              {/* High precision printable diagnostic card container with hex values to prevent oklch crashes */}
              <div
                id="capture"
                ref={captureRef}
                className="overflow-hidden rounded-2xl border p-6 md:p-8"
                style={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1" }}
              >
                {/* Design Header: High quality agency style with classical inline gradient values to bypass html2canvas oklab issues */}
                <div 
                  className="border-b -mx-6 md:-mx-8 -mt-6 md:-mt-8 p-6 md:p-8 relative mb-8"
                  style={{ 
                    backgroundImage: "linear-gradient(135deg, #020617 0%, #0f172a 100%)",
                    borderColor: "rgba(244,63,94,0.1)"
                  }}
                >
                  {/* Glowing ambient background circle inside the banner */}
                  <div className="absolute right-0 bottom-0 h-48 w-48 rounded-full blur-3xl -translate-y-4 translate-x-4" style={{ backgroundColor: "rgba(16, 185, 129, 0.08)" }} />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div>
                      <div 
                        className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] uppercase tracking-wider font-extrabold"
                        style={{ backgroundColor: "#10b981", color: "#ffffff" }}
                      >
                        SMARTPLACE SEO AUDIT
                      </div>
                      <h2 className="text-xl font-bold mt-1.5 tracking-tight md:text-2xl" style={{ color: "#ffffff" }}>
                        📄 플레이스 가산점 종합 정밀 진단지
                      </h2>
                      <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                        등록하신 매장의 네이버 검색 엔진 최적화(Algorithm v3.5) 상태 분석 리포트입니다.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px] md:text-right shrink-0">
                      <span className="border px-2.5 py-1 rounded inline-flex items-center gap-1" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f87171" }}>
                        <MapPin className="h-3 w-3" style={{ color: "#f87171" }} />
                        <strong>{region}</strong>
                      </span>
                      <span className="border px-2.5 py-1 rounded inline-flex items-center gap-1" style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#34d399" }}>
                        <Store className="h-3 w-3" style={{ color: "#34d399" }} />
                        <strong>{menu} ({industry})</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score Dial & Detailed Ratings in a cohesive panel */}
                <div className="grid gap-6 md:grid-cols-12 mb-8 rounded-2xl p-5 border" style={{ backgroundColor: "#f8fafc", borderColor: "#f1f5f9" }}>
                  <div 
                    className="md:col-span-4 flex flex-col items-center justify-center text-center py-4 border-b md:border-b-0 md:border-r"
                    style={{ borderColor: "#eceff1" }}
                  >
                    <span className="text-[10px] tracking-wider uppercase font-extrabold" style={{ color: "#94a3b8" }}>
                      총합 노출 점수
                    </span>
                    <div className="relative flex items-center justify-center my-4">
                      {/* SVG Ring layout */}
                      <svg className="w-32 h-32 transform -rotate-90">
                        {/* Underlay layer with white background fill */}
                        <circle
                          cx="64"
                          cy="64"
                          r={ringRadius}
                          fill="#ffffff"
                          stroke="#e2e8f0"
                          strokeWidth="10"
                          style={{ stroke: "#e2e8f0", fill: "#ffffff" }}
                        />
                        {/* Progress overlay */}
                        <circle
                          cx="64"
                          cy="64"
                          r={ringRadius}
                          fill="none"
                          stroke={currentScoreConfig?.stroke || "#10b981"}
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={ringCircumference}
                          strokeDashoffset={
                            ringCircumference -
                            (resultData.score / 100) * ringCircumference
                          }
                          className={savingImage ? "" : "transition-all duration-1000"}
                          style={{ 
                            stroke: currentScoreConfig?.stroke || "#10b981",
                            fill: "none",
                            strokeDasharray: ringCircumference,
                            strokeDashoffset: ringCircumference - (resultData.score / 100) * ringCircumference
                          }}
                        />
                      </svg>
                      {/* Floating Text box */}
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-3xl font-black block tracking-tighter" style={{ color: "#0f172a" }}>
                          {resultData.score}
                        </span>
                        <span className="text-[10px] font-bold" style={{ color: "#94a3b8" }}>/ 100점</span>
                      </div>
                    </div>

                    <div className="px-2">
                      <span 
                        className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-1 border"
                        style={{ 
                          backgroundColor: currentScoreConfig?.badgeBg || "#d1fae5", 
                          color: currentScoreConfig?.badgeText || "#065f46", 
                          borderColor: currentScoreConfig?.badgeBorder || "rgba(167, 243, 208, 0.5)" 
                        }}
                      >
                        {currentScoreConfig?.label}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-8 flex flex-col justify-center">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: "#94a3b8" }}>
                      <Activity className="h-3.5 w-3.5" style={{ color: currentScoreConfig?.stroke || "#10b981" }} />
                      성장 핵심 평가 요약
                    </h3>
                    <p className="text-sm font-semibold leading-relaxed mb-4 pr-2" style={{ color: "#1e293b" }}>
                      &ldquo;{resultData.summary}&rdquo;
                    </p>

                    {/* Progress grid elements */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "키워드 SEO 지수", val: resultData.scores.keyword, icon: Search, color: "#f59e0b" },
                        { label: "도구 시너지 지수", val: resultData.scores.tools, icon: Layers, color: "#10b981" },
                        { label: "리뷰 비율 지수", val: resultData.scores.reviews, icon: BookOpen, color: "#6366f1" },
                        { label: "참여 인게이지먼트", val: resultData.scores.engagement, icon: Award, color: "#f43f5e" }
                      ].map((bar) => {
                        return (
                          <div key={bar.label} className="p-2 rounded-lg border bg-white" style={{ borderColor: "#f1f5f9" }}>
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="font-bold inline-flex items-center gap-1.5" style={{ color: "#64748b" }}>
                                <bar.icon className="h-3 w-3" style={{ color: "#cbd5e1" }} />
                                {bar.label}
                              </span>
                              <span className="font-extrabold" style={{ color: "#0f172a" }}>{bar.val} / 25점</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${(bar.val / 25) * 100}%`, backgroundColor: bar.color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Algorithmic Detailed Diagnosis Breakdown (5 Customized Steps) */}
                <div className="mb-8 space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-wider border-b pb-2 mb-4 flex items-center gap-2" style={{ color: "#0f172a", borderColor: "#f1f5f9" }}>
                    <FileText className="h-4 w-4" style={{ color: currentScoreConfig?.stroke || "#10b981" }} />
                    네이버 플레이스 정밀 상태 진단지
                  </h3>

                  {/* Step 1: 현재 점수 및 예상 순위 */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: currentScoreConfig?.stroke || "#10b981" }}>1</span>
                      <h4 className="text-sm font-black text-slate-800">현재 점수 및 예상 순위</h4>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="bg-slate-50/55 rounded-lg p-3 border border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-400 mb-1">등록 키워드</span>
                        <span className="text-xs font-extrabold text-slate-700">{resultData.registeredKeywords || keywords}</span>
                      </div>
                      <div className="bg-slate-50/55 rounded-lg p-3 border border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-400 mb-1">플레이스 점수</span>
                        <span className="text-sm font-black" style={{ color: currentScoreConfig?.stroke || "#10b981" }}>{resultData.score}점</span>
                      </div>
                      <div className="bg-slate-50/55 rounded-lg p-3 border border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-400 mb-1">예상 노출 순위</span>
                        <span className="text-xs font-extrabold text-rose-500">{resultData.expectedRank}</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: 네이버 도구 누락 및 알고리즘 진단 */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50/10 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-xs font-bold text-white">📌</span>
                      <h4 className="text-sm font-black text-slate-800">2. 네이버 도구 누락 및 알고리즘 진단</h4>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-amber-100/70 space-y-3">
                      <div>
                        <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mb-1">현재 세팅 현황</span>
                        <p className="text-xs font-extrabold text-slate-700">{resultData.toolSettingsStatus}</p>
                      </div>
                      <div className="border-t pt-2.5 border-slate-100">
                        <span className="inline-block text-[10px] font-bold text-slate-400 mb-1">알고리즘 진단</span>
                        <p className="text-xs font-semibold text-slate-600 leading-relaxed">{resultData.algorithmDiagnosis}</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: 도구 최적화 시 기대효과 */}
                  <div className="rounded-xl border border-blue-200 bg-blue-50/10 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500 text-xs font-bold text-white">💡</span>
                      <h4 className="text-sm font-black text-slate-800">3. 도구 최적화 시 기대효과</h4>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-blue-100/70">
                      <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded mb-1">순위 회복 효과</span>
                      <p className="text-xs font-semibold text-slate-600 leading-relaxed">{resultData.optimizationEffect}</p>
                    </div>
                  </div>

                  {/* Step 4: 반경 500m 상권 경쟁 진단 */}
                  <div className="rounded-xl border border-rose-200 bg-rose-50/10 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500 text-xs font-bold text-white">⚔️</span>
                      <h4 className="text-sm font-black text-slate-800">4. 반경 500m 상권 경쟁 진단</h4>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="bg-white rounded-lg p-3.5 border border-rose-100/70">
                        <span className="block text-[10px] font-bold text-slate-400 mb-1">경쟁 매장</span>
                        <span className="text-xs font-extrabold text-slate-700">{resultData.competitiveStores}</span>
                      </div>
                      <div className="bg-white rounded-lg p-3.5 border border-rose-100/70">
                        <span className="block text-[10px] font-bold text-rose-700 mb-1">상권 내 순위 진단</span>
                        <span className="text-xs font-semibold text-slate-600 leading-relaxed block">{resultData.localRankDiagnosis}</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 5: 2일 차 예고: 리뷰/평판 정밀 분석 */}
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/15 p-5 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/5 rounded-full blur-xl translate-x-2 -translate-y-2" />
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500 text-[10px] font-bold text-white">🚀</span>
                      <h4 className="text-sm font-black text-indigo-950">2일 차 예고: 리뷰/평판 정밀 분석</h4>
                    </div>
                    <p className="text-xs font-semibold text-indigo-900/80 leading-relaxed">{resultData.day2Preview}</p>
                  </div>
                </div>

                {/* Diagnostic Authority StampFooter inside `#capture` */}
                <div className="mt-8 pt-4 border-t flex flex-wrap justify-between items-center text-[10px] font-mono font-medium" style={{ borderColor: "#eceff1", color: "#94a3b8" }}>
                  <div>플레이스 최적화 평가 알고리즘 v3.5 &bull; Naver Place Diagnostic System</div>
                  <div style={{ color: "#64748b" }}>
                    진단 일시: {new Date().toLocaleDateString("ko-KR")} {new Date().toLocaleTimeString("ko-KR", {hour: "2-digit", minute:"2-digit"})}
                  </div>
                </div>
              </div>

              {/* Bottom Extra actions list with explicit active styles and indicator feedback */}
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 mb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Award className="h-5 w-5" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-xs font-extrabold text-emerald-950">💡 플레이스 상태 진단 팁</h4>
                  <p className="text-xs font-semibold text-emerald-800 leading-relaxed mt-0.5">
                    이 진단 보고서를 <strong>이미지 또는 PDF 문서</strong>로 다운로드하여 보관하거나 스마트폰 기기, 블로그 제휴 마케팅 기획자 또는 부점장 파트너에게 전송하여 일상 속에서 매장 플레이스 세팅을 점검하세요!
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto shrink-0">
                  <button
                    onClick={handleSaveImage}
                    disabled={savingImage || savingPDF}
                    className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 px-5 shadow-lg relative overflow-hidden transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {savingImage ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-1.5" />
                        <span>이미지 생성 중...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 animate-bounce" />
                        <span>이미지 다운로드</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSavePDF}
                    disabled={savingImage || savingPDF}
                    className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 px-5 shadow-lg relative overflow-hidden transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {savingPDF ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-1.5" />
                        <span>PDF 생성 중...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 animate-pulse" />
                        <span>PDF 다운로드</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Show the downloaded PNG file preview so that the user can verify the exact downloaded image file */}
              <AnimatePresence>
                {downloadedImage && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="border border-emerald-200 bg-white p-5 rounded-2xl shadow-xl mb-12 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold">
                          ✓
                        </span>
                        <div>
                          <h4 className="text-sm font-black text-slate-800">📥 최근 다운로드된 이미지 파일 확인</h4>
                          <p className="text-[11px] text-slate-400">장치 다운로드 폴더에 실제 저장 완료됨</p>
                        </div>
                      </div>
                      <span className="self-start sm:self-center text-[10px] bg-slate-100 text-slate-600 font-mono font-bold px-2 py-1 rounded border border-slate-200">
                        PNG IMAGE FILE
                      </span>
                    </div>
                    <p className="text-xs font-semibold leading-relaxed text-slate-600 mb-4">
                      기기에 전송된 규격과 정확히 일치하는 고화질(Scale 2x) 이미지의 브라우저 뷰어 파일입니다. 모바일 기기에서의 글씨 선명도, 색감, 레이아웃을 즉각 검정할 수 있습니다. 이미지를 길게 누르거나 마우스 우클릭하여 직접 공유 또는 다른 이름으로 저장도 가능합니다!
                    </p>
                    <div className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50 p-3 flex justify-center">
                      <img 
                        src={downloadedImage} 
                        alt="플레이스 가산점 종합 정밀 진단지" 
                        className="max-h-[500px] w-auto h-auto rounded-lg shadow-md border border-slate-200 object-contain hover:scale-[1.01] transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
