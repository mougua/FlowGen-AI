
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

const BASE_SYSTEM_INSTRUCTION = `
    You are an elite Visualization Architect. Your goal is to generate or modify node-based diagrams based on user intent.
    
    CRITICAL: DETECT THE DIAGRAM TYPE. DO NOT DEFAULT TO FLOWCHART.
    
    1. **Analyze Intent**:
       - **Mind Map**: Central idea branches out. Use 'LR' (Left-to-Right) layout. Central node = 'circle' or 'cloud'. Branches = 'pill' or 'rectangle'.
       - **Org Chart / Hierarchy**: Strict Top-Down ('TB'). Use 'rectangle' or 'pill'.
       - **Architecture / System**: Component based. Use 'LR'. Database = 'cylinder', Internet = 'cloud', Service = 'rectangle'.
       - **Flowchart**: Process steps. Use 'TB'. Decisions = 'diamond', Start/End = 'pill'.
       - **Database Schema**: Tables and relations. Use 'LR'. Shape = 'rectangle' (representing tables).
    
    2. **Styling Rules**:
       - Apply semantic colors (e.g., Red for errors/stops, Green for success/start, Blue for core components, Cylinder/Grey for storage).
       - Keep labels concise (2-6 words max).
       - For Mind Maps, make the central node distinct (larger font, specific color).
`;

const RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
    layoutDirection: {
        type: Type.STRING,
        enum: ["TB", "LR", "RL", "BT"],
        description: "The direction the diagram should flow."
    },
    diagramType: {
        type: Type.STRING,
        enum: ["flowchart", "mindmap", "architecture", "sequence", "hierarchy"],
        description: "The category of the diagram."
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
            shadow: { type: Type.STRING, enum: ["none", "sm", "md", "lg", "xl"] },
            borderStyle: { type: Type.STRING, enum: ["solid", "dashed", "dotted"] },
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
            animated: { type: Type.BOOLEAN },
            style: {
                type: Type.OBJECT,
                properties: {
                    strokeDasharray: { type: Type.STRING }
                }
            }
        },
        required: ["source", "target"],
        },
    },
    },
};

export const generateFlowchartStructure = async (userPrompt: string): Promise<FlowData> => {
  const ai = getAiClient();

  return retryOperation(async () => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: `Create a diagram for: "${userPrompt}"`,
        config: {
            systemInstruction: BASE_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
        },
    });

    if (!response.text) throw new Error("Empty response from AI.");

    try {
        const data = JSON.parse(response.text) as FlowData;
        return {
            layoutDirection: data.layoutDirection || 'TB',
            diagramType: data.diagramType || 'flowchart',
            nodes: Array.isArray(data.nodes) ? data.nodes : [],
            edges: Array.isArray(data.edges) ? data.edges : []
        };
    } catch (e) {
        throw new Error("Failed to parse structure from AI response.");
    }
  });
};

export const updateFlowchartStructure = async (currentData: FlowData, userPrompt: string): Promise<FlowData> => {
    const ai = getAiClient();
  
    // Simplify current data to reduce token usage and noise
    const contextStr = JSON.stringify({
        nodes: currentData.nodes.map(n => ({ id: n.id, label: n.label, shape: n.shape, color: n.color })),
        edges: currentData.edges.map(e => ({ source: e.source, target: e.target, label: e.label }))
    });
  
    const updateInstruction = `
      ${BASE_SYSTEM_INSTRUCTION}
      
      **TASK: EDITING MODE**
      The user wants to modify an existing diagram.
      1. Respect existing IDs where possible to maintain continuity.
      2. If the user asks to "Change all X to Y", modify the properties.
      3. If the user asks to "Add a step", insert new nodes and adjust edges.
      4. If the user asks to "Connect A to B", add an edge.
      5. If the user wants a style change (e.g. "Make it a mind map"), change the layoutDirection and node shapes/colors accordingly.
      
      Current Diagram Data:
      ${contextStr}
    `;
  
    return retryOperation(async () => {
      const response = await ai.models.generateContent({
          model: "gemini-2.5-flash", 
          contents: `Update the diagram: "${userPrompt}"`,
          config: {
              systemInstruction: updateInstruction,
              responseMimeType: "application/json",
              responseSchema: RESPONSE_SCHEMA,
          },
      });
  
      if (!response.text) throw new Error("Empty response from AI.");
  
      try {
          const data = JSON.parse(response.text) as FlowData;
          return {
              layoutDirection: data.layoutDirection || currentData.layoutDirection || 'TB',
              diagramType: data.diagramType || currentData.diagramType || 'flowchart',
              nodes: Array.isArray(data.nodes) ? data.nodes : [],
              edges: Array.isArray(data.edges) ? data.edges : []
          };
      } catch (e) {
          throw new Error("Failed to parse updated structure.");
      }
    });
  };
