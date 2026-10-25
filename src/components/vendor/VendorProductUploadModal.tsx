import React, { useState } from 'react';
import { Product, ProductVariant } from '../../types';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  UploadCloud,
  Plus,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface VendorProductUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSuccess: (product: Product) => void;
}

export const VendorProductUploadModal: React.FC<VendorProductUploadModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSuccess
}) => {
  const { currentUser, currentVendorProfile } = useAuth();

  const [name, setName] = useState(productToEdit?.name || '');
  const [description, setDescription] = useState(productToEdit?.description || '');
  const [category, setCategory] = useState(productToEdit?.category || 'Fashion & Ankara');
  const [subcategory, setSubcategory] = useState(productToEdit?.subcategory || 'African Wax & Laces');
  const [price, setPrice] = useState<number | ''>(productToEdit?.price || '');
  const [originalPrice, setOriginalPrice] = useState<number | ''>(productToEdit?.originalPrice || '');
  const [stock, setStock] = useState<number | ''>(productToEdit?.stock || 10);
  const [sku, setSku] = useState(productToEdit?.sku || `SKU-${Date.now().toString().slice(-6)}`);
  const [brand, setBrand] = useState(productToEdit?.brand || '');
  const [condition, setCondition] = useState<'new' | 'refurbished' | 'handmade'>(
    productToEdit?.condition || 'new'
  );
  const [weightKg, setWeightKg] = useState<number | ''>(productToEdit?.weightKg || 1.0);
  const [prepTimeHours, setPrepTimeHours] = useState<number>(productToEdit?.prepTimeHours || 24);
  const [deliveryCoverage, setDeliveryCoverage] = useState<'nationwide' | 'state_only' | 'regional'>(
    productToEdit?.deliveryCoverage || 'nationwide'
  );

  // Mandatory images array!
  const [images, setImages] = useState<string[]>(
    productToEdit?.images || ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80']
  );
  const [newImageUrl, setNewImageUrl] = useState('');

  // Variants
  const [variants, setVariants] = useState<ProductVariant[]>(
    productToEdit?.variants || [
      { id: 'var-1', color: 'Default Style', size: 'Standard', stock: 10, sku: `VAR-1` }
    ]
  );
  const [newVarColor, setNewVarColor] = useState('');
  const [newVarSize, setNewVarSize] = useState('');
  const [newVarStock, setNewVarStock] = useState<number | ''>(10);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages([...images, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    if (images.length <= 1) {
      setError('At least one product image is mandatory before publishing.');
      return;
    }
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddVariant = () => {
    if (!newVarColor && !newVarSize) {
      setError('Please provide at least a color or size for the new option.');
      return;
    }
    const newVariant: ProductVariant = {
      id: `var-${Date.now()}`,
      color: newVarColor || undefined,
      size: newVarSize || undefined,
      stock: Number(newVarStock) || 5,
      sku: `${sku}-${variants.length + 1}`
    };
    setVariants([...variants, newVariant]);
    setNewVarColor('');
    setNewVarSize('');
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate mandatory images check
    if (!images || images.length === 0) {
      setError('A vendor must upload at least one product picture before publishing.');
      return;
    }

    if (!currentUser) {
      setError('User session missing.');
      return;
    }

    if (!price || Number(price) <= 0) {
      setError('Please specify a valid selling price in NGN.');
      return;
    }

    const calculatedStock = variants.length > 0
      ? variants.reduce((sum, v) => sum + v.stock, 0)
      : Number(stock);

    setIsSubmitting(true);
    try {
      let savedProduct: Product;
      if (productToEdit) {
        savedProduct = await db.updateProduct(
          productToEdit.id,
          {
            name,
            description,
            category,
            subcategory,
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : undefined,
            stock: calculatedStock,
            sku,
            brand: brand || undefined,
            condition,
            weightKg: weightKg ? Number(weightKg) : undefined,
            prepTimeHours,
            deliveryCoverage,
            images,
            variants
          },
          currentUser.id
        );
      } else {
        savedProduct = await db.createProduct(
          {
            vendorId: currentVendorProfile?.id || '',
            vendorBusinessName: currentVendorProfile?.businessName || 'Verified Vendor',
            vendorLocation: `${currentVendorProfile?.businessAddress}, ${currentVendorProfile?.state}`,
            name,
            description,
            category,
            subcategory,
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : undefined,
            stock: calculatedStock,
            sku,
            brand: brand || undefined,
            condition,
            weightKg: weightKg ? Number(weightKg) : undefined,
            prepTimeHours,
            deliveryCoverage,
            images,
            variants
          },
          currentUser.id
        );
      }

      setIsSubmitting(false);
      onSuccess(savedProduct);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to save product');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-amber-300">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {productToEdit ? 'Edit Product Listing' : 'Upload New Product for Sale'}
              </h3>
              <p className="text-xs text-emerald-200">
                Vendor: {currentVendorProfile?.businessName || 'JAGA Merchant'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: MANDATORY PICTURE UPLOAD */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-xs">
                <ImageIcon className="w-4 h-4 text-emerald-700" />
                <span>1. Product Pictures (Mandatory — At Least 1 Picture Required) *</span>
              </label>
              <span className="text-[11px] text-emerald-800 font-semibold">
                {images.length} Image{images.length === 1 ? '' : 's'} attached
              </span>
            </div>

            {/* Cloud Storage Pending Notice (Rule 6) */}
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
              <strong>⚠️ Cloud Storage Status:</strong> Direct file uploads from your device camera/gallery are pending Firebase Storage (Blaze plan upgrade). Please enter a public image URL or select from verified marketplace product photos below. <em>Permanent base64 image strings are disabled to protect database limits.</em>
            </div>

            {/* Thumbnail previews */}
            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-300 group">
                  <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-bold rounded">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded opacity-0 group-hover:opacity-100 transition"
                    title="Remove image"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Preset Nigerian Marketplace Photos for convenience */}
            <div>
              <p className="text-[11px] font-semibold text-slate-600 mb-1">Quick Verified Photo Presets:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Ankara Wax Fabric', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80' },
                  { label: 'Senator Suit', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80' },
                  { label: 'Solar Inverter', url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80' },
                  { label: 'Oraimo Earbuds', url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80' },
                  { label: 'Smart Android TV', url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80' },
                  { label: 'Benue Yams', url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80' },
                  { label: 'Palm Oil Gallon', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80' },
                  { label: 'Redmi Smartphone', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02560?auto=format&fit=crop&w=800&q=80' }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      if (!images.includes(preset.url)) {
                        setImages([...images, preset.url]);
                      }
                    }}
                    className="px-2 py-1 rounded-md bg-white border border-slate-200 hover:border-emerald-500 text-[10px] text-slate-700 transition"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Add Image URL input */}
            <div className="flex gap-2 pt-1">
              <input
                type="url"
                placeholder="Paste public image URL (e.g. https://...)..."
                value={newImageUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith('data:image')) {
                    setError('Base64 image strings are disabled. Please use direct public image URLs to protect database capacity.');
                    return;
                  }
                  setError(null);
                  setNewImageUrl(val);
                }}
                className="flex-1 text-xs p-2 rounded-xl border border-slate-300 focus:outline-emerald-600"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs"
              >
                + Add Picture
              </button>
            </div>
          </div>

          {/* Section 2: Basic Information */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
              2. Basic Information
            </h4>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Product Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Premium 100% Cotton Hollandais Wax Ankara (6 Yards)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Detailed Description *</label>
              <textarea
                rows={3}
                required
                placeholder="Describe fabric grade, origin, technical specifications, warranty, what is in the box..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Primary Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Fashion & Ankara">Fashion & Ankara</option>
                  <option value="Phones & Gadgets">Phones & Gadgets</option>
                  <option value="Electronics & Solar">Electronics & Solar</option>
                  <option value="Groceries & Foodstuff">Groceries & Foodstuff</option>
                  <option value="Home & Kitchen">Home & Kitchen</option>
                  <option value="Automobiles & Spares">Automobiles & Spares</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Subcategory *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. African Wax & Laces"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Pricing & Inventory */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
              3. Pricing & Inventory (Nigerian Naira ₦)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Selling Price (₦ NGN) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 18500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Previous Price (Optional for Discount)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 24000"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">SKU / Product Code</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Brand / Maker</label>
                <input
                  type="text"
                  placeholder="e.g. Vlisco / Oraimo / Royal"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="new">Brand New</option>
                  <option value="refurbished">Verified Refurbished</option>
                  <option value="handmade">Nigerian Handmade / Bespoke</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Delivery Coverage</label>
                <select
                  value={deliveryCoverage}
                  onChange={(e) => setDeliveryCoverage(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="nationwide">Nationwide (All 36 States)</option>
                  <option value="state_only">Vendor State Only</option>
                  <option value="regional">Regional / Southwest</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Variants & Stock Breakdown */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                4. Product Variants & Color/Size Stock
              </h4>
              <span className="text-[11px] text-slate-500">{variants.length} option(s) defined</span>
            </div>

            {/* Variant list */}
            <div className="space-y-2">
              {variants.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900">
                      {[v.color, v.size, v.optionName].filter(Boolean).join(' · ')}
                    </span>
                    <span className="text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                      Stock: {v.stock}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{v.sku}</span>
                  </div>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(v.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Variant Form */}
            <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Color / Style</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Blue"
                  value={newVarColor}
                  onChange={(e) => setNewVarColor(e.target.value)}
                  className="w-full text-xs p-1.5 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Size / Option</label>
                <input
                  type="text"
                  placeholder="e.g. 6 Yards / XL"
                  value={newVarSize}
                  onChange={(e) => setNewVarSize(e.target.value)}
                  className="w-full text-xs p-1.5 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Stock Qty</label>
                <input
                  type="number"
                  placeholder="10"
                  value={newVarStock}
                  onChange={(e) => setNewVarStock(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs p-1.5 rounded-lg border border-slate-300"
                />
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs"
              >
                + Add Option
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <span>{productToEdit ? 'Save Changes to Listing' : 'Publish Product to JAGA Marketplace'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
