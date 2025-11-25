
import { GoogleGenAI, Type } from "@google/genai";
import { FlowData } from "../types";

// Initialize Gemini Client
const getAiClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API Key not found. Please ensure it is set in the environment.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper for retrying operations
const retryOperation = async <T>(operation: () => Promise<T>, retries = 2, delay = 1000): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.warn("API call failed, retrying...", error);
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryOperation(operation, retries - 1, delay * 2);
  }
};

export const generateFlowchartStructure = async (userPrompt: string): Promise<FlowData> => {
  const ai = getAiClient();

  const systemInstruction = `
    You are an expert diagram architect. 
    Your goal is to convert a user's description into a structured diagram (Flowchart, Mind Map, Architecture Diagram, User Journey).
    
    1. **Analyze the structure**:
       - For **Architecture Diagrams** (e.g., Client -> Server -> DB), prefer 'LR' (Left-to-Right) layout.
       - For **Flowcharts** (Process steps), prefer 'TB' (Top-to-Bottom).
       - For **Mind Maps**, prefer 'LR' or 'TB'.
    
    2. **Create Nodes**:
       - Assign a 'shape' fitting the function (cylinder for DB, cloud for internet, diamond for decisions, parallelogram for I/O, pill for start/end).
       - Assign a 'color' theme to group logical components (e.g., all frontend nodes blue, backend nodes green).
       - Label should be concise (2-5 words).

    3. **Create Edges**: Connect the nodes logically.
  `;

  return retryOperation(async () => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: userPrompt,
        config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
            layoutDirection: {
                type: Type.STRING,
                enum: ["TB", "LR", "RL", "BT"],
                description: "The direction the diagram should flow."
            },
            nodes: {
                type: Type.ARRAY,
                items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    shape: { 
                        type: Type.STRING, 
                        enum: ["rectangle", "pill", "diamond", "cylinder", "cloud", "circle", "parallelogram"] 
                    },
                    color: { type: Type.STRING, enum: ["blue", "green", "orange", "red", "purple", "slate", "yellow"] },
                },
                required: ["id", "label", "shape"],
                },
            },
            edges: {
                type: Type.ARRAY,
                items: {
                type: Type.OBJECT,
                properties: {
                    source: { type: Type.STRING },
                    target: { type: Type.STRING },
                    label: { type: Type.STRING },
                },
                required: ["source", "target"],
                },
            },
            },
        },
        },
    });

    if (!response.text) {
        throw new Error("Failed to generate flowchart structure: Empty response.");
    }

    try {
        const data = JSON.parse(response.text) as FlowData;
        
        // Defensive: Ensure nodes and edges exist
        return {
            layoutDirection: data.layoutDirection || 'TB',
            nodes: Array.isArray(data.nodes) ? data.nodes : [],
            edges: Array.isArray(data.edges) ? data.edges : []
        };
    } catch (e) {
        console.error("Failed to parse JSON", response.text);
        throw new Error("Failed to parse structure from AI response.");
    }
  });
};
