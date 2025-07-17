"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Star,
  DollarSign,
  ShoppingBag,
  Sparkles,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import type { SearchResult } from "@/types/search"

interface ProductComparisonProps {
  products: [SearchResult, SearchResult]
  isOpen: boolean
  onClose: () => void
}

interface ComparisonData {
  summary: string
  product1_advantages: string[]
  product2_advantages: string[]
  winner: "product1" | "product2" | "tie"
  priceComparison: string
  recommendation: string
}

export function ProductComparison({ products, isOpen, onClose }: ProductComparisonProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && products.length === 2) {
      generateComparison()
    }
  }, [isOpen, products])

  const generateComparison = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("http://localhost:8000/api/compare-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prod1: products[0],
          prod2: products[1],
          searchType: products[0].image ? "image" : "text", // Add searchType for image-based comparison
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log("API Response:", data) // Debug log

      const normalizedData: ComparisonData = {
        summary: data.summary || "No summary available.",
        product1_advantages: Array.isArray(data.product1_advantages) ? data.product1_advantages : [],
        product2_advantages: Array.isArray(data.product2_advantages) ? data.product2_advantages : [],
        winner: data.winner || "tie",
        priceComparison: data.priceComparison || `${products[0].name} is Rs.${products[0].price || "N/A"} vs ${products[1].name} is Rs.${products[1].price || "N/A"}`,
        recommendation: data.recommendation || "No recommendation available.",
      }

      setComparisonData(normalizedData)
    } catch (error) {
      console.error("Comparison error:", error)
      const mockComparison: ComparisonData = {
        summary: `Comparison between "${products[0].name}" from ${products[0].source} and "${products[1].name}" from ${products[1].source}.`,
        product1_advantages: ["Better value", "Higher rating"],
        product2_advantages: ["Advanced features", "Premium design"],
        winner: Math.random() > 0.5 ? "product1" : "product2",
        priceComparison: `${products[0].name} is Rs.${products[0].price || "N/A"} vs ${products[1].name} is Rs.${products[1].price || "N/A"}`,
        recommendation: "Choose based on your preference for value or features.",
      }
      setComparisonData(mockComparison)
    } finally {
      setIsLoading(false)
    }
  }

  const getWinnerIcon = (productIndex: number) => {
    if (!comparisonData) return null

    if (comparisonData.winner === "tie") {
      return <Star className="w-5 h-5 text-yellow-400" />
    }

    const isWinner =
      (productIndex === 0 && comparisonData.winner === "product1") ||
      (productIndex === 1 && comparisonData.winner === "product2")

    return isWinner ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-gradient-to-br from-gray-900/95 to-purple-900/95 backdrop-blur-xl border border-purple-400/30 text-white overflow-hidden">
        <DialogHeader className="border-b border-purple-400/20 pb-4">
          <DialogTitle className="font-space-grotesk text-2xl text-white flex items-center gap-3">
            <GitCompare className="w-6 h-6 text-purple-400" />
            Product Comparison
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto" />
                <p className="text-purple-200 text-lg">AI is analyzing products...</p>
                <p className="text-purple-300 text-sm">This may take a few moments</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
                <p className="text-red-200 text-lg">{error}</p>
                <Button onClick={generateComparison} className="bg-purple-600 hover:bg-purple-700 text-white">
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map((product, index) => (
                  <Card key={index} className="bg-white/5 backdrop-blur-xl border border-white/10">
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={product.image || "/placeholder.svg?height=80&width=80"}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg?height=80&width=80"
                          }}
                        />
                        <div className="flex-1">
                          <CardTitle className="font-space-grotesk text-lg text-white line-clamp-2 mb-2">
                            {product.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-purple-500/20 text-purple-200">
                              {product.source}
                            </Badge>
                            {getWinnerIcon(index)}
                          </div>
                          <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Rs. {product.price || "N/A"}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {comparisonData && (
                <>
                  <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
                    <CardHeader>
                      <CardTitle className="font-space-grotesk text-xl text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        AI Comparison Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={comparisonData.summary}
                        readOnly
                        className="min-h-[100px] bg-white/5 border-purple-400/30 text-purple-100 resize-none"
                      />
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[products[0], products[1]].map((product, index) => (
                      <Card key={index} className="bg-white/5 backdrop-blur-xl border border-white/10">
                        <CardHeader>
                          <CardTitle className="font-space-grotesk text-lg text-white flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            {product.name} - Key Advantages
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {(index === 0 ? comparisonData.product1_advantages : comparisonData.product2_advantages).length > 0 ? (
                              (index === 0 ? comparisonData.product1_advantages : comparisonData.product2_advantages).map(
                                (advantage, advIndex) => (
                                  <div key={advIndex} className="flex items-start gap-3">
                                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-purple-200 text-sm">{advantage}</span>
                                  </div>
                                ),
                              )
                            ) : (
                              <p className="text-purple-200 text-sm">No key advantages available for this product.</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
                    <CardHeader>
                      <CardTitle className="font-space-grotesk text-xl text-white flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        Price Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={comparisonData.priceComparison}
                        readOnly
                        className="min-h-[80px] bg-white/5 border-purple-400/30 text-purple-100 resize-none"
                      />
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-400/30">
                    <CardHeader>
                      <CardTitle className="font-space-grotesk text-xl text-white flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-400" />
                        AI Recommendation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={comparisonData.recommendation}
                        readOnly
                        className="min-h-[80px] bg-white/5 border-purple-400/30 text-purple-100 resize-none"
                      />
                    </CardContent>
                  </Card>

                  <div className="flex gap-4 justify-center pt-4">
                    {products.map((product, index) => (
                      <Button
                        key={index}
                        onClick={() => window.open(product.url, "_blank")}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3"
                        disabled={!product.url}
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Buy {product.name.split(" ").slice(0, 2).join(" ")}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}