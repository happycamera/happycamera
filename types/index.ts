export type ProductCondition = "new" | "preloved";

export type ConditionGrade = "MINT" | "EXCELLENT" | "GOOD" | "FAIR" | null;

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  images: string[];
  condition: ProductCondition;
  conditionGrade?: ConditionGrade;
  brand: string;
  slug: string;
  stockQuantity?: number;
  categorySlug?: string;
  categoryName?: string;
  averageRating?: number | null;
  reviews?: Review[];
  createdAt?: string;
}

 export interface CartItem {
  productId: string;
  variantId?: string;
  color?: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stockQuantity?: number;
}
