import { useState } from "react";
import { CloseIcon, CheckIcon, CopyIcon } from "./icons";
import type { GroceryCategory } from "../types";

type GroceryListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  list: GroceryCategory[];
};

export const GroceryListModal = ({ isOpen, onClose, list }: GroceryListModalProps) => {
  const [categories, setCategories] = useState<GroceryCategory[]>(list);
  const [copied, setCopied] = useState(false);

  // Initialize state when list changes
  if (isOpen && categories !== list && list.length > 0) {
    setCategories(list);
  }

  if (!isOpen) return null;

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const newCategories = [...categories];
    newCategories[categoryIndex].items[itemIndex].checked = !newCategories[categoryIndex].items[itemIndex].checked;
    setCategories(newCategories);
  };

  const handleCopy = () => {
    let text = "🛒 My NutriVision Grocery List\n\n";
    categories.forEach(cat => {
      text += `**${cat.category}**\n`;
      cat.items.forEach(item => {
        text += `- [ ] ${item.name} (${item.amount})\n`;
      });
      text += "\n";
    });
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-panel border border-panelBorder rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-panelBorder bg-background/50">
          <div>
            <h2 className="text-xl font-bold text-textMain flex items-center gap-2">
              <span className="text-2xl">🛒</span> Smart Grocery List
            </h2>
            <p className="text-sm text-textMuted mt-1">Generated from your 7-Day Diet Plan</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleCopy}
              className="p-2 rounded-xl border border-panelBorder hover:border-primary text-textMuted hover:text-primary transition-colors flex items-center gap-2"
              title="Copy to clipboard"
            >
              {copied ? <CheckIcon className="w-5 h-5 text-success" /> : <CopyIcon className="w-5 h-5" />}
              <span className="text-sm font-medium hidden sm:block">{copied ? "Copied!" : "Copy"}</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl border border-panelBorder hover:bg-danger/10 text-textMuted hover:text-danger transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-background/30">
          {categories.map((category, cIdx) => (
            <div key={cIdx} className="bg-panel border border-panelBorder rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-background px-5 py-3 border-b border-panelBorder flex justify-between items-center">
                <h3 className="font-bold text-textMain">{category.category}</h3>
                <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-lg">
                  {category.items.filter(i => i.checked).length} / {category.items.length}
                </span>
              </div>
              <div className="divide-y divide-panelBorder/50">
                {category.items.map((item, iIdx) => (
                  <label 
                    key={iIdx} 
                    className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors ${item.checked ? "opacity-50 bg-success/5" : ""}`}
                  >
                    <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${item.checked ? "bg-success border-success text-white" : "border-panelBorder bg-background"}`}>
                      {item.checked && <CheckIcon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 flex justify-between items-center">
                      <span className={`font-medium transition-all ${item.checked ? "line-through text-textMuted" : "text-textMain"}`}>
                        {item.name}
                      </span>
                      <span className="text-sm text-textMuted bg-background px-3 py-1 rounded-full border border-panelBorder">
                        {item.amount}
                      </span>
                    </div>
                    {/* Hidden checkbox for accessibility */}
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={item.checked}
                      onChange={() => toggleItem(cIdx, iIdx)}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
};
