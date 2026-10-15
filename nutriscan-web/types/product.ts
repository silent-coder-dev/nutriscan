export type NutriScore = 'A' | 'B' | 'C' | 'D' | 'E' | 'UNKNOWN';

export type ProductSource = 'OPEN_FOOD_FACTS' | 'AI_ESTIMATE';

// Indian veg mark, worked out from the label text
export type VegStatus = 'VEG' | 'NON_VEG' | 'UNKNOWN';

export interface Product {
  barcode: string;
  productName: string;
  brand: string | null;
  nutriScore: NutriScore;
  imageUrl: string | null;
  ingredientsText: string | null;
  simplifiedIngredients?: string | null;
  allergens: string | null;
  // Any nutrient can be missing for a product
  calories100g: number | null;
  sugars100g: number | null;
  fat100g: number | null;
  proteins100g: number | null;
  sodium100g: number | null;
  source?: ProductSource | null;
  vegStatus?: VegStatus;
  // Scout reward context for the current scan
  isNewDiscovery?: boolean;
  earnedPoints?: number;
  totalScoutScore?: number;
  totalUniqueDiscoveries?: number;
}
