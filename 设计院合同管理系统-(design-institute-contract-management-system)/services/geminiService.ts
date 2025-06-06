
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_TEXT_MODEL } from '../constants';

// Ensure API_KEY is handled by the environment
// DO NOT ADD UI for API KEY input.
// const apiKey = process.env.REACT_APP_GEMINI_API_KEY; // Example for CRA, adjust if needed
// For this project, it's assumed process.env.API_KEY is set in the build/runtime environment.
const apiKey = process.env.API_KEY;


let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn("Gemini API key is not configured. Gemini features will be disabled.");
}

/**
 * Summarizes a given text using the Gemini API.
 * @param text The text to summarize.
 * @returns A promise that resolves to the summarized text.
 */
export const summarizeTextWithGemini = async (text: string): Promise<string> => {
  if (!ai) {
    return "Gemini API not configured. Summary unavailable.";
  }
  if (!text || text.trim().length === 0) {
    return "No text provided for summarization.";
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: `请总结以下文本内容，使其简洁明了，突出要点:\n\n${text}`,
    });
    return response.text;
  } catch (error) {
    console.error("Error summarizing text with Gemini:", error);
    return `无法生成摘要: ${error instanceof Error ? error.message : String(error)}`;
  }
};

/**
 * Generates contract clauses based on a prompt using Gemini API.
 * @param prompt The prompt describing the desired clauses.
 * @returns A promise that resolves to the generated clauses.
 */
export const generateContractClauseWithGemini = async (prompt: string): Promise<string> => {
  if (!ai) {
    return "Gemini API not configured. Clause generation unavailable.";
  }
   if (!prompt || prompt.trim().length === 0) {
    return "No prompt provided for clause generation.";
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: `根据以下要求，生成合同条款。要求专业、清晰、法律合规：\n\n${prompt}`,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating clause with Gemini:", error);
    return `无法生成条款: ${error instanceof Error ? error.message : String(error)}`;
  }
};
