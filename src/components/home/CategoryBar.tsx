import React from 'react';
import { Smartphone, Shirt, Sun, ShoppingBag, Utensils, Wrench, Layers } from 'lucide-react';

interface CategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  const categories = [
    { id: '', label: 'All Products', icon: Layers },
    { id: 'Fashion & Ankara', label: 'Fashion & Ankara', icon: Shirt },
    { id: 'Phones & Gadgets', label: 'Phones & Gadgets', icon: Smartphone },
    { id: 'Electronics & Solar', label: 'Electronics & Solar', icon: Sun },
    { id: 'Groceries & Foodstuff', label: 'Groceries & Produce', icon: ShoppingBag },
    { id: 'Home & Kitchen', label: 'Home & Kitchen', icon: Utensils },
    { id: 'Automobiles & Spares', label: 'Auto & Spare Parts', icon: Wrench }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 my-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                isSelected
                  ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-700/50'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
