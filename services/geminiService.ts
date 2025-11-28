import { GoogleGenAI } from "@google/genai";
import { CalculationResult } from "../types";
import { format } from "date-fns";

export const generateLeaveExplanation = async (result: CalculationResult): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key not configured.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemPrompt = `
    You are an expert HR assistant in Taiwan. 
    Your task is to draft a polite, clear, and professional notification message to an employee regarding their annual leave (特休).
    Use Traditional Chinese (繁體中文).
    
    Context:
    The company uses the **Calendar Year System (曆年制 - 結算制)**.
    Meaning: Leave granted on Jan 1st is calculated based on service in the **Previous Calendar Year** only.
    
    Legal Entitlement Ladder used for Rate:
    - 0 ~ 1 year: Uses 7 days rate for proportional calc (Company Policy/User Request).
    - 1 year ~ 2 years: 7 days
    - 2 years ~ 3 years: 10 days
    - 3 years ~ 5 years: 14 days
    - 5 years ~ 10 years: 15 days
    - 10+ years: 15 + 1/yr (max 30)

    Logic Explanation for the Employee:
    1. **6-Month Bonus**: 3 days granted immediately upon reaching 6 months.
    2. **Annual Settlement**: On Jan 1st, we calculate the proportion of the *previous year* you worked. 
       - Example: On Jan 1, 2025, we give leave based on how many days you worked in 2024.
       - Formula: (Days worked in prev year / 365) * Applicable Rate.
    
    Output Format:
    - Greeting
    - Summary of current status (Onboard date, Tenure)
    - **6 Month Entitlement** (Specific date and days)
    - **Jan 1st Entitlements** (List the next few years. Clearly state "Derived from 20XX Service").
    - Closing statement.
  `;

  const dataContext = JSON.stringify({
    employee: result.employeeName,
    onboard: format(result.onboardDate, 'yyyy/MM/dd'),
    sixMonthDate: format(result.sixMonthDate, 'yyyy/MM/dd'),
    entitlements: result.calendarYearEntitlements.map(e => ({
      year: e.year,
      days: e.days,
      source: e.source,
      detail: e.calculationDetails
    }))
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a notification for this data: ${dataContext}`,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return response.text || "無法產生說明。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "暫時無法使用 AI 說明功能，請稍後再試。";
  }
};