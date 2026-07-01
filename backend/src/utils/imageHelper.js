const getMealFallbackImage = (name) => {
  const lower = name ? name.toLowerCase() : "";
  if (lower.includes("pizza")) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("burger") || lower.includes("mcdonald") || lower.includes("slider")) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("salad") || lower.includes("quinoa") || lower.includes("bowl")) {
    return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("biryani") || lower.includes("rice") || lower.includes("pulao") || lower.includes("khichdi")) {
    return "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("dosa") || lower.includes("idli") || lower.includes("uttapam") || lower.includes("sambar")) {
    return "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("bhaji") || lower.includes("pav") || lower.includes("samosa") || lower.includes("pakora") || lower.includes("chaat")) {
    return "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("curry") || lower.includes("chicken") || lower.includes("stew") || lower.includes("paneer") || lower.includes("dal") || lower.includes("gravy")) {
    return "https://images.unsplash.com/photo-1547928576-a4a3323dce9a?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("egg") || lower.includes("omelette") || lower.includes("scrambled")) {
    return "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("smoothie") || lower.includes("shake") || lower.includes("juice") || lower.includes("drink") || lower.includes("beverage")) {
    return "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("oat") || lower.includes("porridge") || lower.includes("cereal") || lower.includes("muesli") || lower.includes("granola")) {
    return "https://images.unsplash.com/photo-1517881917430-e70dfb3610aa?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("fruit") || lower.includes("apple") || lower.includes("banana") || lower.includes("berry") || lower.includes("orange")) {
    return "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("sandwich") || lower.includes("wrap") || lower.includes("roll") || lower.includes("panini") || lower.includes("toast")) {
    return "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("pasta") || lower.includes("noodle") || lower.includes("spaghetti") || lower.includes("ramen") || lower.includes("macaroni")) {
    return "https://images.unsplash.com/photo-1563379971899-660589a0163e?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("roti") || lower.includes("chapati") || lower.includes("naan") || lower.includes("paratha") || lower.includes("flatbread")) {
    return "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("dessert") || lower.includes("sweet") || lower.includes("cake") || lower.includes("cookie") || lower.includes("pudding") || lower.includes("ice cream") || lower.includes("waffle") || lower.includes("pancake")) {
    return "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("soup") || lower.includes("broth")) {
    return "https://images.unsplash.com/photo-1547592165-e1d17fed6005?w=600&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&auto=format&fit=crop&q=80";
};

module.exports = { getMealFallbackImage };
