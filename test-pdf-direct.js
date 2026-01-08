#!/usr/bin/env node

import { config } from "dotenv";
config();

async function testPDFDirect() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error("No API key found");
    return;
  }

  // Create a minimal PDF
  const testPDF = Buffer.from(
    "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000306 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n400\n%%EOF"
  );

  const base64 = testPDF.toString("base64");
  const pdfDataURL = `data:application/pdf;base64,${base64}`;

  console.log("Testing PDF direct upload to Vision API...\n");

  try {
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
                text: "What does this document say?",
              },
              {
                type: "image_url",
                image_url: {
                  url: pdfDataURL,
                },
              },
            ],
          },
        ],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Error:", response.status);
      console.error(JSON.stringify(result, null, 2));
      
      if (result.error?.message?.includes("PDF") || result.error?.message?.includes("format")) {
        console.log("\n⚠️  Vision API doesn't support PDFs directly!");
        console.log("   We need to convert PDFs to images first.");
      }
      return false;
    }

    console.log("✅ PDF accepted by Vision API!");
    console.log("Response:", result.choices?.[0]?.message?.content);
    return true;
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    return false;
  }
}

testPDFDirect();

