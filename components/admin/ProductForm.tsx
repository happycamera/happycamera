"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Trash2 } from "lucide-react";
import MultiImageUpload from "@/components/ui/MultiImageUpload";
import { cn } from "@/lib/utils";
import { CATEGORY_SUBCATEGORIES, isValidSubcategory } from "@/lib/categories";

const CONDITION_GRADES = ["", "MINT", "EXCELLENT", "GOOD", "FAIR"];

type ProductFormData = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  originalPrice: number | null;
  condition: string;
  conditionGrade: string | null;
  conditionNotes: string | null;
  includedAccessories: string[];
  freeGifts: string[];
  shutterCount: number | null;
  mount: string | null;
  format: string | null;
  warranty: string | null;
  description: string;
  categoryId: string;
  subcategory: string | null;
  images: string[];
  stockQuantity: number;
};

interface ProductFormProps {
  categories: { id: string; name: string }[];
  initialData?: ProductFormData;
}

const sectionHeader = "text-xs font-semibold tracking-widest text-gray-400";
const inputBase = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-black transition-shadow";
const inputError = "ring-2 ring-red-400 focus:ring-red-500";
const labelBase = "text-xs font-semibold tracking-widest text-gray-400";
const cardBase = "bg-white border border-[#E5E5E5] rounded-xl p-6";
const helperText = "text-xs text-gray-400 mt-1.5";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validate(errors: Record<string, string>, form: {
  name: string; slug: string; brand: string; price: string; originalPrice: string; stockQty: string;
  categoryId: string; subcategory: string; categoryName: string; description: string; images: string[];
  condition: string; conditionGrade: string; shutterCount: string;
}) {
  if (!form.name.trim()) errors.name = "Name is required.";

  if (!form.slug.trim()) errors.slug = "Slug is required.";
  else if (!SLUG_PATTERN.test(form.slug)) errors.slug = "Slug can only contain lowercase letters, numbers, and hyphens.";

  if (!form.brand.trim()) errors.brand = "Brand is required.";

  const priceNum = parseFloat(form.price);
  if (!form.price || isNaN(priceNum) || priceNum <= 0) errors.price = "Enter a valid price greater than 0.";
  else if (priceNum > 999_999) errors.price = "Price seems unreasonably high (max RM 999,999).";

  if (form.originalPrice) {
    const opNum = parseFloat(form.originalPrice);
    if (isNaN(opNum) || opNum <= 0) errors.originalPrice = "Compare-at price must be a positive number.";
    else if (!isNaN(priceNum) && priceNum > 0 && opNum <= priceNum) {
      errors.originalPrice = "Compare-at price must be greater than the regular price.";
    }
  }

  const stockNum = parseInt(form.stockQty, 10);
  if (!form.stockQty || isNaN(stockNum) || stockNum < 0) errors.stockQty = "Stock quantity must be 0 or more.";
  else if (stockNum > 999_999) errors.stockQty = "Stock quantity seems too high (max 999,999).";

  if (!form.categoryId) errors.categoryId = "Category is required.";

  if (form.categoryId) {
    if (!form.subcategory.trim()) {
      errors.subcategory = "Subcategory is required.";
    } else if (form.categoryName && !isValidSubcategory(form.categoryName, form.subcategory)) {
      errors.subcategory = `"${form.subcategory}" is not a valid subcategory for ${form.categoryName}.`;
    }
  }

  if (!form.description.trim()) errors.description = "Description is required.";

  if (form.condition === "preloved" && !form.conditionGrade) errors.conditionGrade = "Grade is required for preloved items.";

  if (form.shutterCount) {
    const sc = parseInt(form.shutterCount, 10);
    if (isNaN(sc) || sc < 0) errors.shutterCount = "Shutter count must be 0 or more.";
  }

  if (form.images.length === 0) errors.images = "At least one image is required.";
}

