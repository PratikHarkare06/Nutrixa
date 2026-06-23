import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import {
  CameraIcon,
  HomeIcon,
  InfoIcon,
  MacroChartIcon,
  PlusIcon,
  ShareIcon,
} from "../components/icons";
import { useUploadStore } from "../store/uploadStore";
import { handleImageError } from "../utils/imageHelper";

type ResultsPageProps = {
  onBack: () => void;
  onNavigate: (nextPath: string) => void;
};

const foodCategories: Record<string, string> = {
  "Grilled Chicken": "Lean Protein",
  "Brown Rice": "Whole Grains",
  "Steamed Broccoli": "Vegetables",
  "Grilled Atlantic Salmon": "Lean Protein",
  "Steamed Asparagus": "Vegetables",
  "Lemon Vinaigrette": "Healthy Fats",
  "Banana": "Fruit",
  "Avocado": "Healthy Fats",
  "Yogurt": "Dairy",
  Lettuce: "Leafy Greens",
  Tomatoes: "Vegetables",
  Cucumber: "Vegetables",
  Carrots: "Root Vegetables",
};

const macroColors = {
  protein: "#9DB89F", // Sage Green
  carbs: "#E8815A",   // Orange
  fat: "#D4A847",     // Amber/Yellow
  fiber: "#7A9EBE",   // Blue
};

const formatNumber = (value: number) => {
  if (Number.isInteger(value)) return `${value}`;
  return value.toFixed(1);
};

