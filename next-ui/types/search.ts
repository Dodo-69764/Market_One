export interface SearchResult {
  name: string
  price?: string | number
  source: string
  url: string
  image?: string
  similarity?: number
}

export interface LLMMetadata {
  core_term?: string
  positive_keywords?: string[]
  negative_keywords?: string[]
  categories?: string[]
}

export interface TextSearchResponse {
  items: SearchResult[]
  meta: LLMMetadata
}

export interface ImageSearchResponse {
  items: SearchResult[]
  meta: LLMMetadata
}

export interface SearchFilters {
  priceRange: [number, number]
  categories: string[]
  sources: string[]
  sortBy: string
}

export type ViewMode = "tiles" | "list"
