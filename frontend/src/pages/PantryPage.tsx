import { useRef, useState, useEffect } from "react";
import { SparklesIcon, CameraIcon, CloseIcon } from "../components/icons";
import { useUploadStore } from "../store/uploadStore";
import { generateZeroWasteRecipeRequest, scanBarcodeRequest } from "../services/uploadApi";
import { BarcodeScanner } from "../components/BarcodeScanner";

// Mock data to match mockup screenshot
const mockPantryItems = [
  { name: "Avocados", details: "3 units • Added Oct 22", tag: "Fresh", category: "Fresh", color: "#EBF2EB", text: "#7A9E7E", icon: "🥑" },
  { name: "Chicken Breast", details: "500g • Added Oct 24", tag: "Low", category: "Fresh", color: "#FEF0EB", text: "#E8815A", icon: "🍗" },
  { name: "Quinoa", details: "1.2kg • Added Sep 15", tag: "Fresh", category: "Dry", color: "#FEF9EB", text: "#D4A847", icon: "🌾" },
  { name: "Greek Yogurt", details: "1 tub • Added Oct 20", tag: "Fresh", category: "Fresh", color: "#EBF2F8", text: "#7A9EBE", icon: "🥛" },
  { name: "Spinach", details: "100g • Added Oct 25", tag: "Low", category: "Fresh", color: "#EBF2EB", text: "#7A9E7E", icon: "🥬" },
];

const mockRecipes = [
  {
    name: "Zesty Quinoa Salad",
    time: "15 min",
    prepTime: "15 min",
    match: "90%",
    img: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600&auto=format&fit=crop&q=80",
    description: "A refreshing, high-protein quinoa salad tossed with fresh spinach, avocado, and a light zesty dressing.",
    calories: 380,
    protein: 12,
    carbs: 45,
    fat: 18,
    ingredients: ["Quinoa", "Avocados", "Spinach", "Olive oil", "Lemon juice", "Salt & Pepper"],
    instructions: [
      "Rinse and cook quinoa according to package instructions. Let cool.",
      "Chop the spinach, avocados, and any other desired vegetables.",
      "In a large bowl, combine the cooled quinoa, spinach, and avocados.",
      "Drizzle with lemon juice and olive oil, then season with salt and pepper to taste.",
      "Toss gently to combine and serve."
    ]
  },
  {
    name: "Creamy Chicken & Rice",
    time: "20 min",
    prepTime: "20 min",
    match: "85%",
    img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80",
    description: "A comforting dish featuring pan-seared chicken breast served over a bed of warm grains with a creamy Greek yogurt sauce.",
    calories: 520,
    protein: 42,
    carbs: 35,
    fat: 14,
    ingredients: ["Chicken Breast", "Rice or Quinoa", "Greek Yogurt", "Garlic", "Chicken broth", "Olive oil"],
    instructions: [
      "Season chicken breasts with salt, pepper, and garlic powder.",
      "Heat olive oil in a skillet and cook chicken until golden brown and cooked through.",
      "Remove chicken and let it rest, then slice it.",
      "In the same skillet, deglaze with chicken broth and stir in Greek yogurt over low heat.",
      "Serve chicken over cooked quinoa or rice, drizzled with the creamy yogurt sauce."
    ]
  },
  {
    name: "Green Power Smoothie",
    time: "5 min",
    prepTime: "5 min",
    match: "100%",
    img: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80",
    description: "A nutrient-packed green smoothie loaded with baby spinach, creamy avocado, and Greek yogurt for a healthy boost.",
    calories: 290,
    protein: 15,
    carbs: 22,
    fat: 16,
    ingredients: ["Spinach", "Avocados", "Greek Yogurt", "Honey", "Water or Almond milk"],
    instructions: [
      "Place the spinach, avocado flesh, and Greek yogurt in a high-speed blender.",
      "Add a splash of almond milk or water to help blend.",
      "Blend on high until completely smooth and creamy.",
      "Taste and add a touch of honey if extra sweetness is desired.",
      "Pour into a glass and enjoy immediately."
    ]
  },
];

type PantryPageProps = {
  onNavigate?: (path: string) => void;
};

