import React from "react";

export const getMealFallbackImage = (name: string): string => {
  const lower = name ? name.toLowerCase() : "";
  if (lower.includes("pizza")) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("burger") || lower.includes("mcdonald")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("salad")) {
    return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("biryani") || lower.includes("rice")) {
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("dosa")) {
    return "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("bhaji") || lower.includes("pav")) {
    return "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("curry") || lower.includes("chicken") || lower.includes("stew")) {
    return "https://images.unsplash.com/photo-1547928576-a4a3323dce9a?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("egg") || lower.includes("omelette")) {
    return "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop&q=80";
};

export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  foodName: string
) => {
  e.currentTarget.onerror = null; // Prevent infinite fallback loops if the fallback itself fails
  e.currentTarget.src = getMealFallbackImage(foodName);
};
