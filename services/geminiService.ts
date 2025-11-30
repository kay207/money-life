import { GoogleGenAI, Type } from "@google/genai";
import { GoalContext, GoalAnalysisResult, GoalType } from "../types";

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } else {
    console.warn("WealthWisdom: No API_KEY found. Running in offline mode.");
  }
} catch (e) {
  console.warn("WealthWisdom: Failed to initialize AI client.", e);
}

export const streamChatResponse = async function* (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string
) {
  if (!ai) {
    yield "系统提示：当前未配置 AI 服务密钥，无法进行智能对话。请联系管理员或使用页面上的计算工具。";
    return;
  }

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "You are a helpful financial advisor.",
      },
      history: history,
    });

    const result = await chat.sendMessageStream({ message: newMessage });

    for await (const chunk of result) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Chat Error:", error);
    yield "网络连接不稳定，请稍后再试。";
  }
};

/**
 * Generate a rule-based analysis when AI is not available.
 */
const generateOfflineAnalysis = (ctx: GoalContext): GoalAnalysisResult => {
  const isAchievable = ctx.isAchievable;
  const gap = Math.abs(ctx.projectedAmount - ctx.requiredAmount);
  const gapInWan = (gap / 10000).toFixed(1);
  const percent = Math.min((ctx.projectedAmount / ctx.requiredAmount) * 100, 100).toFixed(0);

  let evaluation = "";
  let summary = "";
  let suggestions: string[] = [];
  let riskWarning = "";

  if (isAchievable) {
    evaluation = "方案可行";
    summary = `恭喜！基于当前的规划，预计达成率为 ${percent}%。复利效应正在为您工作，您的储蓄和收益足以覆盖未来的目标。`;
    suggestions = [
      "保持当前的储蓄习惯，不要轻易中断。",
      "定期（每年）复盘一次资产状况。",
      "如果市场表现好于预期，多出的资金可用于建立风险备用金。"
    ];
    riskWarning = "达成率基于假设的固定收益率，需警惕市场波动导致实际收益不及预期的风险。";
  } else {
    // Logic for failure scenarios
    if (Number(percent) < 50) {
      evaluation = "难度极大";
      summary = `目前的资金缺口较大（约 ¥${gapInWan}万），仅靠当前的投入很难达成目标，需要进行大刀阔斧的调整。`;
      suggestions = [
        "大幅增加每月储蓄额（建议开源节流）。",
        "考虑降低目标金额，或推迟实现目标的时间。",
        "学习理财知识，在风险可控的前提下寻求更高收益的资产。"
      ];
    } else {
      evaluation = "需调整";
      summary = `非常接近了！预计达成率 ${percent}%，还差 ¥${gapInWan}万。只需稍作调整即可达标。`;
      suggestions = [
        `尝试将每月储蓄额增加 10% - 20%。`,
        `如果可能，将目标实现时间推迟 ${ctx.type === GoalType.PURCHASE ? '1-2年' : '几年'}。`,
        "检查是否有闲置资产可以投入以增加初始本金。"
      ];
    }
    riskWarning = "为了追求弥补缺口而盲目追求高收益产品，可能会导致本金亏损，请务必注意风险匹配。";
  }

  return { evaluation, summary, suggestions, riskWarning };
};

export const analyzeFinancialGoal = async (ctx: GoalContext): Promise<GoalAnalysisResult> => {
  // 1. If Offline (No API Key or Explicitly disabled), use Rule Engine
  if (!ai) {
    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    return generateOfflineAnalysis(ctx);
  }

  // 2. If Online, try calling Gemini
  const goalTypeStr = ctx.type === GoalType.PURCHASE ? "Major Purchase (e.g., House/Car)" : "Retirement/FIRE";
  
  const prompt = `
    Analyze this financial goal scientifically.
    
    Context:
    - Goal Type: ${goalTypeStr}
    - Current Assets: ¥${ctx.currentPrincipal}
    - Monthly Savings: ¥${ctx.monthlySavings}
    - Expected Annual Return: ${ctx.expectedReturnRate}%
    - Target Amount Needed: ¥${ctx.requiredAmount}
    - Projected Amount (Calculated): ¥${ctx.projectedAmount}
    - Is Achievable via math: ${ctx.isAchievable ? "YES" : "NO"}
    ${ctx.type === GoalType.PURCHASE ? `- Years to Goal: ${ctx.yearsToGoal}` : ''}
    ${ctx.type === GoalType.RETIREMENT ? `- Desired Monthly Passive Income: ¥${ctx.targetMonthlyExpense}` : ''}

    Task:
    Provide actionable advice. If the goal is not achievable, suggest specific ways to close the gap.
    
    Output JSON strictly matching the schema.
    Translate response to Chinese.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            evaluation: { 
              type: Type.STRING, 
              description: "Short verdict like '极佳', '稳健', '有挑战', '需调整'" 
            },
            summary: { type: Type.STRING, description: "Analysis of the gap or success factor" },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-4 concrete steps"
            },
            riskWarning: { type: Type.STRING, description: "What could go wrong?" }
          },
          required: ["evaluation", "summary", "suggestions", "riskWarning"],
          propertyOrdering: ["evaluation", "summary", "suggestions", "riskWarning"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as GoalAnalysisResult;

  } catch (error) {
    console.warn("Gemini API call failed, falling back to offline rule engine.", error);
    return generateOfflineAnalysis(ctx);
  }
};