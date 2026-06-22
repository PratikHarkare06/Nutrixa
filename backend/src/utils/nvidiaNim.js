const fs = require("fs");

const callNvidiaNim = async (prompt, imagePath = null, mimeType = null) => {
  const apiKey = (process.env.NIM_API_KEY || process.env.NVIDIA_API || process.env.NVIDIA_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("NIM_API_KEY or NVIDIA_API is not configured in environment variables.");
  }

  const isVision = !!(imagePath && mimeType);
  const model = isVision
    ? (process.env.NVIDIA_VISION_MODEL || "meta/llama-3.2-11b-vision-instruct")
    : (process.env.NVIDIA_MODEL || "google/gemma-4-31b-it");
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
  // Match first JSON array [...] or object {...}
  const match = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  if (!match) {
    throw new Error("No JSON structure found in text response.");
  }
  return JSON.parse(match[0]);
};

module.exports = { callNvidiaNim, extractJsonFromText };
