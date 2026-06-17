/**
 * Types para productos del WooCommerce de Tory Skateshop
 */

export interface ExternalProductImage {
  sourceUrl: string;
  altText: string | null;
}

export interface VariationAttribute {
  name: string;       // "pa_tallas-us-men"
  value: string;      // "" (viene vacío, no se usa)
  label: string;      // "pa_tallas-us-men"
}

export interface Variation {
  id: string;           // GraphQL ID base64
  databaseId: number;   // ID numérico único por variation
  name: string;
  price: string | null;
  regularPrice: string | null;
  salePrice: string | null;
  stockStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'ON_BACKORDER' | null;
  stockQuantity: number | null;
  purchasable: boolean | null;
  image: ExternalProductImage | null;
  attributes: { nodes: VariationAttribute[] };
}

export interface ProductAttribute {
  name: string;
  label: string;     // "tallas"
  variation: boolean;
  visible: boolean;
  options: string[]; // ["7-0-us-40-eur-38-col-25-cm", ...]
}

export interface ExternalProduct {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  price: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  image: ExternalProductImage | null;
  // WPGQL WC devuelve connections { nodes: [...] } no arrays directos
  variations?: { nodes: Variation[] };
  attributes?: { nodes: ProductAttribute[] };
}

export interface ExternalCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  count: number | null;
  image: ExternalProductImage | null;
}