export default function ProductForm({ categories, initialData }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;
  const slugManuallyEdited = useRef(false);

  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [brand, setBrand] = useState(initialData?.brand ?? "");
  const [price, setPrice] = useState(initialData ? String(initialData.price) : "");
  const [originalPrice, setOriginalPrice] = useState(initialData?.originalPrice ? String(initialData.originalPrice) : "");
  const [condition, setCondition] = useState<"new" | "preloved">(
    (initialData?.condition as "new" | "preloved") ?? "new"
  );
  const [conditionGrade, setConditionGrade] = useState(initialData?.conditionGrade ?? "");
  const [conditionNotes, setConditionNotes] = useState(initialData?.conditionNotes ?? "");
  const [includedAccessories, setIncludedAccessories] = useState(
    initialData?.includedAccessories?.join(", ") ?? ""
  );
  
const [freeGifts, setFreeGifts] = useState(
  initialData?.freeGifts?.join(", ") ?? ""
);

  const [shutterCount, setShutterCount] = useState(initialData?.shutterCount ? String(initialData.shutterCount) : "");
  const [mount, setMount] = useState(initialData?.mount ?? "");
  const [format, setFormat] = useState(initialData?.format ?? "");
  const [warranty, setWarranty] = useState(initialData?.warranty ?? "");
  const [stockQty, setStockQty] = useState(initialData ? String(initialData.stockQuantity) : "1");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? categories[0]?.id ?? "");
  const [subcategory, setSubcategory] = useState(initialData?.subcategory ?? "");
  const [images, setImages] = useState<string[]>(initialData?.images ?? []);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    if (!slugManuallyEdited.current && !initialData) {
      setSlug(slugify(value));
    }
    setFieldErrors((prev) => ({ ...prev, name: "" }));
  }, [initialData]);

  const handleSlugChange = useCallback((value: string) => {
    slugManuallyEdited.current = true;
    setSlug(value);
    setFieldErrors((prev) => ({ ...prev, slug: "" }));
  }, []);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const errors: Record<string, string> = {};
    const categoryName = categories.find((c) => c.id === categoryId)?.name ?? "";
    validate(errors, {
      name, slug, brand, price, originalPrice, stockQty, categoryId, subcategory, categoryName, description, images,
      condition, conditionGrade, shutterCount,
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setShakeKey((k) => k + 1);
      setError("Please fix the highlighted fields and try again.");
      return;
    }

    setStatus("loading");

    const method = isEditing ? "PATCH" : "POST";
    const url = isEditing ? `/api/products/${initialData!.id}` : "/api/products";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        slug: slug.trim(),
        brand: brand.trim(),
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        condition,
        conditionGrade: condition === "preloved" ? conditionGrade || null : null,
        conditionNotes: condition === "preloved" ? conditionNotes || null : null,
        includedAccessories: includedAccessories
          ? includedAccessories.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        
freeGifts: freeGifts
  ? freeGifts.split(",").map((s) => s.trim()).filter(Boolean)
  : [],

        shutterCount: shutterCount ? parseInt(shutterCount, 10) : null,
        mount: mount || null,
        format: format || null,
        warranty: warranty || null,
        stockQuantity: parseInt(stockQty, 10) || 1,
        description,
        categoryId,
        subcategory: subcategory.trim() || null,
        images,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save. Check all required fields and try again.");
      if (data.fields) {
        setFieldErrors(data.fields);
      }
      setShakeKey((k) => k + 1);
      setStatus("idle");
      return;
    }

    setStatus("success");
    setTimeout(() => router.push("/admin/products"), 400);
  };

  const handleDelete = async () => {
    if (!initialData) return;
    try {
      const res = await fetch(`/api/products/${initialData.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/products");
      } else {
        setError("Failed to delete product.");
      }
    } catch {
      setError("Failed to delete product.");
    }
  };

  const submitLabel = isEditing ? "Update Product" : "Add Product";
  const loadingLabel = isEditing ? "Updating..." : "Creating...";
  const successLabel = isEditing ? "Updated!" : "Created!";
  const isPreloved = condition === "preloved";

  const inpClass = (field: string) => cn(inputBase, fieldErrors[field] && inputError);
  const errMsg = (field: string) =>
    fieldErrors[field] ? <p className="text-xs text-red-500 mt-1">{fieldErrors[field]}</p> : null;

  return (
    <motion.form
      key={shakeKey}
      variants={{
        shake: {
          x: [0, -6, 6, -6, 6, -3, 3, 0],
          transition: { duration: 0.35 },
        },
      }}
      animate={error ? "shake" : undefined}
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">
        <div className="flex flex-col gap-6">
          {/* Card 1 — Core Listing */}
          <div className={cardBase}>
            <p className={sectionHeader}>Core Listing</p>
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <label className={labelBase}>Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={cn("mt-1.5 text-lg font-medium", inpClass("name"))}
                />
                {errMsg("name")}
              </div>
              <div>
                <label className={labelBase}>Slug *</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className={cn("mt-1.5 font-mono", inpClass("slug"))}
                />
                <p className={helperText}>Auto-generated. Edit only if needed.</p>
                {errMsg("slug")}
              </div>
              <div>
                <label className={labelBase}>Brand *</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => { setBrand(e.target.value); clearFieldError("brand"); }}
                  className={cn("mt-1.5", inpClass("brand"))}
                />
                {errMsg("brand")}
              </div>
              <div>
                <label className={labelBase}>Description * &mdash; shown below the buy button on product page</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); clearFieldError("description"); }}
                  className={cn("mt-1.5 resize-none", inpClass("description"))}
                />
                {errMsg("description")}
              </div>
            </div>
          </div>

          {/* Card 2 — Condition Report */}
          <div className={cardBase}>
            <p className={sectionHeader}>Condition Report</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              This entire card shows as the Condition Report block on the product page.
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelBase}>Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as "new" | "preloved")}
                  className={cn("mt-1.5 bg-white", inpClass("condition"))}
                >
                  <option value="new">New</option>
                  <option value="preloved">Preloved</option>
                </select>
              </div>
              {isPreloved && (
                <>
                  <div>
                    <label className={labelBase}>Condition Grade *</label>
                    <select
                      value={conditionGrade}
                      onChange={(e) => { setConditionGrade(e.target.value); clearFieldError("conditionGrade"); }}
                      className={cn("mt-1.5 bg-white", inpClass("conditionGrade"))}
                    >
                      {CONDITION_GRADES.map((g) => (
                        <option key={g} value={g}>{g || "Select grade"}</option>
                      ))}
                    </select>
                    {errMsg("conditionGrade")}
                  </div>
                  <div>
                    <label className={labelBase}>Condition Notes</label>
                    <textarea
                      rows={3}
                      value={conditionNotes}
                      onChange={(e) => { setConditionNotes(e.target.value); clearFieldError("conditionNotes"); }}
                      placeholder="e.g. Minor brassing on edges. Viewfinder clean, RF patch bright. Light seals replaced 2024."
                      className={cn("mt-1.5 resize-none", inpClass("conditionNotes"))}
                    />
                    {errMsg("conditionNotes")}
                  </div>
                  <div>
                    <label className={labelBase}>Shutter Count</label>
                    <input
                      type="number"
                      min="0"
                      value={shutterCount}
                      onChange={(e) => { setShutterCount(e.target.value); clearFieldError("shutterCount"); }}
                      placeholder="e.g. 2400 — leave blank if not applicable"
                      className={cn("mt-1.5", inpClass("shutterCount"))}
                    />
                    {errMsg("shutterCount")}
                  </div>
                </>
              )}
              <div>
                <label className={labelBase}>Mount</label>
                <input
                  type="text"
                  value={mount}
                  onChange={(e) => { setMount(e.target.value); clearFieldError("mount"); }}
                  placeholder="e.g. Canon EF, Leica M, Sony E"
                  className={cn("mt-1.5", inpClass("mount"))}
                />
                {errMsg("mount")}
              </div>
              <div>
                <label className={labelBase}>Format</label>
                <input
                  type="text"
                  value={format}
                  onChange={(e) => { setFormat(e.target.value); clearFieldError("format"); }}
                  placeholder="e.g. 35mm Full Frame, Medium Format, APS-C"
                  className={cn("mt-1.5", inpClass("format"))}
                />
                {errMsg("format")}
              </div>
              <div>
                <label className={labelBase}>Warranty</label>
                <input
                  type="text"
                  value={warranty}
                  onChange={(e) => { setWarranty(e.target.value); clearFieldError("warranty"); }}
                  placeholder="e.g. 1-year warranty, 6-month warranty"
                  className={cn("mt-1.5", inpClass("warranty"))}
                />
                {errMsg("warranty")}
              </div>
              <div>
                <label className={labelBase}>Included Accessories</label>
                <input
                  type="text"
                  value={includedAccessories}
                  onChange={(e) => { setIncludedAccessories(e.target.value); clearFieldError("includedAccessories"); }}
                  placeholder="e.g. Original box, Leica strap, UV filter, Batteries (2x LR44)"
                  className={cn("mt-1.5", inpClass("includedAccessories"))}
                />
                <p className={helperText}>
                  Each comma-separated item becomes a bullet point under Includes on the product page.
                </p>
                {errMsg("includedAccessories")}
              </div>
            
<div>
  <label className={labelBase}>🎁 Free Gifts</label>
  <input
    type="text"
    value={freeGifts}
    onChange={(e) => setFreeGifts(e.target.value)}
    placeholder="e.g. Camera Bag, 64GB SD Card, Cleaning Kit"
   
className={cn("mt-1.5", inpClass("freeGifts"))}

  />
  <p className={helperText}>
    Separate each free gift with a comma. Leave blank if no free gifts.
  </p>
</div>

            </div>
          </div>

          {/* Card 3 — Pricing & Stock */}
          <div className={cardBase}>
            <p className={sectionHeader}>Pricing &amp; Stock</p>
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <label className={labelBase}>Price (RM) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => { setPrice(e.target.value); clearFieldError("price"); }}
                  className={cn("mt-1.5", inpClass("price"))}
                />
                {errMsg("price")}
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label className={labelBase}>Compare-at Price (RM)</label>
                  {originalPrice.trim() !== "" && (
                    <button
                      type="button"
                      onClick={() => { setOriginalPrice(""); clearFieldError("originalPrice"); }}
                      className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors py-1 -my-1 shrink-0"
                    >
                      Remove sale price
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={originalPrice}
                  onChange={(e) => { setOriginalPrice(e.target.value); clearFieldError("originalPrice"); }}
                  placeholder="e.g. 7299 — leave blank for no sale"
                  className={cn("mt-1.5", inpClass("originalPrice"))}
                />
                <p className={helperText}>
                  When set above the regular price, the storefront shows an &ldquo;ON SALE&rdquo; badge and strikethrough. Leave blank for no sale.
                </p>
                {errMsg("originalPrice")}
              </div>
              <div>
                <label className={labelBase}>Stock Quantity *</label>
                <input
                  type="number"
                  min="0"
                  value={stockQty}
                  onChange={(e) => { setStockQty(e.target.value); clearFieldError("stockQty"); }}
                  className={cn("mt-1.5", inpClass("stockQty"))}
                />
                {errMsg("stockQty")}
              </div>
              <p className={helperText}>
                Stock &le; 1 shows &ldquo;ONLY 1 LEFT&rdquo; badge on product page. Stock = 0 hides the buy button.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Card 4 — Category */}
          <div className={cardBase}>
            <p className={sectionHeader}>Category *</p>
            <div className="mt-4">
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategory("");
                  clearFieldError("categoryId");
                  clearFieldError("subcategory");
                }}
                className={cn("bg-white", inpClass("categoryId"))}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errMsg("categoryId")}
            </div>

            <div className="mt-4">
              <label className={labelBase}>Subcategory *</label>
              <select
                value={subcategory}
                onChange={(e) => { setSubcategory(e.target.value); clearFieldError("subcategory"); }}
                className={cn("mt-1.5 bg-white", inpClass("subcategory"))}
              >
                <option value="">Select subcategory</option>
                {CATEGORY_SUBCATEGORIES[categories.find((c) => c.id === categoryId)?.name ?? ""]?.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
              {errMsg("subcategory")}
            </div>
          </div>

          {/* Card 5 — Images */}
          <div className={cardBase}>
            <p className={sectionHeader}>Images *</p>
            <p className={helperText}>
              First image is the cover shown in listings. Drag to reorder if supported.
            </p>
            <div className="mt-3">
              <MultiImageUpload images={images} onChange={(imgs) => { setImages(imgs); clearFieldError("images"); }} />
            </div>
            {errMsg("images")}
          </div>

          {/* Card 6 — Publish */}
          <div className={cn(cardBase, "sticky top-6")}>
            <p className={sectionHeader}>Publish</p>
            <div className="mt-4">
              <button
                type="submit"
                disabled={status !== "idle"}
                className="w-full bg-[#1A1A1A] text-white text-sm font-medium py-3 rounded-lg tracking-wide hover:bg-[#333] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "loading"
                  ? loadingLabel
                  : status === "success"
                    ? successLabel
                    : submitLabel}
              </button>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-3 text-xs text-red-500"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {isEditing && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-red-500 flex-1">Delete this product?</p>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={12} />
                      Delete Product
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.form>
  );
}
