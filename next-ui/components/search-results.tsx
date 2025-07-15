"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { ExternalLink, ShoppingCart, MessageCircle, GitCompare, Star, TrendingUp, Shield, Zap } from "lucide-react"
import { ProductChatbot } from "./product-chatbot"
import { ProductComparison } from "./product-comparison"
import type { SearchResult, ViewMode } from "@/types/search"

interface SearchResultsProps {
  results: SearchResult[]
  viewMode: ViewMode
  isLoading: boolean
}

export function SearchResults({ results, viewMode, isLoading }: SearchResultsProps) {
  const [selectedProduct, setSelectedProduct] = useState<SearchResult | null>(null)
  const [showChatbot, setShowChatbot] = useState(false)
  const [selectedForComparison, setSelectedForComparison] = useState<SearchResult[]>([])
  const [showComparison, setShowComparison] = useState(false)

  const handleChatWithProduct = (product: SearchResult) => {
    setSelectedProduct(product)
    setShowChatbot(true)
  }

  const handleComparisonToggle = (product: SearchResult) => {
    setSelectedForComparison((prev) => {
      const isSelected = prev.some((p) => p.url === product.url)
      if (isSelected) {
        return prev.filter((p) => p.url !== product.url)
      } else if (prev.length < 2) {
        return [...prev, product]
      }
      return prev
    })
  }

  const handleStartComparison = () => {
    if (selectedForComparison.length === 2) {
      setShowComparison(true)
    }
  }

  if (isLoading) {
    return (
      <div className={viewMode === "tiles" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10">
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-48 w-full rounded-lg bg-white/10" />
                <Skeleton className="h-4 w-3/4 bg-white/10" />
                <Skeleton className="h-4 w-1/2 bg-white/10" />
                <Skeleton className="h-10 w-24 bg-white/10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-10 h-10 text-purple-300" />
          </div>
          <p className="text-purple-200 text-lg">No products found. Try a different search term.</p>
        </CardContent>
      </Card>
    )
  }

  if (viewMode === "list") {
    return (
      <>
        {/* Comparison Controls */}
        {selectedForComparison.length > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-400/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <GitCompare className="w-5 h-5 text-purple-300" />
                  <span className="text-white font-medium">
                    {selectedForComparison.length} product{selectedForComparison.length !== 1 ? "s" : ""} selected for
                    comparison
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedForComparison([])}
                    className="border-purple-400/50 text-purple-200 hover:bg-purple-500/20"
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleStartComparison}
                    disabled={selectedForComparison.length !== 2}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Compare Products
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {results.map((product, index) => (
            <Card
              key={index}
              className="group hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10"
            >
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 relative">
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedForComparison.some((p) => p.url === product.url)}
                        onCheckedChange={() => handleComparisonToggle(product)}
                        disabled={
                          selectedForComparison.length >= 2 && !selectedForComparison.some((p) => p.url === product.url)
                        }
                        className="bg-white/10 border-white/30 data-[state=checked]:bg-purple-600"
                      />
                    </div>
                    <img
                      src={product.image || "/placeholder.svg?height=120&width=120"}
                      alt={product.name}
                      className="w-32 h-32 object-cover rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/placeholder.svg?height=120&width=120"
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-3">
                    <h3 className="font-space-grotesk text-xl font-semibold text-white group-hover:text-purple-200 transition-colors line-clamp-2">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-200 border-purple-400/30">
                        <Shield className="w-3 h-3 mr-1" />
                        {product.source}
                      </Badge>
                      {product.similarity && (
                        <Badge variant="outline" className="border-green-400/50 text-green-300">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {(product.similarity * 100).toFixed(0)}% match
                        </Badge>
                      )}
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                        <span className="text-purple-300 text-sm ml-1">(4.8)</span>
                      </div>
                    </div>

                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Rs. {product.price || "N/A"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(product.url, "_blank")}
                      className="border-purple-400/50 text-purple-200 hover:bg-purple-500/20 group/btn"
                    >
                      <ExternalLink className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                      View Product
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleChatWithProduct(product)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 group/btn"
                    >
                      <MessageCircle className="h-4 w-4 mr-2 group-hover/btn:animate-pulse" />
                      Ask AI
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chatbot Modal */}
        {showChatbot && selectedProduct && (
          <ProductChatbot product={selectedProduct} isOpen={showChatbot} onClose={() => setShowChatbot(false)} />
        )}

        {/* Comparison Modal */}
        {showComparison && selectedForComparison.length === 2 && (
          <ProductComparison
            products={selectedForComparison}
            isOpen={showComparison}
            onClose={() => setShowComparison(false)}
          />
        )}
      </>
    )
  }

  return (
    <>
      {/* Comparison Controls for Tiles View */}
      {selectedForComparison.length > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-400/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <GitCompare className="w-5 h-5 text-purple-300" />
                <span className="text-white font-medium">
                  {selectedForComparison.length} product{selectedForComparison.length !== 1 ? "s" : ""} selected for
                  comparison
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedForComparison([])}
                  className="border-purple-400/50 text-purple-200 hover:bg-purple-500/20"
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={handleStartComparison}
                  disabled={selectedForComparison.length !== 2}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Compare Products
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((product, index) => (
          <Card
            key={index}
            className="group overflow-hidden hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 bg-white/5 backdrop-blur-xl border border-white/10"
          >
            <div className="aspect-square relative overflow-hidden">
              <div className="absolute top-3 left-3 z-10">
                <Checkbox
                  checked={selectedForComparison.some((p) => p.url === product.url)}
                  onCheckedChange={() => handleComparisonToggle(product)}
                  disabled={
                    selectedForComparison.length >= 2 && !selectedForComparison.some((p) => p.url === product.url)
                  }
                  className="bg-white/20 border-white/40 data-[state=checked]:bg-purple-600 shadow-lg"
                />
              </div>

              <img
                src={product.image || "/placeholder.svg?height=300&width=300"}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg?height=300&width=300"
                }}
              />

              {product.similarity && (
                <Badge className="absolute top-3 right-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg">
                  <Zap className="w-3 h-3 mr-1" />
                  {(product.similarity * 100).toFixed(0)}% match
                </Badge>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <CardContent className="p-6 space-y-4">
              <h3 className="font-space-grotesk text-lg font-semibold text-white line-clamp-2 min-h-[3.5rem] group-hover:text-purple-200 transition-colors">
                {product.name}
              </h3>

              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-200 border-purple-400/30">
                  <Shield className="w-3 h-3 mr-1" />
                  {product.source}
                </Badge>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>

              <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Rs. {product.price || "N/A"}
              </p>

              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white group/btn"
                  onClick={() => window.open(product.url, "_blank")}
                >
                  <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:animate-bounce" />
                  Buy Now
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleChatWithProduct(product)}
                  className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20 group/btn"
                >
                  <MessageCircle className="h-4 w-4 group-hover/btn:animate-pulse" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chatbot Modal */}
      {showChatbot && selectedProduct && (
        <ProductChatbot product={selectedProduct} isOpen={showChatbot} onClose={() => setShowChatbot(false)} />
      )}

      {/* Comparison Modal */}
      {showComparison && selectedForComparison.length === 2 && (
        <ProductComparison
          products={selectedForComparison}
          isOpen={showComparison}
          onClose={() => setShowComparison(false)}
        />
      )}
    </>
  )
}
