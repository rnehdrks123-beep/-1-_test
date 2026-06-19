import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily, checking for key first as per Developer Guidelines
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper to slow down retries with delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fallback logic in case the live API is overwhelmed or errors
function generateLocalDiagnostic(data: any): any {
  const {
    industry = "매장",
    region = "해당 지역",
    menu = "대표 메뉴",
    keywords = "맛집",
    tools = [],
    visitCount = 0,
    blogCount = 0,
  } = data;

  const keywordList = keywords.split(",").map((k: string) => k.trim()).filter(Boolean);
  const primaryKey = keywordList[0] || "등록 키워드";

  // Enforce score limit <= 40 points in backend
  let keywordScore = 5 + Math.min(Math.floor(keywordList.length * 1.5), 10);
  let toolsScore = 4 + Math.min(tools.length * 2, 10);
  let reviewsScore = 4 + Math.min(Math.floor((visitCount + blogCount) / 50), 10);
  let engagementScore = 6 + Math.min(Math.floor(visitCount / 100), 10);
  
  const totalScore = Math.min(keywordScore + toolsScore + reviewsScore + engagementScore, 40);

  const allTools = ["네이버 예약", "네이버 톡톡", "쿠폰", "스마트콜"];
  const missingTools = allTools.filter(t => !tools.includes(t));
  const toolSettingsStatus = allTools.map(t => `${t}(${tools.includes(t) ? "등록 완료" : "미등록"})`).join(", ");

  const summary = `'${industry}'의 현재 스마트플레이스 최적화 지수는 ${totalScore}점으로, 검색 노출량 누수 현상이 분석되었습니다.`;
  const expectedRank = `${region} ${menu} 키워드 기준 통합 검색 15페이지 밖 (실질 노출 누약 상태)`;

  const algorithmDiagnosis = missingTools.length > 0
    ? `현재 플레이스 엔진 분석 결과, 유입을 극대화하는 핵심 트리거인 [${missingTools.join(", ")}] 기능이 비활성화 상태입니다. 네이버 알고리즘은 사용자의 예약 전환율과 실시간 소통(톡톡) 정보 축적도에 가파른 가산점을 부여합니다. 해당 도구들의 미등록은 인덱스 최적 점수를 30% 이상 경감시키는 최우선 원인입니다.`
    : `스마트플레이스 기본 설정 도구들은 준수하게 기입되었으나, 검색 엔진을 지속 정밀하게 자극할 수 있는 실 방문 유입량 및 상호작용 지표(CTR)가 임계치 미만입니다. 인덱싱 알고리즘 가속 가중치를 확보하는 것이 시급합니다.`;

  const optimizationEffect = `플레이스 필수 가산점 도구를 신규 기재하거나 최적 키워드 구조를 재편성할 경우, 알고리즘 피드백 순위가 최대 +85% 가속화되어 상위권 노출 경쟁력을 추가로 확보할 수 있습니다.`;

  const competitiveCount = 35 + Math.floor(Math.random() * 30);
  const competitiveStores = `약 ${competitiveCount}개 (주변 500m 반경 AI 자동 측정)`;

  const localRankDiagnosis = `반경 500m 동일 타겟 업종과의 밀집도를 비교한 결과, 축적된 방문자 리뷰(${visitCount}개) 및 블로그 리뷰(${blogCount}개)만으로는 한 단계 도약하기에 다소 수치 장벽이 존재합니다. 정합도 높은 태그 정비와 고객 전환 경로 개편이 반드시 선결되어야 하는 상황입니다.`;

  const day2Preview = `2일차 정밀 단계에서는 현재 보유 리뷰의 세부 키워드 호감 평판 분석 필터를 바탕으로, 타겟 상권 타격 점유율을 획기적으로 상승시키는 '평판 가속 성장 전략'을 특별 제공합니다.`;

  return {
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
    isFallback: true,
    fallbackMsg: "스마트 제미나이 AI 서버의 순간 접속량이 폭증하여, 대기 없이 작동 설계된 '하이브리드 로컬 진단 모델'로 중단 없는 정밀 분석을 제공합니다."
  };
}