export const ResultsPage = ({ onBack, onNavigate }: ResultsPageProps) => {
  const analysis = useUploadStore((state) => state.analysis);
  const addIngredientsToPantry = useUploadStore((state) => state.addIngredientsToPantry);
  const deductIngredientsFromPantry = useUploadStore((state) => state.deductIngredientsFromPantry);
  const pantryAnalysis = useUploadStore((state) => state.pantryAnalysis);
  
  const [isSaved, setIsSaved] = useState(false);
  const [isDeducted, setIsDeducted] = useState(false);
  const [isSimilarModalOpen, setIsSimilarModalOpen] = useState(false);

  const currentPantry = useMemo(() => {
    const defaultMockNames = ["Avocados", "Chicken Breast", "Quinoa", "Greek Yogurt", "Spinach"];
    return pantryAnalysis ? pantryAnalysis.identifiedIngredients : defaultMockNames;
  }, [pantryAnalysis]);

  const matchingPantryItems = useMemo(() => {
    if (!analysis) return [];
    const scannedFoods = analysis.foods.map(f => f.name);
    return scannedFoods.filter(foodName => 
      currentPantry.some(p => 
        p.toLowerCase().includes(foodName.toLowerCase()) ||
        foodName.toLowerCase().includes(p.toLowerCase())
      )
    );
  }, [analysis, currentPantry]);

  const chartData = useMemo(() => {
    if (!analysis) return [];
    return [
      { name: "Protein", value: analysis.macros.protein || 1, color: macroColors.protein },
      { name: "Carbs", value: analysis.macros.carbs || 1, color: macroColors.carbs },
      { name: "Fat", value: analysis.macros.fat || 1, color: macroColors.fat },
    ];
  }, [analysis]);

  const totalMacros = useMemo(() => {
    if (!analysis) return 0;
    return (analysis.macros.protein || 0) + (analysis.macros.carbs || 0) + (analysis.macros.fat || 0);
  }, [analysis]);

  const macroPercentages = useMemo(() => {
    if (totalMacros === 0) return { protein: 0, carbs: 0, fat: 0 };
    return {
      protein: Math.round(((analysis?.macros.protein || 0) / totalMacros) * 100),
      carbs: Math.round(((analysis?.macros.carbs || 0) / totalMacros) * 100),
      fat: Math.round(((analysis?.macros.fat || 0) / totalMacros) * 100),
    };
  }, [analysis, totalMacros]);

  if (!analysis) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-bold text-textHeading mb-2">No analysis data</h2>
          <button onClick={onBack} className="bg-primary text-white px-4 py-2 rounded-lg">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const handleSaveToLog = () => {
    setIsSaved(true);
    alert("Saved successfully to log!");
  };

  return (
    <div className="flex-1 min-h-screen bg-background relative overflow-y-auto pb-24">
      {/* Header and Breadcrumb */}
      <header className="px-8 pt-8 pb-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2 text-xs font-semibold text-textMuted mb-6">
          <HomeIcon className="h-3.5 w-3.5" />
          <span className="cursor-pointer hover:text-textHeading" onClick={onBack}>Dashboard</span>
          <span>&gt;</span>
          <span className="text-primary font-bold">Scan Results</span>
        </div>

        <div className="flex justify-between items-center w-full">
          <div>
            <h1 className="text-3xl font-bold text-textHeading tracking-tight">Scan Results</h1>
            <p className="text-textMuted text-sm mt-1">AI-generated nutritional breakdown of your meal</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSaveToLog}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                isSaved ? "bg-emerald-600 text-white" : "bg-[#9DB89F] hover:bg-[#7A9E7E] text-white"
              }`}
            >
              <span>{isSaved ? "✓ Saved" : "Save to Log"}</span>
            </button>
            <button className="px-5 py-2.5 rounded-full bg-white border border-[#E2E4DC] hover:bg-surfaceAlt text-textHeading text-xs font-bold transition-all shadow-sm flex items-center gap-1.5">
              <ShareIcon className="w-3.5 h-3.5" /> Share
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="px-8 py-4 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-8">
        
        {/* Left Column: Image and Macro breakdown */}
        <div className="space-y-6">
          
          {/* Scanned Image Card */}
          <div className="relative rounded-[24px] overflow-hidden border border-border bg-white shadow-sm">
            <img 
              src={analysis.imageUrl} 
              alt="Scanned Food" 
              onError={(e) => handleImageError(e, analysis.foods[0]?.name || "Meal")}
              className="w-full h-80 object-cover"
            />
            {/* Translucent Banner */}
            <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-bold text-[#2C3E2B] flex items-center gap-1.5 shadow-sm">
              <span className="animate-pulse w-2 h-2 rounded-full bg-[#7A9E7E]"></span>
              AI Analysis Active
            </div>
          </div>

          {/* Nutritional Breakdown Card */}
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
            <h2 className="text-xl font-bold text-textHeading mb-6">Nutritional Breakdown</h2>
            
            {/* Macro Pill Boxes */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              <div className="bg-[#FEF0EB] rounded-2xl p-3 border border-[#FEE2D5] text-center">
                <div className="text-xs font-bold text-[#E8815A]">{formatNumber(analysis.macros.calories)} kcal</div>
              </div>
              <div className="bg-[#EBF2EB] rounded-2xl p-3 border border-[#D4E6D5] text-center">
                <div className="text-xs font-bold text-[#7A9E7E]">{formatNumber(analysis.macros.protein)}g Protein</div>
              </div>
              <div className="bg-[#FEF9EB] rounded-2xl p-3 border border-[#FDF0CD] text-center">
                <div className="text-xs font-bold text-[#D4A847]">{formatNumber(analysis.macros.carbs)}g Carbs</div>
              </div>
              <div className="bg-[#F5F6F1] rounded-2xl p-3 border border-[#E2E4DC] text-center">
                <div className="text-xs font-bold text-textHeading">{formatNumber(analysis.macros.fat)}g Fats</div>
              </div>
            </div>

            {/* Macronutrient Ratio Chart */}
            <div className="text-center font-bold text-xs text-textMuted uppercase tracking-wider mb-4">Macronutrient Ratio</div>
            <div className="flex flex-col md:flex-row items-center justify-around gap-6">
              
              <div className="relative w-44 h-44 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={chartData} 
                      cx="50%" 
                      cy="50%" 
                      dataKey="value" 
                      innerRadius={50} 
                      outerRadius={75} 
                      paddingAngle={3} 
                      stroke="none"
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-textHeading">{formatNumber(analysis.macros.calories)}</span>
                  <span className="text-[10px] text-textMuted font-bold uppercase">Total kcal</span>
                </div>
              </div>

              {/* Legends with Percentages */}
              <div className="space-y-4 w-full max-w-xs">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#9DB89F]"></span>
                    <span className="text-sm font-semibold text-textHeading">Protein</span>
                  </div>
                  <span className="text-sm font-bold text-textHeading">{macroPercentages.protein}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#E8815A]"></span>
                    <span className="text-sm font-semibold text-textHeading">Carbs</span>
                  </div>
                  <span className="text-sm font-bold text-textHeading">{macroPercentages.carbs}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#D4A847]"></span>
                    <span className="text-sm font-semibold text-textHeading">Fats</span>
                  </div>
                  <span className="text-sm font-bold text-textHeading">{macroPercentages.fat}%</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Detected Items & Insights */}
        <div className="space-y-6">
          
          {/* Detected Items Card */}
          <section className="bg-white rounded-[24px] border border-border p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-textHeading">Detected Items</h2>
              <span className="text-xs font-bold text-[#888888] bg-[#F5F5F0] px-2.5 py-1 rounded-full border border-border">
                {analysis.foods.length} items
              </span>
            </div>

            <div className="space-y-4">
              {analysis.foods.map((food, index) => {
                const category = foodCategories[food.name] ?? "Ingredient";
                const mockWeights = ["180g", "100g", "120g", "15ml"];
                const weight = mockWeights[index % mockWeights.length];
                return (
                  <div key={food.name} className="flex justify-between items-center pb-4 border-b border-[#F5F5F0] last:border-b-0 last:pb-0">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-[#F5F6F1] border border-border flex items-center justify-center font-bold text-xs text-[#7A9E7E]">
                        {food.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-textHeading text-sm capitalize">{food.name}</h4>
                        <p className="text-xs text-[#10B981] font-semibold mt-0.5">{(food.confidence * 100).toFixed(0)}% match</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-textHeading">{weight}</span>
                  </div>
                );
              })}
            </div>

            <button className="w-full mt-6 py-2.5 bg-white border border-[#E2E4DC] hover:border-primary text-textMuted hover:text-primary rounded-xl text-xs font-bold transition-all shadow-sm">
              Edit Ingredients
            </button>
          </section>

          {/* NutriTrack Insight Card */}
          <section className="bg-[#EBF2EB] border border-[#D4E6D5] rounded-[24px] p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <h3 className="font-bold text-[#2C3E2B] text-base">Nutrixa Insight</h3>
            </div>
            <p className="text-sm text-textBody leading-relaxed">
              This meal is high in Omega-3 fatty acids and lean protein. It covers 65% of your daily Vitamin D requirement.
            </p>
            {/* Advice sub-block */}
            <div className="bg-white rounded-xl p-4 border border-[#D4E6D5]/60 flex items-start gap-2.5">
              <span className="text-base text-yellow-500 mt-0.5">💡</span>
              <p className="text-xs text-textBody leading-relaxed">
                Pair with a glass of water to aid digestion of high-fiber grains.
              </p>
            </div>
          </section>

          {/* Quick Actions Shortcuts */}
          <div className={`grid gap-4 ${matchingPantryItems.length > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
            <button 
              onClick={() => {
                if (!analysis) return;
                const ingredients = analysis.foods.map(f => f.name);
                addIngredientsToPantry(ingredients);
                alert(`Added ${ingredients.join(", ")} to your Pantry inventory!`);
                onNavigate?.("/pantry");
              }}
              className="bg-white hover:bg-surfaceAlt border border-border rounded-2xl p-4 text-center hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-[#EBF2EB] border border-[#D4E6D5] flex items-center justify-center text-[#7A9E7E]">
                🛒
              </div>
              <span className="text-xs font-bold text-textHeading">Add to Pantry</span>
            </button>
            <button 
              onClick={() => setIsSimilarModalOpen(true)}
              className="bg-white hover:bg-surfaceAlt border border-border rounded-2xl p-4 text-center hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-[#FEF9EB] border border-[#FDF0CD] flex items-center justify-center text-[#D4A847]">
                📖
              </div>
              <span className="text-xs font-bold text-textHeading">Similar Recipes</span>
            </button>

            {matchingPantryItems.length > 0 && (
              <button 
                onClick={() => {
                  if (isDeducted) return;
                  deductIngredientsFromPantry(matchingPantryItems);
                  setIsDeducted(true);
                  alert(`Deducted ${matchingPantryItems.join(", ")} from your Pantry stock!`);
                }}
                disabled={isDeducted}
                className={`border rounded-2xl p-4 text-center transition-all flex flex-col items-center justify-center gap-2 group ${
                  isDeducted 
                    ? "bg-[#FEF0EB]/60 border-[#FEE2D5] text-[#E8815A]" 
                    : "bg-white hover:bg-surfaceAlt border-border hover:shadow-md cursor-pointer"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isDeducted 
                    ? "bg-[#FEE2D5] text-[#E8815A]" 
                    : "bg-[#FEF0EB] border border-[#FEE2D5] text-[#E8815A]"
                }`}>
                  {isDeducted ? "✓" : "🥣"}
                </div>
                <span className="text-xs font-bold">
                  {isDeducted ? "Deducted Stock" : `Deduct (${matchingPantryItems.length}) Stock`}
                </span>
              </button>
            )}
          </div>

        </div>
      </main>

      {/* Sticky Action Button for New Scan */}
      <button 
        onClick={onBack}
        className="fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3.5 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white rounded-full font-bold shadow-lg shadow-[#9DB89F]/30 hover:scale-105 active:scale-95 transition-all z-20"
      >
        <PlusIcon className="w-5 h-5" />
        <span>New Analysis</span>
      </button>

      {/* Similar Recipes Modal Overlay */}
      {isSimilarModalOpen && analysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-panel border border-panelBorder rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col animate-slide-up p-6 md:p-8">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-textHeading capitalize">
                  📖 Similar Recipes
                </h2>
                <p className="text-xs text-textMuted mt-1">
                  Healthy alternatives matching {analysis.foods[0]?.name || "scanned food"}
                </p>
              </div>
              <button
                onClick={() => setIsSimilarModalOpen(false)}
                className="bg-surfaceAlt hover:bg-border text-textHeading font-bold w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm text-xs"
              >
                ✕
              </button>
            </div>

            {/* Recipes Stack */}
            <div className="space-y-4 overflow-y-auto max-h-[55vh] pr-1 custom-scrollbar mb-6">
              {(() => {
                const foodName = analysis.foods[0]?.name || "Meal";
                const recipes = foodName.toLowerCase().includes("bhaji") || foodName.toLowerCase().includes("curry") || foodName.toLowerCase().includes("vegetable")
                  ? [
                      {
                        name: "Paneer Butter Masala",
                        prepTime: "25 min",
                        calories: 380,
                        protein: 14,
                        carbs: 12,
                        fat: 30,
                        ingredients: ["Paneer (Cottage Cheese)", "Tomato Purée", "Butter", "Heavy Cream", "Indian Spices"],
                        instructions: ["Sauté spices and garlic in butter.", "Add tomato purée and simmer.", "Add paneer cubes and cream, then cook for 5 mins."]
                      },
                      {
                        name: "Aloo Gobi Matar",
                        prepTime: "20 min",
                        calories: 210,
                        protein: 5,
                        carbs: 28,
                        fat: 8,
                        ingredients: ["Potatoes", "Cauliflower", "Green Peas", "Ginger-Garlic Paste", "Turmeric"],
                        instructions: ["Parboil potatoes and cauliflower.", "Sauté onion, ginger, and spices.", "Add peas and vegetables, cover and cook until tender."]
                      },
                      {
                        name: "Dal Makhani",
                        prepTime: "40 min",
                        calories: 320,
                        protein: 12,
                        carbs: 38,
                        fat: 12,
                        ingredients: ["Black Lentils (Urad Dal)", "Kidney Beans (Rajma)", "Butter", "Tomato Paste", "Cream"],
                        instructions: ["Pressure cook soaked lentils and beans.", "Simmer with butter and tomato paste for 30 mins.", "Stir in cream and spices before serving."]
                      }
                    ]
                  : foodName.toLowerCase().includes("quinoa") || foodName.toLowerCase().includes("salad") || foodName.toLowerCase().includes("bowl")
                  ? [
                      {
                        name: "Zesty Chickpea Salad",
                        prepTime: "10 min",
                        calories: 290,
                        protein: 11,
                        carbs: 35,
                        fat: 12,
                        ingredients: ["Chickpeas", "Cucumbers", "Cherry Tomatoes", "Olive Oil", "Lemon Dressing"],
                        instructions: ["Rinse and drain chickpeas.", "Chop cucumbers and tomatoes.", "Toss everything with olive oil and lemon dressing."]
                      },
                      {
                        name: "Avocado & Egg Salad",
                        prepTime: "12 min",
                        calories: 340,
                        protein: 14,
                        carbs: 8,
                        fat: 28,
                        ingredients: ["Avocados", "Boiled Eggs", "Greek Yogurt", "Chives", "Lemon juice"],
                        instructions: ["Chop boiled eggs and avocados.", "Mash avocado slightly with Greek yogurt and lemon juice.", "Combine with eggs and top with chives."]
                      },
                      {
                        name: "Tofu Quinoa Buddha Bowl",
                        prepTime: "20 min",
                        calories: 410,
                        protein: 18,
                        carbs: 48,
                        fat: 16,
                        ingredients: ["Quinoa", "Firm Tofu", "Roasted Broccoli", "Tahini Sauce", "Sesame Seeds"],
                        instructions: ["Cook quinoa. Pan-fry cubed tofu.", "Roast broccoli florets with salt.", "Assemble bowl and drizzle with tahini dressing."]
                      }
                    ]
                  : [
                      {
                        name: `Healthy Homemade ${foodName}`,
                        prepTime: "15 min",
                        calories: Math.round(analysis.macros.calories * 0.8) || 320,
                        protein: Math.round(analysis.macros.protein) || 15,
                        carbs: Math.round(analysis.macros.carbs * 0.9) || 35,
                        fat: Math.round(analysis.macros.fat * 0.7) || 12,
                        ingredients: ["Fresh organic produce", "Olive oil", "Low-sodium seasoning", "Whole grains"],
                        instructions: ["Prep all ingredients by washing and chopping.", "Sauté with light oil and seasoning.", "Portion and enjoy immediately."]
                      },
                      {
                        name: `Low Carb ${foodName} Alternative`,
                        prepTime: "20 min",
                        calories: Math.round(analysis.macros.calories * 0.65) || 260,
                        protein: Math.round(analysis.macros.protein * 1.1) || 18,
                        carbs: Math.round(analysis.macros.carbs * 0.4) || 15,
                        fat: Math.round(analysis.macros.fat * 0.8) || 14,
                        ingredients: ["Cauliflower substitute", "Lean proteins", "Avocado oil", "Herbs & Spices"],
                        instructions: ["Substitute refined carbs with veggies.", "Cook proteins thoroughly in a hot skillet.", "Garnish with fresh herbs."]
                      }
                    ];

                return recipes.map((recipe, index) => (
                  <div key={index} className="bg-white border border-border rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-textHeading text-sm capitalize">{recipe.name}</h3>
                      <span className="text-[10px] bg-[#EBF2EB] text-[#7A9E7E] px-2 py-0.5 rounded-full font-bold">
                        ⏱ {recipe.prepTime}
                      </span>
                    </div>
                    
                    {/* Macros */}
                    <div className="grid grid-cols-4 gap-2 bg-[#F5F6F1] p-2 rounded-xl text-center text-[10px]">
                      <div>
                        <span className="font-bold text-textHeading">{recipe.calories}</span>
                        <span className="text-[8px] text-textMuted block font-bold uppercase">kcal</span>
                      </div>
                      <div>
                        <span className="font-bold text-[#E8815A]">{recipe.protein}g</span>
                        <span className="text-[8px] text-textMuted block font-bold uppercase">prot</span>
                      </div>
                      <div>
                        <span className="font-bold text-[#D4A847]">{recipe.carbs}g</span>
                        <span className="text-[8px] text-textMuted block font-bold uppercase">carb</span>
                      </div>
                      <div>
                        <span className="font-bold text-[#7A9E7E]">{recipe.fat}g</span>
                        <span className="text-[8px] text-textMuted block font-bold uppercase">fat</span>
                      </div>
                    </div>

                    {/* Ingredients list summary */}
                    <div className="text-[10px] text-textMuted leading-relaxed">
                      <span className="font-bold text-textHeading">Key Ingredients:</span> {recipe.ingredients.join(", ")}
                    </div>
                    
                    <button 
                      onClick={() => {
                        alert(`Successfully added ${recipe.name} to your Daily Diet Plan!`);
                        setIsSimilarModalOpen(false);
                        onNavigate?.("/diet-plan");
                      }}
                      className="w-full py-1.5 bg-[#9DB89F] hover:bg-[#7A9E7E] text-white text-[10px] font-bold rounded-lg transition-colors mt-2"
                    >
                      Add to Diet Plan
                    </button>
                  </div>
                ));
              })()}
            </div>

            <button
              onClick={() => setIsSimilarModalOpen(false)}
              className="w-full py-3 bg-[#E2E4DC] hover:bg-[#D4D6CC] text-textHeading rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Close Recipes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
