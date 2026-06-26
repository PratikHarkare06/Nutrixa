const fs = require("fs");

const callNvidiaNim = async (prompt, imagePath = null, mimeType = null) => {
  const apiKey = (process.env.NIM_API_KEY || process.env.NVIDIA_API || process.env.NVIDIA_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("NIM_API_KEY or NVIDIA_API is not configured in environment variables.");
  }

  const isVision = !!(imagePath && mimeType);
  const model = isVision
    ? (process.env.NVIDIA_VISION_MODEL || "meta/llama-3.2-11b-vision-instruct")
    : (process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct");
  const messages = [];

  if (isVision) {
    messages.push({
      role: "system",
      content: "You are a professional nutrition and culinary assistant. You MUST respond with ONLY a valid, parseable JSON object or array matching the requested schema. Do not include any conversational text, markdown block wrapping (such as ```json), or explanations outside of the raw JSON."
    });
  }

  if (imagePath && mimeType) {
    const base64Image = fs.readFileSync(imagePath).toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    messages.push({
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: dataUrl } }
      ]
    });
  } else {
    messages.push({
      role: "user",
      content: prompt
    });
  }

  const bodyPayload = {
    model,
    messages,
    temperature: isVision ? 0.1 : 1.00,
    top_p: 0.95,
    max_tokens: 4096,
  };

  if (!isVision) {
    bodyPayload.chat_template_kwargs = { enable_thinking: true };
  }

  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`NVIDIA NIM API HTTP ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  return text;
};

const extractJsonFromText = (text) => {
  // First clean out any <think>...</think> block to avoid matching brace contents inside the thinking phase
  const cleanedText = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  // Find the first occurrence of { or [
  let startIdx = -1;
  let isArray = false;
  
  for (let i = 0; i < cleanedText.length; i++) {
    if (cleanedText[i] === '{') {
      startIdx = i;
      isArray = false;
      break;
    } else if (cleanedText[i] === '[') {
      startIdx = i;
      isArray = true;
      break;
    }
  }
  
  if (startIdx === -1) {
    throw new Error("No JSON structure found in text response.");
  }
  
  // Track brace/bracket nesting to find the correct ending index
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escape = false;
  
  for (let i = startIdx; i < cleanedText.length; i++) {
    const char = cleanedText[i];
    
    if (escape) {
      escape = false;
      continue;
    }
    
    if (char === '\\') {
      escape = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0 && !isArray) {
          const jsonStr = cleanedText.slice(startIdx, i + 1);
          try {
            return JSON.parse(jsonStr);
          } catch (e) {
            try {
              // Replace single quotes that wrap keys/values with double quotes,
              // while preserving apostrophes inside words if possible, but a simple replace is a good first step.
              const fixedJson = jsonStr.replace(/'/g, '"');
              return JSON.parse(fixedJson);
            } catch (innerErr) {
              throw e;
            }
          }
        }
      } else if (char === '[') {
        bracketCount++;
      } else if (char === ']') {
        bracketCount--;
        if (bracketCount === 0 && isArray) {
          const jsonStr = cleanedText.slice(startIdx, i + 1);
          try {
            return JSON.parse(jsonStr);
          } catch (e) {
            try {
              const fixedJson = jsonStr.replace(/'/g, '"');
              return JSON.parse(fixedJson);
            } catch (innerErr) {
              throw e;
            }
          }
        }
      }
    }
  }
  
  // Fallback to regex match if nesting check didn't result in clean parse
  const match = cleanedText.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (!match) {
    throw new Error("No JSON structure found in text response.");
  }
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    try {
      const fixedJson = match[0].replace(/'/g, '"');
      return JSON.parse(fixedJson);
    } catch (innerErr) {
      throw e;
    }
  }
};

module.exports = { callNvidiaNim, extractJsonFromText };
