export interface StoreInfo {
  industry: string;
  region: string;
  menu: string;
  keywords: string;
  tools: string[];
  visitCount: number;
  blogCount: number;
}

export interface ScoreBreakdown {
  keyword: number;
  tools: number;
  reviews: number;
  engagement: number;
}

export interface DiagnosisResult {
  score: number; // strictly <= 40
  scores: ScoreBreakdown;
  summary: string;
  
  // 1. 현재 점수 및 예상 순위
  registeredKeywords: string;
  expectedRank: string;
  
  // 2. 네이버 도구 누락 및 알고리즘 진단
  toolSettingsStatus: string; // e.g., "예약(미등록), 톡톡(미등록)..."
  algorithmDiagnosis: string;
  
  // 3. 도구 최적화 시 기대효과
  optimizationEffect: string;
  
  // 4. 반경 500m 상권 경쟁 진단
  competitiveStores: string; // e.g., "약 60개"
  localRankDiagnosis: string;
  
  // 5. 2일 차 예고: 리뷰/평판 정밀 분석
  day2Preview: string;

  // Hybrid failover metrics
  isFallback?: boolean;
  fallbackMsg?: string;
}
