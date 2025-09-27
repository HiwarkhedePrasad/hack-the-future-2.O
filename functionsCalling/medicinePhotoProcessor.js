// medicinePhotoProcessor.js - Process medicine photos using Gemini Vision API
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Validate API key exists
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

// Fix: Correct import - should be GoogleGenerativeAI, not GoogleGenAI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Medicine database - In a real application, this would be a proper database
const medicineDatabase = {
  aspirin: {
    medicineName: "Aspirin",
    description:
      "A common pain reliever and anti-inflammatory medication used to treat pain, fever, and inflammation.",
    dosage: "325-650mg every 4-6 hours as needed, not to exceed 4g per day",
    sideEffects:
      "May cause stomach upset, bleeding, or allergic reactions in some people",
    precautions:
      "Avoid if you have bleeding disorders, stomach ulcers, or are allergic to aspirin",
    buyLink: "https://www.1mg.com/search/all?name=aspirin",
  },
  paracetamol: {
    medicineName: "Paracetamol (Acetaminophen)",
    description:
      "A pain reliever and fever reducer commonly used for headaches, muscle aches, and fever.",
    dosage: "500-1000mg every 4-6 hours as needed, not to exceed 4g per day",
    sideEffects:
      "Generally well-tolerated, but can cause liver damage in high doses",
    precautions: "Avoid alcohol and do not exceed recommended dosage",
    buyLink: "https://www.1mg.com/search/all?name=paracetamol",
  },
  ibuprofen: {
    medicineName: "Ibuprofen",
    description:
      "A non-steroidal anti-inflammatory drug (NSAID) used to reduce pain, fever, and inflammation.",
    dosage: "200-400mg every 4-6 hours as needed, not to exceed 1.2g per day",
    sideEffects:
      "May cause stomach irritation, dizziness, or increased blood pressure",
    precautions:
      "Take with food, avoid if you have stomach ulcers or kidney problems",
    buyLink: "https://www.1mg.com/search/all?name=ibuprofen",
  },
  "vitamin c": {
    medicineName: "Vitamin C",
    description:
      "An essential vitamin that supports immune function, skin health, and iron absorption.",
    dosage: "500-1000mg daily, or as directed by your doctor",
    sideEffects:
      "Generally safe, but high doses may cause diarrhea or stomach upset",
    precautions: "Take with food to improve absorption",
    buyLink: "https://www.1mg.com/search/all?name=vitamin%20c%20supplement",
  },
  calcium: {
    medicineName: "Calcium",
    description:
      "A mineral essential for strong bones, teeth, and muscle function.",
    dosage: "500-1000mg daily, or as directed by your doctor",
    sideEffects: "May cause constipation or stomach upset in some people",
    precautions:
      "Take with vitamin D for better absorption, avoid taking with iron supplements",
    buyLink: "https://www.1mg.com/search/all?name=calcium%20supplement",
  },
};

// Helper function to detect MIME type from buffer
function getMimeType(buffer) {
  // Check for common image file signatures
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg";
  } else if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return "image/gif";
  } else if (
    buffer[0] === 0x57 &&
    buffer[1] === 0x45 &&
    buffer[2] === 0x42 &&
    buffer[3] === 0x50
  ) {
    return "image/webp";
  }
  // Default to JPEG if can't detect
  return "image/jpeg";
}

// Process medicine photo using Gemini Vision API
export async function processMedicinePhotoWithGemini(mediaUrl) {
  try {
    console.log(`🔍 Starting medicine photo processing for: ${mediaUrl}`);

    if (!mediaUrl) {
      throw new Error("Media URL is required");
    }

    const imageBuffer = await downloadImage(mediaUrl);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = getMimeType(imageBuffer);

    const prompt = `Please analyze this image and identify if it shows any medicine, pill, tablet, or medication. 
    
    If you can identify a medicine, please provide:
    1. The name of the medicine (generic or brand name)
    2. What type of medication it appears to be
    3. Any visible markings, colors, or shapes that help identify it
    
    If this is not a medicine, please respond with "NOT_MEDICINE".
    
    Please be specific and accurate in your identification.`;

    // Fix: Use correct model name and updated API structure
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.1,
      },
    });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    console.log(`🤖 Gemini Vision response: ${text}`);

    // Parse the response and extract medicine information
    const medicineInfo = parseMedicineResponse(text);

    if (medicineInfo) {
      return medicineInfo;
    } else {
      return {
        success: false,
        medicineName: "Medicine",
        description:
          "I can see this appears to be a medication, but I couldn't identify the specific type. Please consult your doctor or pharmacist for accurate information.",
        dosage: "Consult your doctor for proper dosage",
        sideEffects: "Consult your doctor for potential side effects",
        precautions:
          "Always read the label and consult your doctor before taking any medication",
        buyLink: "https://www.1mg.com/search/all?name=medicine",
      };
    }
  } catch (error) {
    console.error("❌ Error processing medicine photo with Gemini:", error);

    // Provide more specific error information
    let errorMessage = "I'm having trouble analyzing this image.";

    if (error.message?.includes("API key")) {
      errorMessage =
        "API key issue. Please check your Gemini API key configuration.";
    } else if (error.message?.includes("quota")) {
      errorMessage = "API quota exceeded. Please try again later.";
    } else if (error.message?.includes("download")) {
      errorMessage = "Failed to download the image. Please check the URL.";
    }

    return {
      success: false,
      error: true,
      medicineName: "Unknown Medicine",
      description:
        errorMessage +
        " Please try sending a clearer photo or describe the medicine in text.",
      dosage: "Consult your doctor for proper dosage",
      sideEffects: "Consult your doctor for potential side effects",
      precautions: "Always consult your doctor before taking any medication",
      buyLink: "https://www.1mg.com/search/all?name=medicine",
    };
  }
}

