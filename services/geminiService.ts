import { GoogleGenAI, Type } from "@google/genai";
import { Coordinates, LocationInfo } from "../types";
import { isPointInPolygon, LATVIA_POLYGON, calculateDistance } from "../utils/geo";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to clean Markdown code blocks from JSON string
const cleanJsonString = (text: string): string => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned;
};

export const fetchLocationDetails = async (coords: Coordinates, knownName?: string, filters: string[] = []): Promise<LocationInfo> => {
  if (!apiKey) {
    return {
      title: "Trūkst API atslēgas",
      description: "Lūdzu, konfigurējiet Gemini API atslēgu.",
      facts: [],
      nearbyPlaces: [],
      type: "Other"
    };
  }

  // Simplified filter instruction for speed
  let filterInstruction = "";
  if (filters.length > 0) {
      filterInstruction = `FILTER: User ONLY wants type: ${filters.join(', ')}. If main object isn't this type, find nearest that is.`;
  }

  // Improved Prompt ensuring exact coordinates via Search
  const basePrompt = `
    Context: User is exploring Latvia. Target Search Area: ${coords.lat}, ${coords.lng}. ${knownName ? `Specific Target: "${knownName}"` : 'Find the most interesting object near here.'}
    ${filterInstruction}
    
    TASK:
    1. Identify the BEST tourism object (Nature, Castle, Hill, Lake, etc) in this area.
    2. CRITICAL: You MUST use the 'googleSearch' tool to find the REAL, EXACT GPS coordinates (latitude, longitude) for this identified object.
       - Do NOT use the "Target Search Area" coordinates as the final location.
       - Do NOT guess. The 'exactCoordinates' field MUST come from the Google Search result.
    3. For 'nearbyPlaces', choose REAL places (cities, landmarks) with REAL coordinates.

    JSON Schema:
    {
      "title": "Object Name",
      "description": "Short description (LV).",
      "facts": ["Fact 1"],
      "exactCoordinates": { "lat": 0.0, "lng": 0.0 },
      "nearbyPlaces": [
        { "name": "Name", "type": "Type", "distance": "1.2 km", "coordinates": { "lat": 0.0, "lng": 0.0 } }
      ],
      "type": "One of: Lake, River, Sea, Forest, Nature, City, Village, Castle, Manor, Ruins, Museum, Church, Tower, Trail, Hill, Cafe, Other"
    }
  `;

  // Standard Schema
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      facts: { type: Type.ARRAY, items: { type: Type.STRING } },
      exactCoordinates: {
          type: Type.OBJECT,
          properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } },
          required: ["lat", "lng"]
      },
      nearbyPlaces: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING },
            distance: { type: Type.STRING },
            coordinates: {
              type: Type.OBJECT,
              properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } },
              required: ["lat", "lng"]
            }
          },
          required: ["name", "type", "distance", "coordinates"]
        }
      },
      type: { 
        type: Type.STRING, 
        enum: ['Lake', 'River', 'Sea', 'Forest', 'Nature', 'City', 'Village', 'Castle', 'Manor', 'Ruins', 'Museum', 'Church', 'Tower', 'Trail', 'Hill', 'Cafe', 'Other'] 
      }
    },
    required: ["title", "description", "facts", "nearbyPlaces", "type"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: basePrompt,
      config: {
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    const text = cleanJsonString(response.text || "");
    if (!text) throw new Error("Empty response");
    
    return parseAndValidate(text, coords);

  } catch (error) {
    console.warn("Primary search failed or timed out, retrying without search...", error);
    
    // Fallback: Super fast, no search, estimation only
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: basePrompt + "\n Estimate coordinates from internal knowledge.",
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          thinkingConfig: { thinkingBudget: 0 } 
        }
      });

      const text = cleanJsonString(response.text || "");
      return parseAndValidate(text, coords);

    } catch (fallbackError) {
      console.error("Critical Failure:", fallbackError);
      return {
        title: "Latvijas Daba",
        description: "Mierīga vieta Latvijas ārēs.",
        facts: [],
        nearbyPlaces: [],
        type: "Nature" as any
      };
    }
  }
};

function parseAndValidate(jsonString: string, originalCoords: Coordinates): LocationInfo & { exactCoordinates?: Coordinates } {
  const parsedData = JSON.parse(jsonString) as LocationInfo & { exactCoordinates?: Coordinates };

  if (parsedData.nearbyPlaces) {
    const validPlaces = [];
    // Limit to 3 places post-processing to ensure UI is clean
    const limitedPlaces = parsedData.nearbyPlaces.slice(0, 3);
    
    for (const place of limitedPlaces) {
      if (place.coordinates && place.coordinates.lat > 55 && place.coordinates.lat < 59) {
        const centerPoint = parsedData.exactCoordinates || originalCoords;
        place.distance = calculateDistance(centerPoint, place.coordinates);
        validPlaces.push(place);
      }
    }
    
    // Simple sort
    validPlaces.sort((a, b) => {
      const getVal = (s: string) => s.includes('km') ? parseFloat(s) * 1000 : parseFloat(s);
      return getVal(a.distance) - getVal(b.distance);
    });
    
    parsedData.nearbyPlaces = validPlaces;
  }
  
  return parsedData;
}