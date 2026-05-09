import { useCallback, useRef, useState } from "react";
import { SparklesIcon, CameraIcon, FireIcon, ProteinIcon, BoltIcon } from "../components/icons";
import { useUploadStore } from "../store/uploadStore";

export const PantryPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    pantryAnalysis,
    dragActive,
    isUploading,
    errorMessage,
    progressMessage,
    setDragActive,
    uploadPantryImage,
    setPantryAnalysis
  } = useUploadStore();

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    },
    [setDragActive],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        await uploadPantryImage(e.dataTransfer.files[0]);
      }
    },
    [setDragActive, uploadPantryImage],
  );

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await uploadPantryImage(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setPantryAnalysis(null);
  };

  if (pantryAnalysis) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-20 fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-textMain tracking-tight">Pantry AI Chef</h1>
            <p className="text-textMuted text-sm mt-1">
              Recipes generated using ingredients found in your photo.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-panel border border-panelBorder rounded-lg text-sm font-medium hover:border-primary transition-colors"
          >
            Scan Another Fridge
          </button>
        </div>

        {/* Ingredients Found */}
        <div className="bg-panel border border-panelBorder rounded-2xl p-6">
          <h2 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-4">Identified Ingredients</h2>
          <div className="flex flex-wrap gap-2">
            {pantryAnalysis.identifiedIngredients.map((ingredient, idx) => (
              <div key={idx} className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full text-sm font-medium">
                {ingredient}
              </div>
            ))}
          </div>
        </div>

        {/* Recipes */}
        <h2 className="text-xl font-bold text-textMain pt-4">Suggested Recipes</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {pantryAnalysis.recipes.map((recipe, idx) => (
            <div key={idx} className="bg-panel border border-panelBorder rounded-2xl overflow-hidden hover:border-primary/50 transition-colors flex flex-col slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="p-6 flex-1 flex flex-col">
                <div className="text-xs font-bold text-primary tracking-wider uppercase mb-2">
                  ⏱ {recipe.prepTime}
                </div>
                <h3 className="text-xl font-bold text-textMain mb-2 leading-tight">{recipe.name}</h3>
                <p className="text-sm text-textMuted mb-6 flex-1">{recipe.description}</p>
                
                {/* Macros */}
                <div className="grid grid-cols-4 gap-2 mb-6 bg-background rounded-xl p-3 border border-panelBorder">
                  <div className="text-center">
                    <div className="text-[10px] text-textMuted font-medium uppercase">Kcal</div>
                    <div className="font-bold text-textMain">{recipe.calories}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-textMuted font-medium uppercase">Pro</div>
                    <div className="font-bold text-blue-500">{recipe.protein}g</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-textMuted font-medium uppercase">Carb</div>
                    <div className="font-bold text-green-500">{recipe.carbs}g</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-textMuted font-medium uppercase">Fat</div>
                    <div className="font-bold text-yellow-500">{recipe.fat}g</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-textMain uppercase mb-2">You need:</h4>
                    <ul className="text-sm text-textMuted space-y-1">
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span> {ing}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold text-textMain uppercase mb-2">Instructions:</h4>
                    <ol className="text-sm text-textMuted space-y-2 list-decimal list-inside marker:text-primary marker:font-bold">
                      {recipe.instructions.map((inst, i) => (
                        <li key={i}>{inst}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-textMain tracking-tight mb-3">Pantry AI Chef</h1>
        <p className="text-textMuted max-w-lg mx-auto">
          Snap a picture of your open fridge, pantry, or ingredients on the counter. Our AI will instantly identify them and generate healthy recipes that fit your diet!
        </p>
      </div>

      <div
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ${
          dragActive 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-panelBorder bg-panel hover:border-primary/50 hover:bg-panel/80"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <SparklesIcon className="w-64 h-64 text-primary rotate-12" />
        </div>

        <div className="relative p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
          {isUploading ? (
            <div className="flex flex-col items-center space-y-6">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                <div className="relative bg-primary text-white p-5 rounded-full flex items-center justify-center">
                  <SparklesIcon className="w-10 h-10 animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-textMain">Analyzing Ingredients...</h3>
                <p className="text-textMuted mt-2">{progressMessage || "Generating recipes..."}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-background p-6 rounded-full shadow-xl shadow-black/5 mb-8 group-hover:scale-110 transition-transform duration-300">
                <CameraIcon className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-textMain mb-3">
                Drop a photo of your fridge here
              </h3>
              <p className="text-textMuted mb-8 max-w-sm">
                Supports JPG, PNG, and JPEG formats up to 10MB
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleChange}
                className="hidden"
                id="pantry-upload"
              />
              <label
                htmlFor="pantry-upload"
                className="px-8 py-4 bg-primary text-white rounded-xl font-bold cursor-pointer hover:bg-orange-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/30"
              >
                Choose Photo
              </label>

              {errorMessage && (
                <div className="mt-6 text-danger text-sm font-medium bg-danger/10 px-4 py-2 rounded-lg border border-danger/20">
                  {errorMessage}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