// Download image from URL with better error handling
async function downloadImage(url) {
  try {
    console.log(`📥 Downloading image from: ${url}`);

    // Validate URL
    if (!url || !url.startsWith("http")) {
      throw new Error("Invalid URL provided");
    }

    const config = {
      responseType: "arraybuffer",
      timeout: 15000, // Increased timeout
      maxContentLength: 10 * 1024 * 1024, // 10MB limit
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    };

    // Only add auth if Twilio credentials exist
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      config.auth = {
        username: process.env.TWILIO_ACCOUNT_SID,
        password: process.env.TWILIO_AUTH_TOKEN,
      };
    }

    const response = await axios.get(url, config);

    if (!response.data) {
      throw new Error("No image data received");
    }

    console.log(
      `✅ Image downloaded successfully (${response.data.length} bytes)`
    );
    return Buffer.from(response.data);
  } catch (error) {
    console.error("❌ Error downloading image:", error);

    // Provide more specific error messages
    if (error.code === "ENOTFOUND") {
      throw new Error("Network error: Unable to reach the image URL");
    } else if (error.code === "TIMEOUT") {
      throw new Error("Timeout: Image download took too long");
    } else if (error.response?.status === 401) {
      throw new Error("Authentication failed: Check Twilio credentials");
    } else if (error.response?.status === 404) {
      throw new Error("Image not found: The URL may be invalid or expired");
    }

    throw new Error(`Failed to download image: ${error.message}`);
  }
}

// Parse Gemini's response to extract medicine information
function parseMedicineResponse(response) {
  try {
    if (!response || typeof response !== "string") {
      return null;
    }

    const lowerResponse = response.toLowerCase().trim();

    // Check if it's not a medicine
    if (
      lowerResponse.includes("not_medicine") ||
      lowerResponse.includes("not a medicine") ||
      lowerResponse.includes("this is not a medicine") ||
      lowerResponse.includes("no medicine") ||
      lowerResponse.includes("cannot identify")
    ) {
      return null;
    }

    // Database-based match - check for exact matches first
    for (const [key, medicine] of Object.entries(medicineDatabase)) {
      if (
        lowerResponse.includes(key.toLowerCase()) ||
        lowerResponse.includes(medicine.medicineName.toLowerCase())
      ) {
        console.log(`🎯 Identified medicine: ${medicine.medicineName}`);
        return { ...medicine, success: true };
      }
    }

    // Try to extract medicine name using various patterns
    const patterns = [
      /(?:name of medicine|medicine name)[:\s]*([^\n\.]+)/i,
      /(?:identified as|this is|appears to be)[:\s]*([A-Za-z0-9\s-]+)/i,
      /(?:medicine|pill|tablet|capsule|drug|medication)[:\s]*([A-Za-z0-9\s-]+)/i,
      /^([A-Za-z0-9\s-]+)(?:\s+(?:tablet|pill|capsule|mg))/i,
    ];

    for (const pattern of patterns) {
      const match = response.match(pattern);
      if (match && match[1]) {
        const extractedName = cleanMedicineName(match[1]);
        if (extractedName.length > 2) {
          // Ensure meaningful name
          console.log(`🔍 Extracted medicine name: ${extractedName}`);
          return matchOrFallback(extractedName);
        }
      }
    }

    return null;
  } catch (error) {
    console.error("❌ Error parsing medicine response:", error);
    return null;
  }
}

// Clean and normalize extracted medicine name
function cleanMedicineName(raw) {
  if (!raw || typeof raw !== "string") return "";

  return raw
    .split(/[\(,\.]/)[0] // Stop at parentheses/commas/dots
    .replace(
      /\b(\d+mg|\d+ml|\d+mcg|\d+g|tablet|capsule|pill|injection|syrup)\b/gi,
      ""
    ) // Remove dosage forms
    .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
}

// Try to find medicine in database, else return generic info
function matchOrFallback(extractedName) {
  const dbInfo = getMedicineInfoByName(extractedName);
  if (dbInfo) {
    return { ...dbInfo, success: true };
  }

  return {
    success: false,
    medicineName: extractedName,
    description:
      "I can see this appears to be a medication. Please consult your doctor or pharmacist for accurate information.",
    dosage: "Consult your doctor for proper dosage",
    sideEffects: "Consult your doctor for potential side effects",
    precautions:
      "Always read the label and consult your doctor before taking any medication",
    buyLink: `https://www.1mg.com/search/all?name=${encodeURIComponent(
      extractedName
    )}`,
  };
}

// Get medicine information by name with fuzzy matching
export function getMedicineInfoByName(medicineName) {
  if (!medicineName || typeof medicineName !== "string") {
    return null;
  }

  const lowerName = medicineName.toLowerCase().trim();

  // First try exact matches
  for (const [key, medicine] of Object.entries(medicineDatabase)) {
    const dbName = medicine.medicineName.toLowerCase();
    if (lowerName === key || lowerName === dbName) {
      return medicine;
    }
  }

  // Then try partial matches
  for (const [key, medicine] of Object.entries(medicineDatabase)) {
    const dbName = medicine.medicineName.toLowerCase();
    if (
      dbName.includes(lowerName) ||
      lowerName.includes(key) ||
      (lowerName.length > 3 && key.includes(lowerName))
    ) {
      return medicine;
    }
  }

  return null;
}

// Add a test function for debugging
export function testMedicineProcessor() {
  console.log("Testing medicine processor configuration...");

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not found in environment variables");
    return false;
  }

  console.log("✅ GEMINI_API_KEY is configured");
  console.log(
    `✅ Medicine database contains ${
      Object.keys(medicineDatabase).length
    } entries`
  );

  return true;
}
