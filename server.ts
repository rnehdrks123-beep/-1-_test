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

// 1. API Route first
app.post("/api/analyze", async (req, res) => {
  try {
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

    const ai = getGeminiClient();

    // Construct precise prompt tailored to Naver SmartPlace SEO algorithm:
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
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
    
    // Safety check to enforce <= 40 points constraint in backend:
    if (diagnosis.score > 40) {
      diagnosis.score = Math.floor(Math.random() * 15) + 12; // Force to 12-26 points
    }
    
    return res.json(diagnosis);
  } catch (error: any) {
    console.error("Diagnosis error:", error);
    return res.status(500).json({
      error: error.message || "플레이스 데이터 분석 중 오류가 발생했습니다.",
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