export const PantryPage = ({ onNavigate }: PantryPageProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<"All" | "Fresh" | "Dry">("All");
  const [activeRecipe, setActiveRecipe] = useState<any | null>(null);
  const [isGeneratingZeroWaste, setIsGeneratingZeroWaste] = useState(false);

  // Add modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<"image" | "barcode" | "receipt">("image");
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);
  const [barcodeError, setBarcodeError] = useState("");

  // Interactive checklist & kitchen timer states
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [kitchenTimerSeconds, setKitchenTimerSeconds] = useState<number>(0);
  const [isKitchenTimerRunning, setIsKitchenTimerRunning] = useState<boolean>(false);
  const [voiceControlEnabled, setVoiceControlEnabled] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  const {
    pantryAnalysis,
    isUploading,
    errorMessage,
    progressMessage,
    uploadPantryImage,
    setPantryAnalysis,
    deductIngredientsFromPantry,
    addIngredientsToPantry,
    clearError,
    scannedHistory,
    addScannedProductToHistory,
    clearScannedHistory,
    scanBarcode,
    uploadReceipt
  } = useUploadStore();

  const handleBarcodeDetected = async (barcode: string) => {
    setBarcodeError("");
    setIsScanningBarcode(true);
    try {
      const result = await scanBarcodeRequest(barcode);
      if (result && result.success && result.data && result.data.foods.length > 0) {
        const foodName = result.data.foods[0].name;
        addIngredientsToPantry([foodName]);
        addScannedProductToHistory(barcode, foodName);
        alert(`Successfully added ${foodName} to your pantry!`);
        setIsAddModalOpen(false);
      } else {
        setBarcodeError("Product not found. Please try another barcode or add it manually.");
      }
    } catch (err: any) {
      console.error("Barcode lookup failed:", err);
      setBarcodeError(err.response?.data?.error?.message || "Failed to find barcode. Please check your network and try again.");
    } finally {
      setIsScanningBarcode(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsAddModalOpen(false);
      await uploadPantryImage(e.target.files[0]);
    }
  };

  const triggerReceiptUpload = () => {
    receiptInputRef.current?.click();
  };

  const handleReceiptFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const result = await uploadReceipt(file);
      if (result && result.length > 0) {
        addIngredientsToPantry(result);
        alert(`Successfully added ${result.length} items from receipt: ${result.join(", ")}`);
        setIsAddModalOpen(false);
      } else {
        alert("No items could be resolved from this receipt. Please try another image or add manually.");
      }
    }
  };

  const handleReset = () => {
    setPantryAnalysis(null);
  };

  const handleToggleStep = (idx: number) => {
    if (idx > completedSteps.length) return; // locked
    if (completedSteps.includes(idx)) {
      setCompletedSteps((prev) => prev.filter((step) => step < idx));
    } else {
      setCompletedSteps((prev) => [...prev, idx]);
    }
  };

  // Reset checklist and timer state when activeRecipe changes
  useEffect(() => {
    setCompletedSteps([]);
    setKitchenTimerSeconds(0);
    setIsKitchenTimerRunning(false);
  }, [activeRecipe]);

  // Kitchen Timer tick down effect
  useEffect(() => {
    let interval: any = null;
    if (isKitchenTimerRunning && kitchenTimerSeconds > 0) {
      interval = setInterval(() => {
        setKitchenTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsKitchenTimerRunning(false);
            if ("speechSynthesis" in window) {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance("Kitchen timer completed!");
              window.speechSynthesis.speak(utterance);
            }
            alert("⏰ Kitchen Timer Finished!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isKitchenTimerRunning, kitchenTimerSeconds]);

  // Continuous Speech Recognition for ChefVoice
  useEffect(() => {
    let recognition: any = null;
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass && activeRecipe && voiceControlEnabled) {
      try {
        recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onend = () => {
          if (voiceControlEnabled && activeRecipe) {
            try {
              recognition.start();
            } catch (err) {}
          } else {
            setIsListening(false);
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onresult = (event: any) => {
          const resultIndex = event.resultIndex;
          const transcript = event.results[resultIndex][0].transcript.toLowerCase().trim();
          console.log("ChefVoice heard:", transcript);

          // Handle command mappings
          if (transcript.includes("next step") || transcript.includes("next") || transcript.includes("done") || transcript.includes("complete")) {
            setCompletedSteps((prev) => {
              const nextIdx = prev.length;
              if (activeRecipe.instructions && nextIdx < activeRecipe.instructions.length) {
                if ("speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                  window.speechSynthesis.speak(new SpeechSynthesisUtterance(`Step ${nextIdx + 1} completed`));
                }
                return [...prev, nextIdx];
              }
              return prev;
            });
          } else if (transcript.includes("previous") || transcript.includes("back") || transcript.includes("go back")) {
            setCompletedSteps((prev) => {
              if (prev.length > 0) {
                if ("speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                  window.speechSynthesis.speak(new SpeechSynthesisUtterance("Step undone"));
                }
                return prev.slice(0, -1);
              }
              return prev;
            });
          } else if (transcript.includes("start timer") || transcript.includes("start")) {
            setKitchenTimerSeconds((seconds) => {
              if (seconds > 0) {
                setIsKitchenTimerRunning(true);
                if ("speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                  window.speechSynthesis.speak(new SpeechSynthesisUtterance("Timer started"));
                }
              } else {
                if ("speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                  window.speechSynthesis.speak(new SpeechSynthesisUtterance("Please set a time first"));
                }
              }
              return seconds;
            });
          } else if (transcript.includes("pause timer") || transcript.includes("pause")) {
            setIsKitchenTimerRunning(false);
            if ("speechSynthesis" in window) {
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(new SpeechSynthesisUtterance("Timer paused"));
            }
          } else if (transcript.includes("reset timer") || transcript.includes("reset")) {
            setIsKitchenTimerRunning(false);
            setKitchenTimerSeconds(0);
            if ("speechSynthesis" in window) {
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(new SpeechSynthesisUtterance("Timer reset"));
            }
          } else if (transcript.includes("close recipe") || transcript.includes("close")) {
            setActiveRecipe(null);
            if ("speechSynthesis" in window) {
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(new SpeechSynthesisUtterance("Recipe closed"));
            }
          }
        };

        recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    } else {
      setIsListening(false);
    }

    return () => {
      if (recognition) {
        recognition.onend = null;
        try {
          recognition.stop();
        } catch (e) {}
      }
    };
  }, [voiceControlEnabled, activeRecipe]);

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleGenerateZeroWasteRecipe = async () => {
    setIsGeneratingZeroWaste(true);
    try {
      const currentList = pantryAnalysis 
        ? pantryAnalysis.identifiedIngredients.map((ing, i) => ({ name: ing, tag: i % 2 === 0 ? "Fresh" : "Low" }))
        : mockPantryItems;

      const expiringIngredients = currentList
        .filter(item => item.tag === "Low")
        .map(item => item.name);

      const ingredientsToUse = expiringIngredients.length > 0 
        ? expiringIngredients 
        : currentList.map(item => item.name);

      const response = await generateZeroWasteRecipeRequest(ingredientsToUse);
      
      if (response && response.success && response.data) {
        setActiveRecipe({
          name: response.data.name,
          description: response.data.description,
          time: response.data.prepTime,
          prepTime: response.data.prepTime,
          match: "AI Generated",
          img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
          calories: response.data.calories,
          protein: response.data.protein,
          carbs: response.data.carbs,
          fat: response.data.fat,
          ingredients: response.data.ingredients,
          instructions: response.data.instructions,
          isAiGenerated: true,
        });
      } else {
        alert("Failed to generate zero-waste recipe.");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating recipe from expiring items. Please try again.");
    } finally {
      setIsGeneratingZeroWaste(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-background relative overflow-y-auto pb-24 px-4 sm:px-8 pt-8">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Header */}
      <header className="max-w-6xl mx-auto w-full flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-textHeading tracking-tight">My Pantry</h1>
          <p className="text-textMuted text-sm mt-1">
            Manage your ingredients and discover recipes.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white rounded-full text-xs font-bold transition-all shadow-sm"
          >
            {isUploading ? (
              <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <span className="text-sm font-semibold">+</span>
            )}
            Add Ingredient
          </button>
          
          <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-border hover:bg-surfaceAlt text-textHeading transition-colors shadow-sm">
            🛒
          </button>
        </div>
      </header>

      {/* Upload/Progress overlay */}
      {isUploading && (
        <div className="max-w-6xl mx-auto w-full mb-6 p-4 rounded-xl bg-[#EBF2EB] border border-[#D4E6D5] text-[#2C3E2B] text-sm font-medium flex items-center gap-3">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          <span>{progressMessage || "Analyzing ingredients..."}</span>
        </div>
      )}

      {errorMessage && (
        <div className="max-w-6xl mx-auto w-full mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-medium">
          {errorMessage}
        </div>
      )}

      {/* Main Grid Content */}
      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-8 mb-8">
        
        {/* Left Column (Current Inventory) */}
        <div className="space-y-6">
          
          {/* Recently Scanned Products Shelf */}
          {scannedHistory && scannedHistory.length > 0 && (
            <div className="bg-[#F5F6F1] border border-border rounded-3xl p-5 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🏷️</span>
                  <h3 className="text-sm font-bold text-textHeading">Recently Scanned Products</h3>
                </div>
                <button
                  onClick={() => clearScannedHistory && clearScannedHistory()}
                  className="text-[9px] font-bold text-textMuted hover:text-rose-500 transition-colors uppercase tracking-wider"
                >
                  Clear History
                </button>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
                {scannedHistory.map((product) => (
                  <div
                    key={`${product.barcode}-${product.timestamp}`}
                    className="min-w-[190px] max-w-[210px] bg-white border border-border rounded-2xl p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow snap-start shrink-0"
                  >
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[9px] bg-[#EBF2EB] border border-[#D4E6D5] text-[#7A9E7E] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider font-mono">
                          Barcode
                        </span>
                        <span className="text-[8px] text-textMuted font-mono truncate max-w-[100px]">
                          {product.barcode}
                        </span>
                      </div>
                      <h4 className="font-bold text-textHeading text-xs line-clamp-2 capitalize" title={product.name}>
                        {product.name}
                      </h4>
                    </div>

                    <div className="flex gap-2 mt-3 pt-2 border-t border-[#F5F6F1]">
                      {/* Add to Pantry Button */}
                      <button
                        onClick={() => {
                          addIngredientsToPantry([product.name]);
                          alert(`Added ${product.name} to Pantry!`);
                        }}
                        className="flex-1 py-1.5 bg-[#EBF2EB] hover:bg-[#D4E6D5] text-[#7A9E7E] rounded-xl text-[10px] font-bold transition-all border border-[#D4E6D5] flex items-center justify-center gap-1"
                        title="Add ingredient to pantry"
                      >
                        <span>＋</span> Pantry
                      </button>

                      {/* Log Meal Button */}
                      <button
                        onClick={async () => {
                          const success = await scanBarcode(product.barcode);
                          if (success) {
                            onNavigate?.("/results");
                          } else {
                            alert("Failed to log product as meal. Please check the barcode.");
                          }
                        }}
                        className="flex-1 py-1.5 bg-[#FEF0EB] hover:bg-[#FEE2D5] text-[#E8815A] rounded-xl text-[10px] font-bold transition-all border border-[#FEE2D5] flex items-center justify-center gap-1"
                        title="Log this product as a meal"
                      >
                        <span>⚡</span> Log
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-textHeading">Current Inventory</h2>
            
            {/* Category Pills */}
            <div className="bg-[#E2E4DC]/40 border border-border rounded-full p-1 flex">
              {(["All", "Fresh", "Dry"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilter(opt)}
                  className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                    filter === opt 
                      ? "bg-white text-textHeading shadow-sm" 
                      : "text-textMuted hover:text-textHeading"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Virtual Fridge & Pantry Drawers */}
          {(() => {
            const currentList = (pantryAnalysis ? pantryAnalysis.identifiedIngredients.map((ing, i) => ({
              name: ing,
              details: i % 3 === 0 ? "Expiring in 2 days" : "Added today",
              tag: i % 3 === 0 ? "Low" : "Fresh",
              category: getIngredientCategory(ing),
              icon: getIngredientIcon(ing)
            })) : mockPantryItems).filter((item) => filter === "All" || item.category === filter);

            const crisperItems = currentList.filter(item => getPantryItemPlacement(item.name, item.category) === "crisper_drawer");
            const shelfItems = currentList.filter(item => getPantryItemPlacement(item.name, item.category) === "fridge_shelf");
            const cabinetItems = currentList.filter(item => getPantryItemPlacement(item.name, item.category) === "dry_cabinet");

            const renderDrawer = (
              title: string,
              subtitle: string,
              items: typeof currentList,
              bgClass: string,
              borderColorClass: string,
              titleColorClass: string
            ) => {
              if (items.length === 0) return null;
              return (
                <div className={`p-5 rounded-[24px] border ${borderColorClass} ${bgClass} shadow-sm space-y-4`}>
                  <div className="flex justify-between items-center border-b border-border/45 pb-2">
                    <div>
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${titleColorClass}`}>{title}</h4>
                      <p className="text-[10px] text-textMuted mt-0.5">{subtitle}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-white border border-border/60 text-[10px] font-bold text-textHeading">
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((item) => (
                      <div 
                        key={item.name}
                        className="bg-white border border-border/80 rounded-xl p-3.5 flex flex-col justify-between h-24 hover:shadow-md transition-shadow relative group"
                      >
                        <div className="flex gap-2.5 items-center">
                          <div className="w-9 h-9 rounded-lg bg-[#F5F6F1] border border-border/50 flex items-center justify-center text-base select-none">
                            {item.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-xs text-textHeading capitalize truncate" title={item.name}>
                              {item.name}
                            </h5>
                            <span className={`inline-block text-[9px] font-bold uppercase mt-0.5 ${
                              item.tag === "Low" ? "text-[#E8815A]" : "text-[#7A9E7E]"
                            }`}>
                              {item.tag === "Low" ? "⚠️ Low Stock" : "✓ Fresh"}
                            </span>
                          </div>
                        </div>

                        {/* Decay progress bar */}
                        <div className="space-y-1 mt-1.5">
                          <div className="flex justify-between text-[8px] text-textMuted font-bold uppercase tracking-wider">
                            <span>Freshness Gauge</span>
                            <span>{item.tag === "Low" ? "20%" : "85%"}</span>
                          </div>
                          <div className="w-full bg-[#F5F5F0] h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                item.tag === "Low" ? "bg-[#E8815A]" : "bg-[#7A9E7E]"
                              }`}
                              style={{ width: item.tag === "Low" ? "20%" : "85%" }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            };

            return (
              <div className="space-y-6">
                {/* 1. Produce Crisper Drawer */}
                {renderDrawer(
                  "🥦 Produce Crisper Drawer",
                  "Fresh fruits, greens & vegetables",
                  crisperItems,
                  "bg-[#F4F7F2]/60 border-[#7A9E7E]/20",
                  "border-[#7A9E7E]/10",
                  "text-[#7A9E7E]"
                )}

                {/* 2. Refrigerator Shelf */}
                {renderDrawer(
                  "🥛 Refrigerator Door Shelf",
                  "Meats, dairy, liquids & proteins",
                  shelfItems,
                  "bg-[#F3F7FA]/60 border-[#7A9EBE]/20",
                  "border-[#7A9EBE]/10",
                  "text-[#7A9EBE]"
                )}

                {/* 3. Dry Pantry Cabinet */}
                {renderDrawer(
                  "🌾 Dry Pantry Cabinet",
                  "Grains, powders, seeds & dry goods",
                  cabinetItems,
                  "bg-[#FAF7F0]/60 border-[#D4A847]/20",
                  "border-[#D4A847]/10",
                  "text-[#D4A847]"
                )}
              </div>
            );
          })()}

          {/* View All Ingredients Button */}
          <button className="w-full py-2.5 bg-white border border-[#E2E4DC] hover:border-[#7A9E7E] text-textMuted hover:text-[#7A9E7E] rounded-xl text-xs font-bold transition-all shadow-sm">
            View All Ingredients
          </button>
        </div>

        {/* Right Column (Recipe AI suggestions) */}
        <div className="space-y-8">
          
          {/* AI Zero-Waste Kitchen Card */}
          <section className="bg-[#FEF9EB] rounded-[24px] border border-[#F5E6C4] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-textHeading">
              <span className="text-lg">👩‍🍳</span>
              <h3 className="font-bold text-base text-[#D4A847]">AI Zero-Waste Kitchen</h3>
            </div>
            <p className="text-xs text-textMuted leading-relaxed">
              Have ingredients expiring soon? Let Gemini create a custom high-protein recipe to use them up.
            </p>
            <button
              onClick={handleGenerateZeroWasteRecipe}
              disabled={isGeneratingZeroWaste}
              className="w-full py-2.5 bg-[#D4A847] hover:bg-[#B38D36] disabled:bg-[#F5E6C4] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 group transition-all"
            >
              {isGeneratingZeroWaste ? (
                <>
                  <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  Generating custom recipe...
                </>
              ) : (
                <>
                  <span className="group-hover:rotate-12 transition-transform">✨</span>
                  Generate Zero-Waste Recipe
                </>
              )}
            </button>
          </section>

          {/* Recipe AI Header Card */}
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-textHeading">
              <span className="text-lg">✨</span>
              <h3 className="font-bold text-base">Recipe AI</h3>
            </div>
            <p className="text-xs text-textMuted leading-relaxed">
              We found {pantryAnalysis ? pantryAnalysis.recipes.length : 12} recipes you can make with your current pantry items.
            </p>
            <button
              onClick={triggerUpload}
              className="w-full py-2.5 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Generate New Ideas
            </button>
          </section>

          {/* Top Matches Recipes List */}
          <div>
            <h3 className="text-base font-bold text-textHeading mb-4 uppercase tracking-wider">Top Matches</h3>
            <div className="space-y-4">
              {(pantryAnalysis ? pantryAnalysis.recipes.map((r, idx) => ({
                ...r,
                time: r.prepTime,
                match: "95%",
                img: getMealImage(r.name)
              })) : mockRecipes).map((recipe, index) => (
                <div key={index} className="bg-white border border-border rounded-2xl p-3 flex gap-4 hover:shadow-md transition-shadow relative">
                  <img
                    src={recipe.img}
                    alt={recipe.name}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-textHeading text-sm truncate capitalize">{recipe.name}</h4>
                      <button className="text-textMuted hover:text-rose-500 text-sm">❤️</button>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-textMuted mt-1.5 font-semibold">
                      <span>⏱ {recipe.time}</span>
                      <span>•</span>
                      <span className="text-[#10B981]">✓ {recipe.match} match</span>
                    </div>
                    <button 
                      onClick={() => setActiveRecipe(recipe)}
                      className="text-xs font-bold text-[#7A9E7E] hover:text-[#5C7A60] transition-colors mt-2.5 block text-left"
                    >
                      View Recipe
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Bottom Summary Strip */}
      <footer className="max-w-6xl mx-auto w-full bg-white rounded-[24px] border border-border p-6 shadow-sm grid grid-cols-3 gap-4 text-center divide-x divide-[#F5F5F0]">
        <div>
          <div className="text-2xl font-extrabold text-textHeading">84%</div>
          <div className="text-xs text-textMuted mt-0.5">Freshness Score</div>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-textHeading">4</div>
          <div className="text-xs text-textMuted mt-0.5">Items Expiring Soon</div>
        </div>
        <div>
          <div className="text-2xl font-extrabold text-textHeading">$12.50</div>
          <div className="text-xs text-textMuted mt-0.5">Est. Waste Saved</div>
        </div>
      </footer>

      {/* Recipe Details Modal */}
      {activeRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col animate-slide-up">
            {/* Hero Image */}
            <div className="relative h-64 w-full shrink-0">
              <img
                src={activeRecipe.img || getMealImage(activeRecipe.name)}
                alt={activeRecipe.name}
                className="w-full h-full object-cover rounded-t-[32px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent rounded-t-[32px]" />
              {/* ChefVoice Toggle Button */}
              <button
                onClick={() => setVoiceControlEnabled(!voiceControlEnabled)}
                className={`absolute top-4 left-4 px-3.5 py-2 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5 z-10 ${
                  voiceControlEnabled
                    ? isListening
                      ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse"
                      : "bg-[#7A9E7E] hover:bg-[#5C7A60] text-white"
                    : "bg-white/90 hover:bg-white text-textHeading border border-border"
                }`}
                title="Toggle ChefVoice hands-free control"
              >
                <span>🎙️</span>
                <span>{voiceControlEnabled ? (isListening ? "ChefVoice: ON" : "Initializing...") : "ChefVoice Off"}</span>
              </button>

              <button
                onClick={() => setActiveRecipe(null)}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white text-textHeading font-bold w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-md text-sm z-10"
                aria-label="Close modal"
              >
                ✕
              </button>
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className={`px-3 py-1 text-white rounded-full text-[10px] font-bold shadow-sm uppercase tracking-wide ${
                  activeRecipe.isAiGenerated ? "bg-[#D4A847]" : "bg-[#7A9E7E]"
                }`}>
                  {activeRecipe.isAiGenerated ? "✨ AI Generated" : `✓ ${activeRecipe.match || "90%"} match`}
                </span>
                <h2 className="text-2xl font-bold mt-2 drop-shadow-md capitalize text-white">{activeRecipe.name}</h2>
                <p className="text-white/90 text-xs mt-1 drop-shadow-sm font-semibold">⏱ Prep Time: {activeRecipe.prepTime || activeRecipe.time || "15 min"}</p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8 space-y-6 flex-1">
              {/* Description */}
              <div>
                <p className="text-textMuted text-xs leading-relaxed font-medium">
                  {activeRecipe.description || "A delicious recipe perfect for your current pantry ingredients."}
                </p>
              </div>

              {/* ChefVoice Voice Assistant Helper Card */}
              {voiceControlEnabled && (
                <div className="bg-[#EBF2EB]/40 border border-[#7A9E7E]/30 rounded-2xl p-4 space-y-2 animate-fade-in">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">🗣️</span>
                    <h4 className="text-xs font-bold text-[#7A9E7E] uppercase tracking-wider">ChefVoice Commands</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-textMuted font-semibold">
                    <div>• <span className="text-textHeading">"next" / "next step"</span>: Complete &amp; advance</div>
                    <div>• <span className="text-textHeading">"back" / "previous"</span>: Undo previous step</div>
                    <div>• <span className="text-textHeading">"start timer"</span>: Run countdown</div>
                    <div>• <span className="text-textHeading">"pause timer"</span>: Halt countdown</div>
                    <div>• <span className="text-textHeading">"reset timer"</span>: Wipe clock to 0</div>
                    <div>• <span className="text-textHeading">"close recipe"</span>: Close this modal</div>
                  </div>
                </div>
              )}

              {/* Macros Breakdown */}
              <div className="grid grid-cols-4 gap-3 bg-[#F5F6F1] p-4 rounded-2xl border border-border text-center">
                <div>
                  <div className="text-base font-bold text-textHeading">{activeRecipe.calories || 350}</div>
                  <div className="text-[9px] text-textMuted font-bold uppercase tracking-wider">Calories</div>
                </div>
                <div>
                  <div className="text-base font-bold text-[#E8815A]">{activeRecipe.protein || 15}g</div>
                  <div className="text-[9px] text-textMuted font-bold uppercase tracking-wider">Protein</div>
                </div>
                <div>
                  <div className="text-base font-bold text-[#D4A847]">{activeRecipe.carbs || 40}g</div>
                  <div className="text-[9px] text-textMuted font-bold uppercase tracking-wider">Carbs</div>
                </div>
                <div>
                  <div className="text-base font-bold text-[#7A9E7E]">{activeRecipe.fat || 10}g</div>
                  <div className="text-[9px] text-textMuted font-bold uppercase tracking-wider">Fats</div>
                </div>
              </div>

              {/* Ingredients Section */}
              <div>
                <h3 className="text-xs font-bold text-textHeading uppercase tracking-wider mb-3">Ingredients Needed</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(activeRecipe.ingredients || []).map((ing: string, i: number) => {
                    const pantryList = pantryAnalysis 
                      ? pantryAnalysis.identifiedIngredients 
                      : mockPantryItems.map(item => item.name);
                    const hasIngredient = pantryList.some(p => p.toLowerCase().includes(ing.toLowerCase()) || ing.toLowerCase().includes(p.toLowerCase()));
                    return (
                      <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-border/60">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          hasIngredient ? "bg-[#EBF2EB] text-[#7A9E7E]" : "bg-[#FEF0EB] text-[#E8815A]"
                        }`}>
                          {hasIngredient ? "✓" : "×"}
                        </span>
                        <span className={`text-xs ${hasIngredient ? "text-textHeading font-semibold" : "text-textMuted line-through"}`}>
                          {ing}
                        </span>
                        {!hasIngredient && (
                          <span className="ml-auto text-[8px] font-bold bg-[#FEF0EB] text-[#E8815A] px-1.5 py-0.5 rounded-md uppercase">
                            Missing
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Instructions Section */}
              <div>
                <h3 className="text-xs font-bold text-textHeading uppercase tracking-wider mb-3">Step-by-step Instructions</h3>
                <div className="space-y-3">
                  {(activeRecipe.instructions || []).map((step: string, i: number) => {
                    const isCompleted = completedSteps.includes(i);
                    const isActive = completedSteps.length === i;
                    const isLocked = i > completedSteps.length;

                    return (
                      <div 
                        key={i} 
                        onClick={() => handleToggleStep(i)}
                        className={`flex gap-4 items-start p-3.5 rounded-2xl border transition-all duration-300 ${
                          isActive 
                            ? "bg-[#EBF2EB]/20 border-[#7A9E7E]/50 shadow-sm cursor-pointer scale-[1.01]" 
                            : isCompleted
                            ? "bg-white border-border/40 opacity-70 cursor-pointer"
                            : "bg-white border-border/20 opacity-40 cursor-not-allowed"
                        }`}
                      >
                        {/* Step Checkbox/Badge */}
                        <div className="shrink-0 mt-0.5">
                          {isCompleted ? (
                            <span className="w-6 h-6 rounded-full bg-[#7A9E7E] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                              ✓
                            </span>
                          ) : isActive ? (
                            <span className="w-6 h-6 rounded-full bg-white border-2 border-[#7A9E7E] text-[#7A9E7E] font-bold text-xs flex items-center justify-center shadow-sm">
                              {i + 1}
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-[#F5F6F1] border border-border text-textMuted/60 font-bold text-xs flex items-center justify-center">
                              🔒
                            </span>
                          )}
                        </div>

                        {/* Step Description */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-relaxed transition-all ${
                            isCompleted 
                              ? "text-textMuted line-through decoration-[#7A9E7E]/60 font-medium" 
                              : isActive
                              ? "text-textHeading font-semibold"
                              : "text-textHeading/80"
                          }`}>
                            {step}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Kitchen Timer Widget */}
              <div className="bg-[#F5F6F1] border border-border rounded-2xl p-5 space-y-3.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🍳</span>
                    <h4 className="text-xs font-bold text-textHeading uppercase tracking-wider">Kitchen Timer</h4>
                  </div>
                  {kitchenTimerSeconds > 0 && (
                    <span className="text-[10px] font-bold bg-[#EBF2EB] border border-[#D4E6D5] text-[#7A9E7E] px-2 py-0.5 rounded-full uppercase">
                      {isKitchenTimerRunning ? "⏱️ Running" : "⏸️ Paused"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Digital Clock Display */}
                  <div className="text-3xl font-black text-textHeading font-mono tracking-tight select-none">
                    {`${Math.floor(kitchenTimerSeconds / 60).toString().padStart(2, "0")}:${(kitchenTimerSeconds % 60).toString().padStart(2, "0")}`}
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setKitchenTimerSeconds(prev => prev + 60);
                        setIsKitchenTimerRunning(true);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-[#E2E4DC] border border-border rounded-lg text-[10px] font-bold text-textHeading transition-colors shadow-sm"
                    >
                      +1 Min
                    </button>
                    <button
                      onClick={() => {
                        setKitchenTimerSeconds(prev => prev + 180);
                        setIsKitchenTimerRunning(true);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-[#E2E4DC] border border-border rounded-lg text-[10px] font-bold text-textHeading transition-colors shadow-sm"
                    >
                      +3 Min
                    </button>
                    <button
                      onClick={() => {
                        setKitchenTimerSeconds(prev => prev + 300);
                        setIsKitchenTimerRunning(true);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-[#E2E4DC] border border-border rounded-lg text-[10px] font-bold text-textHeading transition-colors shadow-sm"
                    >
                      +5 Min
                    </button>
                  </div>

                  {/* Primary Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (kitchenTimerSeconds > 0) {
                          setIsKitchenTimerRunning(!isKitchenTimerRunning);
                        } else {
                          alert("Please set a time first using the presets above.");
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        isKitchenTimerRunning
                          ? "bg-[#E2E4DC] hover:bg-[#D4D6CC] text-textHeading"
                          : "bg-[#7A9E7E] hover:bg-[#5C7A60] text-white"
                      }`}
                    >
                      {isKitchenTimerRunning ? "Pause" : "Start"}
                    </button>
                    <button
                      onClick={() => {
                        setIsKitchenTimerRunning(false);
                        setKitchenTimerSeconds(0);
                      }}
                      className="px-4 py-2 bg-white hover:bg-[#FEF0EB] hover:text-[#E8815A] hover:border-[#FEE2D5] border border-border rounded-xl text-xs font-bold text-textMuted transition-all shadow-sm"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setActiveRecipe(null)}
                  className="flex-1 py-3 bg-[#E2E4DC] hover:bg-[#D4D6CC] text-textHeading rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Close Details
                </button>
                <button
                  onClick={() => {
                    if (activeRecipe.isAiGenerated) {
                      deductIngredientsFromPantry(activeRecipe.ingredients);
                      alert("Recipe cooked! Used ingredients have been deducted from your pantry stock.");
                    } else {
                      alert("Cooking mode started! Follow the steps to prepare your meal.");
                    }
                    setActiveRecipe(null);
                  }}
                  className="flex-1 py-3 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  {activeRecipe.isAiGenerated ? "Cook & Deduct Stock" : "Start Cooking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Ingredient Overlay Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl border border-border shadow-2xl relative p-8">
            <button 
              onClick={() => {
                clearError();
                setBarcodeError("");
                setIsAddModalOpen(false);
              }}
              className="absolute top-6 right-6 text-textMuted hover:text-textHeading transition-colors"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-bold text-textHeading tracking-tight">Add Ingredients</h2>
              <p className="text-textMuted text-xs mt-1">Upload a photo of your pantry/fridge, or scan a barcode to add items</p>
            </div>

            {/* Tab switch pills */}
            <div className="flex gap-2 p-1 bg-[#F5F5F0] rounded-full border border-border w-fit mx-auto mb-6">
              <button
                type="button"
                onClick={() => {
                  clearError();
                  setBarcodeError("");
                  setAddMode("image");
                }}
                className={`px-5 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all ${
                  addMode === "image"
                    ? "bg-[#9DB89F] text-white shadow-sm"
                    : "text-textMuted hover:text-textHeading"
                }`}
              >
                <CameraIcon className="w-3.5 h-3.5" />
                Image Upload
              </button>
              <button
                type="button"
                onClick={() => {
                  clearError();
                  setBarcodeError("");
                  setAddMode("barcode");
                }}
                className={`px-5 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all ${
                  addMode === "barcode"
                    ? "bg-[#9DB89F] text-white shadow-sm"
                    : "text-textMuted hover:text-textHeading"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 12v1.5m0 0v1.5m0-1.5h1.5m-1.5 0h-1.5M13.5 17.25h1.5m0 0H15m0 0h1.5m0 0h1.5M13.5 19.5h1.5m-3-4.5h1.5m-1.5 1.5h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm1.5-1.5h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm3-1.5h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm1.5-3h.008v.008h-.008v-.008Zm0 1.5h.008v.008h-.008v-.008Z" />
                </svg>
                Barcode Scan
              </button>
              <button
                type="button"
                onClick={() => {
                  clearError();
                  setBarcodeError("");
                  setAddMode("receipt");
                }}
                className={`px-5 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all ${
                  addMode === "receipt"
                    ? "bg-[#9DB89F] text-white shadow-sm"
                    : "text-textMuted hover:text-textHeading"
                }`}
              >
                <span>🧾</span>
                Receipt Scanner
              </button>
            </div>

            <div className="mt-4">
              {addMode === "image" ? (
                <div className="w-full flex flex-col items-center p-6 border border-dashed border-border hover:border-primary bg-[#F9FAF8] rounded-2xl transition-colors">
                  <div className="w-12 h-12 rounded-full bg-[#EBF2EB] flex items-center justify-center mb-4">
                    <CameraIcon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-textHeading mb-1">Scan Pantry Photo</h3>
                  <p className="text-xs text-textMuted text-center max-w-sm mb-6">
                    Take or upload a photo of your fridge or pantry to automatically detect multiple ingredients.
                  </p>
                  
                  <button
                    type="button"
                    onClick={triggerUpload}
                    disabled={isUploading}
                    className="px-6 py-2.5 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    {isUploading ? (
                      <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    )}
                    {isUploading ? progressMessage || "Uploading..." : "Choose Photo"}
                  </button>
                </div>
              ) : addMode === "barcode" ? (
                <div className="w-full flex flex-col items-center">
                  <BarcodeScanner
                    onDetected={handleBarcodeDetected}
                    isSearching={isScanningBarcode}
                  />
                  {barcodeError && (
                    <div className="w-full max-w-md mt-4 rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs font-medium text-danger text-center animate-fade-in">
                      {barcodeError}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full flex flex-col items-center p-6 border border-dashed border-border hover:border-primary bg-[#F9FAF8] rounded-2xl transition-colors">
                  <div className="w-12 h-12 rounded-full bg-[#FEF9EB] border border-[#F5E6C4] flex items-center justify-center mb-4 text-xl">
                    🧾
                  </div>
                  <h3 className="text-sm font-bold text-textHeading mb-1">Scan Grocery Receipt</h3>
                  <p className="text-xs text-textMuted text-center max-w-sm mb-6">
                    Upload a photo of your shopping receipt, and AI will automatically identify and bulk-add all ingredients to your pantry.
                  </p>
                  
                  <button
                    type="button"
                    onClick={triggerReceiptUpload}
                    disabled={isUploading}
                    className="px-6 py-2.5 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    {isUploading ? (
                      <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    )}
                    {isUploading ? progressMessage || "Uploading..." : "Choose Receipt Image"}
                  </button>
                  <input
                    type="file"
                    ref={receiptInputRef}
                    onChange={handleReceiptFileSelected}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to resolve meal image
const getMealImage = (name: string) => {
  if (name.toLowerCase().includes("salad") || name.toLowerCase().includes("quinoa")) {
    return "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=600&auto=format&fit=crop&q=80";
  }
  if (name.toLowerCase().includes("smoothie") || name.toLowerCase().includes("shake")) {
    return "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80";
};

// Helper function to resolve ingredient category
const getIngredientCategory = (name: string): "Fresh" | "Dry" => {
  const dryKeywords = ["quinoa", "rice", "pasta", "lentil", "flour", "oat", "spice", "grain", "bean", "dry", "cereal", "powder", "seed"];
  const lower = name.toLowerCase();
  if (dryKeywords.some(keyword => lower.includes(keyword))) {
    return "Dry";
  }
  return "Fresh";
};

// Helper function to resolve ingredient icons dynamically
const getIngredientIcon = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("chicken") || lower.includes("meat") || lower.includes("beef") || lower.includes("pork") || lower.includes("turkey") || lower.includes("steak") || lower.includes("lamb")) return "🍗";
  if (lower.includes("yogurt") || lower.includes("milk") || lower.includes("cheese") || lower.includes("dairy") || lower.includes("butter")) return "🥛";
  if (lower.includes("spinach") || lower.includes("lettuce") || lower.includes("salad") || lower.includes("cabbage") || lower.includes("kale")) return "🥬";
  if (lower.includes("avocado")) return "🥑";
  if (lower.includes("egg")) return "🥚";
  if (lower.includes("apple") || lower.includes("fruit") || lower.includes("banana") || lower.includes("strawberry") || lower.includes("berry") || lower.includes("peach")) return "🍎";
  if (lower.includes("quinoa") || lower.includes("rice") || lower.includes("oat") || lower.includes("grain") || lower.includes("flour") || lower.includes("pasta") || lower.includes("noodle")) return "🌾";
  if (lower.includes("fish") || lower.includes("salmon") || lower.includes("tuna") || lower.includes("seafood") || lower.includes("shrimp")) return "🐟";
  if (lower.includes("oil") || lower.includes("sauce") || lower.includes("vinegar") || lower.includes("syrup")) return "🫙";
  if (lower.includes("onion") || lower.includes("garlic")) return "🧄";
  if (lower.includes("bread") || lower.includes("toast") || lower.includes("bun") || lower.includes("wrap")) return "🍞";
  if (lower.includes("tomato") || lower.includes("cucumber") || lower.includes("carrot") || lower.includes("broccoli") || lower.includes("pepper") || lower.includes("vegetable")) return "🥦";
  return "🍲"; // default
};

// Helper function to categorize pantry items into physical drawers/compartments
const getPantryItemPlacement = (name: string, category: string): "crisper_drawer" | "fridge_shelf" | "dry_cabinet" => {
  const lowerName = name.toLowerCase();
  
  if (category === "Dry" || lowerName === "quinoa" || lowerName === "rice" || lowerName === "spices" || lowerName === "oats" || lowerName === "flour" || lowerName === "chia") {
    return "dry_cabinet";
  }
  
  const crisperKeywords = ["spinach", "avocado", "lettuce", "tomato", "cucumber", "broccoli", "carrot", "pepper", "lemon", "lime", "herb", "onion", "garlic", "apple", "berry", "banana", "fruit", "cabbage", "kale"];
  if (crisperKeywords.some(keyword => lowerName.includes(keyword))) {
    return "crisper_drawer";
  }
  
  return "fridge_shelf";
};