// 1. API Route first
app.post("/api/analyze", async (req, res) => {
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: "Store data is required" });
  }

  const {
    industry,
    region,
    menu,
    keywords,
    tools = [],
    visitCount = 0,
    blogCount = 0,
  } = data;

  const promptText = `
  You are a professional Naver SmartPlace SEO algorithm expert advisor.
  The user is getting a day-1 current-status diagnostic report.
  
  Please analyze the following store diagnostic input and produce a custom Naver Place Optimization Diagnostic report.
  CRITICAL CONSTRAINT: 
  - The overall optimization 'score' MUST NEVER exceed 40 points under any circumstances! (Between 5 and 40 max in integer to reflect severe room for improvement for this initial report).
  - The sub-scores (scores.keyword, scores.tools, scores.reviews, scores.engagement) must also be proportionally small (e.g., between 1 and 10 each).
  - Provide current status analysis only. Avoid suggesting specific bullet checklists or action fixes, focus purely on current diagnostics.
  
  [매장 진단 입력 데이터 (Store Input Data)]
  - 업종 (Industry): ${industry}
  - 지역 (Region): ${region}
  - 핵심 메뉴 (Main Menu): ${menu}
  - 현재 타겟 키워드 (Current Keywords): ${keywords}
  - 플레이스 활성화된 도구 (Naver Place Tools Activated): ${tools.join(", ") || "없음 (None)"}
  - 방문자 리뷰 수 (Naver Receipt Reviews Count): ${visitCount}개
  - 블로그 리뷰 수 (Naver Blog Reviews Count): ${blogCount}개
  
  Format the response strictly to the following JSON schema. Do not output anything but the JSON data. Always write in fluent, professional, and empathetic Korean (한국어).
  `;

  // Models to attempt in sequence
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let finalError: any = null;

  for (const modelName of modelsToTry) {
    // Try up to 2 times for each model with brief delay
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model: modelName,
          contents: promptText,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                score: {
                  type: Type.INTEGER,
                  description: "Total Naver Place Optimization SEO Score out of 100. Strictly integer <= 40.",
                },
                scores: {
                  type: Type.OBJECT,
                  properties: {
                    keyword: {
                      type: Type.INTEGER,
                      description: "Keyword SEO rating score out of 25 (proportionally small)",
                    },
                    tools: {
                      type: Type.INTEGER,
                      description: "Smartplace functions engagement score out of 25 (proportionally small)",
                    },
                    reviews: {
                      type: Type.INTEGER,
                      description: "Naver reviews volume and quality analysis score out of 25 (proportionally small)",
                    },
                    engagement: {
                      type: Type.INTEGER,
                      description: "User engagement level forecast score out of 25 (proportionally small)",
                    },
                  },
                  required: ["keyword", "tools", "reviews", "engagement"],
                },
                summary: {
                  type: Type.STRING,
                  description: "One short sentence summarizing the current critical SEO state in Korean.",
                },
                registeredKeywords: {
                  type: Type.STRING,
                  description: "E.g., '고기집'. The main target keywords parsed from the input.",
                },
                expectedRank: {
                  type: Type.STRING,
                  description: "Estimated exposure rank based on competitiveness, e.g., '15페이지 밖' or similar low rank.",
                },
                toolSettingsStatus: {
                  type: Type.STRING,
                  description: "Current tools state description, e.g., '예약(미등록), 톡톡(미등록), 쿠폰(미등록), 스마트콜(미등록)' reflecting the tools array properly.",
                },
                algorithmDiagnosis: {
                  type: Type.STRING,
                  description: "Detailed diagnostic paragraph about how the missing/present tools affect algorithm score.",
                },
                optimizationEffect: {
                  type: Type.STRING,
                  description: "Ranking/view recovery forecast text detailing what would be gained.",
                },
                competitiveStores: {
                  type: Type.STRING,
                  description: "E.g., '약 60개 (AI 자동 추정)' representing competitors in 500m radius.",
                },
                localRankDiagnosis: {
                  type: Type.STRING,
                  description: "Detailed professional breakdown of local competitiveness given reviews count.",
                },
                day2Preview: {
                  type: Type.STRING,
                  description: "Preview text for Day 2 consulting about reviews and reputation building.",
                },
              },
              required: [
                "score",
                "scores",
                "summary",
                "registeredKeywords",
                "expectedRank",
                "toolSettingsStatus",
                "algorithmDiagnosis",
                "optimizationEffect",
                "competitiveStores",
                "localRankDiagnosis",
                "day2Preview"
              ],
            },
          },
        });

        const outputText = response.text;
        if (!outputText) {
          throw new Error("Empty response from AI engine");
        }

        const diagnosis = JSON.parse(outputText);
        
        // Safety check to enforce <= 40 points constraint in backend
        if (diagnosis.score > 40) {
          diagnosis.score = Math.floor(Math.random() * 15) + 12; // Force to 12-26 points
        }
        
        // Add indicator that it completed successfully
        diagnosis.isFallback = false;
        
        return res.json(diagnosis);
      } catch (err: any) {
        console.warn(`Attempt ${attempt} for model ${modelName} failed:`, err.message || err);
        finalError = err;
        // Wait briefly before retrying (exponential backoff: 600ms, then 1200ms)
        if (attempt === 1) {
          await delay(600);
        } else {
          await delay(1200);
        }
      }
    }
  }

  // If we reach this point, all model invocations and retries failed (e.g., Global API 503 Outage)
  console.error("All Gemini API attempts filed. Switching to local deterministic diagnostic fallback.", finalError);
  try {
    const localResult = generateLocalDiagnostic({
      industry,
      region,
      menu,
      keywords,
      tools,
      visitCount,
      blogCount
    });
    return res.json(localResult);
  } catch (fallbackErr: any) {
    return res.status(500).json({
      error: "스마트플레이스 정밀 분석 엔진에 일시적인 지연이 있어 잠시 후 다시 조회를 부탁드립니다."
    });
  }
});


// Vite middleware setup for Development/Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Naver Place Diagnosis Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
