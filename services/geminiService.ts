import { GoogleGenAI, Type } from "@google/genai";
import { Coordinates, LocationInfo } from "../types";
import { calculateDistance, isValidCoord } from "../utils/geo"; // Import isValidCoord

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJsonString = (text: string): string => {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\n?/, '').replace(/```$/, '');
  return cleaned;
};

const LOCATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    facts: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT,
        properties: {
            text: { type: Type.STRING },
            sourceUrl: { type: Type.STRING, description: "The specific URL where this fact was found." }
        },
        required: ["text"]
      } 
    },
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
    },
    region: {
      type: Type.STRING, 
      enum: ['Kurzeme', 'Vidzeme', 'Latgale', 'Zemgale', 'Sēlija', 'Rīga']
    },
    website: { 
      type: Type.STRING, 
      description: "Official website URL of the location. DO NOT guess. (e.g. rundale.net)" 
    },
    isOfficialGoogleMapsWebsite: {
      type: Type.BOOLEAN,
      description: "Set to TRUE only if this URL is explicitly listed as the 'Website' button link on the Google Maps/Knowledge Graph entry for this place. If you found it via general search but it's not the Maps link, set FALSE."
    }
  },
  required: ["title", "description", "facts", "nearbyPlaces", "type", "exactCoordinates", "region"]
};

export const fetchLocationDetails = async (coords: Coordinates, knownName?: string, filters: string[] = []): Promise<LocationInfo> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key missing");
  }

  const regionFilters = filters.filter(f => ['Kurzeme', 'Vidzeme', 'Latgale', 'Zemgale', 'Sēlija', 'Rīga'].includes(f));
  const categoryFilters = filters.filter(f => !['Kurzeme', 'Vidzeme', 'Latgale', 'Zemgale', 'Sēlija', 'Rīga'].includes(f));

  let filterText = "";
  if (regionFilters.length > 0) {
      filterText += `MANDATORY REGION: You MUST find an object strictly within ${regionFilters.join(' or ')}. If the input coordinates are not in this region, find the nearest appropriate object INSIDE ${regionFilters[0]}. `;
  }
  if (categoryFilters.length > 0) {
      filterText += `Prefer category: ${categoryFilters.join(', ')}. `;
  }
  
  // Revised System Instruction for Strict Coordinate Accuracy & Website Security
  const systemInstruction = `Role: Expert Cartographer and Local Guide for Latvia.
Task: Identify the nearest SPECIFIC tourism object and provide its EXACT real-world coordinates and OFFICIAL WEBSITE.

CRITICAL INSTRUCTION FOR COORDINATES:
1. The Input Coordinates are RANDOM and APPROXIMATE. They are just a search center.
2. You MUST identify a specific named place (e.g. "Skrundas Muiža", "Ventas Rumba", "Zvārtes Iezis").
3. You MUST perform a Google Search to find the EXACT GPS COORDINATES of that specific named place.
4. The 'exactCoordinates' in your JSON response MUST be the coordinates of the PLACE found in search, NOT the input coordinates.

OFFICIAL WEBSITE RULE (SECURITY CRITICAL):
- You must ONLY populate the 'website' field if you find the OFFICIAL verified website link associated with the place in Google Maps.
- Do NOT include generic info pages (latvia.travel, tripadvisor, facebook) unless it is the ONLY official presence listed on Google Maps.
- Do NOT guess. If the Google Maps entry does not have a "Website" button, leave 'website' null.
- Malicious or incorrect links must be avoided.

CONTENT RULES (Latvian):
- Title: Official name in Latvian.
- Description: 1 engaging sentence in Latvian.
- Facts: 3-5 interesting facts.
- Sources: For every fact, try to assign a specific 'sourceUrl' from the search results where that fact can be verified.
`;

  const prompt = `
    Input Coordinates (Approximate Search Center): ${coords.lat}, ${coords.lng}.
    ${knownName ? `Target Object: "${knownName}" (Find its EXACT REAL-WORLD location).` : "Find the closest specific tourism object."}
    ${filterText}
    
    Output JSON. Ensure 'exactCoordinates' matches the real-world location on Google Maps.
    Only set 'isOfficialGoogleMapsWebsite' to true if you are certain the website is the official one.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json",
        responseSchema: LOCATION_SCHEMA,
        thinkingConfig: { thinkingBudget: 0 },
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    // Process sources: Filter out duplicates by domain and take top 3
    const rawSources = groundingChunks?.map((chunk: any) => ({
      uri: chunk.web?.uri || chunk.maps?.uri,
      title: chunk.web?.title || chunk.maps?.title
    })).filter((s: any) => s.uri) || [];

    const seenDomains = new Set();
    const sources = [];

    for (const source of rawSources) {
        try {
            const domain = new URL(source.uri).hostname.replace('www.', '');
            if (!seenDomains.has(domain)) {
                seenDomains.add(domain);
                sources.push(source);
            }
        } catch (e) {
            sources.push(source);
        }
        if (sources.length >= 3) break; 
    }

    const text = cleanJsonString(response.text || "{}");
    const parsedData = JSON.parse(text) as LocationInfo & { exactCoordinates?: Coordinates, website?: string, isOfficialGoogleMapsWebsite?: boolean };
    
    // NEW: Robustly validate exactCoordinates from AI response for NaN values
    if (parsedData.exactCoordinates && !isValidCoord(parsedData.exactCoordinates)) {
        console.warn("AI returned invalid exactCoordinates (NaN detected), falling back to approximate input.");
        parsedData.exactCoordinates = null; // Clear if invalid, will be handled by next fallback
    }

    // Safety check: Ensure coordinates are not 0,0 (or now, null/invalid from above check)
    if (!parsedData.exactCoordinates || (parsedData.exactCoordinates.lat === 0 && parsedData.exactCoordinates.lng === 0)) {
        parsedData.exactCoordinates = coords; // Fallback to the initial search coordinates
    }

    // Add Official Website to sources ONLY if strictly validated by model
    if (parsedData.website && parsedData.isOfficialGoogleMapsWebsite && parsedData.website.startsWith('http')) {
        try {
            const websiteDomain = new URL(parsedData.website).hostname.replace('www.', '');
            const exists = sources.some(s => s.uri.includes(websiteDomain));
            if (!exists) {
                sources.unshift({ 
                    uri: parsedData.website, 
                    title: "Oficiālā mājaslapa" 
                });
            }
        } catch (e) {
            // Invalid URL, ignore
        }
    }

    // Recalculate distances for precision based on the snapped exactCoordinates
    if (parsedData.nearbyPlaces) {
      parsedData.nearbyPlaces = parsedData.nearbyPlaces.slice(0, 5).map(place => ({
        ...place,
        distance: calculateDistance(parsedData.exactCoordinates || coords, place.coordinates)
      }));
    }

    return { ...parsedData, sources };

  } catch (error: any) {
    console.error("Gemini API Error:", error);

    let errorMessage = "Neizdevās iegūt informāciju. Lūdzu, mēģiniet vēlreiz.";

    if (error.status === 429) { // Quota Exceeded
      errorMessage = "Kvota pārsniegta. Lūdzu, pārbaudiet savu Gemini API plānu un norēķinu informāciju: https://ai.google.dev/gemini-api/docs/rate-limits";
    } else if (error.message && typeof error.message === 'string' && error.message.includes("API Key missing")) {
      errorMessage = "API atslēga trūkst vai ir nederīga.";
    } else if (error.message && typeof error.message === 'string') {
      // Attempt to extract more specific message if available
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj.error && errorObj.error.message) {
          errorMessage = `API kļūda: ${errorObj.error.message}`;
        }
      } catch (e) {
        // Fallback to generic message
      }
    }

    // Re-throw the error with a friendlier message so App.tsx can catch it
    throw new Error(errorMessage);
  }
};