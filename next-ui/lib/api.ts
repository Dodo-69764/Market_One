import type { TextSearchResponse, ImageSearchResponse } from "@/types/search"

// TODO: Replace with your actual backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function searchByText(query: string): Promise<TextSearchResponse> {
  const response = await fetch(`${API_BASE_URL}/search-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  })

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`)
  }

  return response.json()
}

export async function searchByImage(file: File): Promise<ImageSearchResponse> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${API_BASE_URL}/search-image`, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Image search failed: ${response.statusText}`)
  }

  return response.json()
}

// TODO: Add chatbot API integration
export async function chatWithProduct(message: string, product: any, history: any[]) {
  const response = await fetch(`${API_BASE_URL}/chat-product`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      product,
      history,
    }),
  })

  if (!response.ok) {
    throw new Error(`Chat failed: ${response.statusText}`)
  }

  return response.json()
}

// Updated comparison API integration
export async function compareProducts(payload: { product1: any; product2: any }) {
  const response = await fetch(`${API_BASE_URL}/compare-products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Comparison failed: ${response.statusText}`)
  }

  return response.json()
}
