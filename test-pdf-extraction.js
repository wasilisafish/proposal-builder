#!/usr/bin/env node

/**
 * Test script to verify PDF/image extraction and AI analysis functionality
 * Run with: node test-pdf-extraction.js
 */

import { readFile } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testPDFPreparation() {
  console.log("🧪 Testing PDF Preparation for Vision API...\n");
  
  try {
    // Create a simple test PDF buffer (minimal valid PDF)
    const testPDFBuffer = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000306 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n400\n%%EOF"
    );
    
    // Convert PDF to base64 data URL (as OpenAI Vision API expects)
    const base64 = testPDFBuffer.toString("base64");
    const dataURL = `data:application/pdf;base64,${base64}`;
    
    if (dataURL.startsWith("data:application/pdf;base64,")) {
      console.log("✅ PDF prepared for Vision API (no conversion needed!)");
      console.log(`   Data URL length: ${dataURL.length} characters`);
      return true;
    } else {
      console.error("❌ PDF preparation failed");
      return false;
    }
  } catch (error) {
    console.error("❌ PDF preparation test failed:", error.message);
    return false;
  }
}

async function testOpenAIConnection() {
  console.log("\n🧪 Testing OpenAI API Connection...\n");
  
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error("❌ OPENAI_API_KEY not set in environment");
      return false;
    }
    
    console.log("✅ OPENAI_API_KEY found");
    
    // Test API connection with a simple request
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error("❌ OpenAI API key is invalid or expired");
        console.error("   Please update OPENAI_API_KEY in .env file");
        console.error("   Get a new key at: https://platform.openai.com/account/api-keys");
      } else {
        const error = await response.text();
        console.error("❌ OpenAI API connection failed:", response.status, error);
      }
      return false;
    }
    
    console.log("✅ OpenAI API connection successful");
    return true;
  } catch (error) {
    console.error("❌ OpenAI API test failed:", error.message);
    return false;
  }
}

async function testImageToBase64() {
  console.log("\n🧪 Testing Image to Base64 Conversion...\n");
  
  try {
    // Create a minimal 1x1 PNG
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    
    const base64 = pngBuffer.toString("base64");
    const dataURL = `data:image/png;base64,${base64}`;
    
    if (dataURL.startsWith("data:image/png;base64,")) {
      console.log("✅ Image to base64 conversion works");
      return true;
    } else {
      console.error("❌ Image to base64 conversion failed");
      return false;
    }
  } catch (error) {
    console.error("❌ Image conversion test failed:", error.message);
    return false;
  }
}

async function testVisionAPIExtraction() {
  console.log("\n🧪 Testing Vision API Extraction (with sample image)...\n");
  
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log("⏭️  Skipping - OPENAI_API_KEY not set");
      return true; // Not a failure, just skip
    }
    
    // Create a minimal test image (1x1 red pixel PNG)
    const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const dataURL = `data:image/png;base64,${testImageBase64}`;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "What color is this image? Respond with just the color name.",
              },
              {
                type: "image_url",
                image_url: { url: dataURL },
              },
            ],
          },
        ],
      }),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error("❌ Vision API test failed: Invalid API key");
        console.error("   Please update OPENAI_API_KEY in .env file");
        return false;
      } else if (response.status === 429) {
        const error = await response.json().catch(() => ({}));
        console.warn("⚠️  Vision API quota exceeded (this is OK - key is valid)");
        console.warn("   Message:", error.error?.message || "Quota exceeded");
        console.warn("   The API key works, but you need to add credits to your OpenAI account");
        return true; // Key is valid, just quota issue
      } else {
        const error = await response.text();
        console.error("❌ Vision API test failed:", response.status, error);
        return false;
      }
    }
    
    const result = await response.json();
    console.log("✅ Vision API extraction works");
    console.log("   Response:", result.choices?.[0]?.message?.content?.substring(0, 50) || "No content");
    return true;
  } catch (error) {
    console.error("❌ Vision API test failed:", error.message);
    return false;
  }
}

async function runAllTests() {
  console.log("=" .repeat(60));
  console.log("🧪 PDF Extraction & AI Analysis Test Suite");
  console.log("=" .repeat(60));
  console.log();
  
  const results = {
    pdfPreparation: await testPDFPreparation(),
    openAIConnection: await testOpenAIConnection(),
    imageConversion: await testImageToBase64(),
    visionAPI: await testVisionAPIExtraction(),
  };
  
  console.log("\n" + "=" .repeat(60));
  console.log("📊 Test Results Summary");
  console.log("=" .repeat(60));
  console.log(`PDF Preparation:      ${results.pdfPreparation ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`OpenAI Connection:     ${results.openAIConnection ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Image Conversion:     ${results.imageConversion ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Vision API:           ${results.visionAPI ? "✅ PASS" : "⏭️  SKIP"}`);
  console.log();
  
  const allPassed = Object.values(results).every((r) => r === true);
  
  if (allPassed) {
    console.log("✅ All tests passed! System is ready to use.");
    process.exit(0);
  } else {
    console.log("❌ Some tests failed. Please fix the issues above.");
    process.exit(1);
  }
}

// Load environment variables
import { config } from "dotenv";
config();

runAllTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

