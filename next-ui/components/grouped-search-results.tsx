"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  ShoppingCart,
  MessageCircle,
  GitCompare,
  Star,
  ChevronDown,
  ChevronUp,
  Store,
  Package,
  Zap,
  Shield,
  ExternalLink,
  Layers,
} from "lucide-react"
import { ProductChatbot } from "./product-chatbot"
import { EnhancedProductComparison } from "./enhanced-product-comparison"
import type { SearchResult, ViewMode, SearchFilters } from "@/types/search"

interface GroupedSearchResultsProps {
  results: SearchResult[]
  viewMode: ViewMode
  isLoading: boolean
  filters: SearchFilters
}

interface GroupedResults {
  [source: string]: SearchResult[]
}

export function GroupedSearchResults({ results, viewMode, isLoading, filters }: GroupedSearchResultsProps) {
  const [selectedProduct, setSelectedProduct] = useState<SearchResult | null>(null)
  const [showChatbot, setShowChatbot] = useState(false)
  const [selectedForComparison, setSelectedForComparison] = useState<SearchResult[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set())

  // Debug: Log incoming results
  console.log("Search results:", results)

  // Apply filters and sorting
  const filteredAndSortedResults = useMemo(() => {
    const filtered = results.filter((product) => {
      // Filter by categories (to be enhanced with actual category data)
      if (filters.categories.length > 0) {
        // Placeholder for category filtering
      }

      // Filter by sources, bypass for image search
      if (filters.sources.length > 0 && !filters.isImageSearch) {
        return product.source ? filters.sources.includes(product.source) : false
      }

      return true
    })

    // Debug: Log filtered results
    console.log("Filtered results:", filtered)

    // Apply sorting
    switch (filters.sortBy) {
      case "price-low":
        filtered.sort((a, b) => {
          const priceA = Number.parseFloat(String(a.price || "0").replace(/[^\d.]/g, "")) || 0
          const priceB = Number.parseFloat(String(b.price || "0").replace(/[^\d.]/g, "")) || 0
          return priceA - priceB
        })
        break
      case "price-high":
        filtered.sort((a, b) => {
          const priceA = Number.parseFloat(String(a.price || "0").replace(/[^\d.]/g, "")) || 0
          const priceB = Number.parseFloat(String(b.price || "0").replace(/[^\d.]/g, "")) || 0
          return priceB - priceA
        })
        break
      case "name-asc":
        filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        break
      case "name-desc":
        filtered.sort((a, b) => (b.name || "").localeCompare(a.name || ""))
        break
      case "source":
        filtered.sort((a, b) => (a.source || "").localeCompare(b.source || ""))
        break
      default:
        // Keep relevance order (original order)
        break
    }

    // Debug: Log final filtered and sorted results
    console.log("Filtered and sorted results:", filtered)

    return filtered
  }, [results, filters])

  // Group results by source
  const groupedResults: GroupedResults = filteredAndSortedResults.reduce((acc, product) => {
    const source = product.source || "Unknown"
    if (!acc[source]) {
      acc[source] = []
    }
    acc[source].push(product)
    return acc
  }, {} as GroupedResults)

  // Debug: Log grouped results
  console.log("Grouped results:", groupedResults)

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

  const toggleSourceExpansion = (source: string) => {
    setExpandedSources((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(source)) {
        newSet.delete(source)
      } else {
        newSet.add(source)
      }
      return newSet
    })
  }

  const getSourceIcon = (source: string) => {
    const lowerSource = source.toLowerCase()
    if (lowerSource.includes("daraz")) return <Store className="w-5 h-5 text-orange-400" />
    if (lowerSource.includes("amazon")) return <Package className="w-5 h-5 text-yellow-400" />
    if (lowerSource.includes("aliexpress")) return <Shield className="w-5 h-5 text-red-400" />
    if (lowerSource.includes("ebay")) return <Zap className="w-5 h-5 text-blue-400" />
    return <Store className="w-5 h-5 text-purple-400" />
  }

  const getImageUrl = (product: SearchResult) => {
    if (!product.image || typeof product.image !== "string") {
      console.log(`No valid image for product: ${product.name || "Unknown"}`)
      return "/placeholder.svg?height=300&width=300"
    }

    if (product.image.startsWith("http")) {
      return product.image
    }

    if (product.image.startsWith("/images")) {
      return product.image
    }

    const lowerSource = product.source?.toLowerCase() || "web"
    const folder = lowerSource.includes("daraz") ? "daraz" : "web"
    const imageUrl = `/images/${folder}/${product.image}`
    
    // Debug: Log generated image URL
    console.log(`Image URL for ${product.name || "Unknown"}: ${imageUrl}`)
    
    return imageUrl
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-white/5 backdrop-blur-xl border border-white/10">
            <CardHeader className="pb-4">
              <Skeleton className="h-6 w-32 bg-white/10" />
            </CardHeader>
            <CardContent>
              <div
                className={viewMode === "tiles" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" : "space-y-4"}
              >
                {Array.from({ length: viewMode === "tiles" ? 4 : 3 }).map((_, j) => (
                  <div key={j} className="space-y-3">
                    <Skeleton
                      className={`${viewMode === "tiles" ? "h-48" : "h-24"} w-full rounded-lg bg-white/10`}
                    />
                    <Skeleton className="h-4 w-3/4 bg-white/10" />
                    <Skeleton className="h-4 w-1/2 bg-white/10" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (filteredAndSortedResults.length === 0) {
    return (
      <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-10 h-10 text-purple-300" />
          </div>
          <p className="text-purple-200 text-lg">No products found matching your filters.</p>
          <p className="text-purple-300 text-sm mt-2">Try adjusting your search criteria or clearing filters.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Comparison Controls */}
      {selectedForComparison.length > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-400/30 shadow-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <GitCompare className="w-5 h-5 text-purple-300" />
                <span className="text-white font-medium">
                  {selectedForComparison.length} product{selectedForComparison.length !== 1 ? "s" : ""} selected for
                  comparison
                </span>
                <div className="flex gap-2">
                  {selectedForComparison.map((product, index) => (
                    <Badge key={index} variant="secondary" className="bg-purple-500/30 text-purple-100">
                      {product.name.split(" ").slice(0, 2).join(" ")}
                    </Badge>
                  ))}
 eradicate
                </div>
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
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare Products
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grouped Results */}
      <div className="space-y-6">
        {Object.entries(groupedResults).map(([source, products]) => (
          <Card
            key={source}
            className="group bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/8 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 overflow-hidden"
          >
            <Collapsible open={expandedSources.has(source)} onOpenChange={() => toggleSourceExpansion(source)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors duration-300 rounded-t-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-transparent to-pink-600/10"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-full"></div>

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg">
                          {getSourceIcon(source)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
                          {products.length}
                        </div>
                      </div>
                      <div>
                        <CardTitle className="font-space-grotesk text-2xl text-white group-hover:text-purple-200 transition-colors flex items-center gap-2">
                          {source}
                          <Layers className="w-5 h-5 text-purple-400" />
                        </CardTitle>
                        <p className="text-purple-300 text-sm mt-1 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          {products.length} product{products.length !== 1 ? "s" : ""} • Click to{" "}
                          {expandedSources.has(source) ? "collapse" : "expand"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant="outline"
                        className={`border-purple-400/50 text-purple-300 transition-all duration-300 ${
                          expandedSources.has(source) ? "bg-purple-500/20" : ""
                        }`}
                      >
                        {expandedSources.has(source) ? "Expanded" : "Preview Mode"}
                      </Badge>
                      <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center transition-transform duration-300">
                        {expandedSources.has(source) ? (
                          <ChevronUp className="w-5 h-5 text-purple-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-purple-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent className="transition-all duration-500 ease-in-out">
                <CardContent className="pt-0 pb-6">
                  {!expandedSources.has(source) && products.length > 0 && (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg transform rotate-1 scale-95"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg transform -rotate-1 scale-98"></div>

                      <div className="relative bg-white/5 rounded-lg p-4 border border-white/10">
                        {viewMode === "tiles" ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <ProductTile
                              product={products[0]}
                              isSelected={selectedForComparison.some((p) => p.url === products[0].url)}
                              onToggleComparison={handleComparisonToggle}
                              onChatWithProduct={handleChatWithProduct}
                              isMainProduct={true}
                              remainingCount={products.length - 1}
                              getImageUrl={getImageUrl}
                            />
                            {products.slice(1, 4).map((product, index) => (
                              <div key={index} className="opacity-70 hover:opacity-100 transition-opacity duration-300">
                                <ProductTile
                                  product={product}
                                  isSelected={selectedForComparison.some((p) => p.url === product.url)}
                                  onToggleComparison={handleComparisonToggle}
                                  onChatWithProduct={handleChatWithProduct}
                                  isPreview={true}
                                  getImageUrl={getImageUrl}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {products.slice(0, 3).map((product, index) => (
                              <ProductListItem
                                key={index}
                                product={product}
                                isSelected={selectedForComparison.some((p) => p.url === product.url)}
                                onToggleComparison={handleComparisonToggle}
                                onChatWithProduct={handleChatWithProduct}
                                getImageUrl={getImageUrl}
                                isPreview={index > 0}
                              />
                            ))}
                            {products.length > 3 && (
                              <div className="text-center py-2 text-purple-300 text-sm">
                                +{products.length - 3} more products
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {expandedSources.has(source) && (
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      {viewMode === "tiles" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {products.map((product, index) => (
                            <ProductTile
                              key={index}
                              product={product}
                              isSelected={selectedForComparison.some((p) => p.url === product.url)}
                              onToggleComparison={handleComparisonToggle}
                              onChatWithProduct={handleChatWithProduct}
                              getImageUrl={getImageUrl}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {products.map((product, index) => (
                            <ProductListItem
                              key={index}
                              product={product}
                              isSelected={selectedForComparison.some((p) => p.url === product.url)}
                              onToggleComparison={handleComparisonToggle}
                              onChatWithProduct={handleChatWithProduct}
                              getImageUrl={getImageUrl}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {/* Chatbot Modal */}
      {showChatbot && selectedProduct && (
        <ProductChatbot product={selectedProduct} isOpen={showChatbot} onClose={() => setShowChatbot(false)} />
      )}

      {/* Enhanced Comparison Modal */}
      {showComparison && selectedForComparison.length === 2 && (
        <EnhancedProductComparison
          products={selectedForComparison}
          isOpen={showComparison}
          onClose={() => setShowComparison(false)}
        />
      )}
    </>
  )
}

interface ProductTileProps {
  product: SearchResult
  isSelected: boolean
  onToggleComparison: (product: SearchResult) => void
  onChatWithProduct: (product: SearchResult) => void
  isMainProduct?: boolean
  isPreview?: boolean
  remainingCount?: number
  getImageUrl: (product: SearchResult) => string
}

function ProductTile({
  product,
  isSelected,
  onToggleComparison,
  onChatWithProduct,
  isMainProduct = false,
  isPreview = false,
  remainingCount = 0,
  getImageUrl,
}: ProductTileProps) {
  // Debug: Log product being rendered
  console.log("Rendering ProductTile for:", product)

  const handleBuyClick = () => {
    console.log("Attempting to open URL:", product.url)
    try {
      window.open(product.url, "_blank")
    } catch (error) {
      console.error("Failed to open URL:", error)
    }
  }

  return (
    <Card
      className={`group overflow-hidden transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 ${
        isSelected
          ? "ring-2 ring-purple-500 shadow-2xl shadow-purple-500/50 bg-purple-500/10"
          : "hover:shadow-2xl hover:shadow-purple-500/25 bg-white/5"
      } backdrop-blur-xl border border-white/10 ${isPreview ? "cursor-pointer" : ""}`}
    >
      <div className="aspect-square relative overflow-hidden">
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleComparison(product)}
            className={`bg-white/20 border-white/40 data-[state=checked]:bg-purple-600 shadow-lg transition-all duration-300 ${
              isSelected ? "scale-110" : ""
            }`}
          />
        </div>
        <img
          src={getImageUrl(product)}
          alt={product.name || "Unknown"}
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
        {isMainProduct && remainingCount > 0 && (
          <Badge className="absolute bottom-3 right-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
            +{remainingCount} more
          </Badge>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <CardContent className="p-4 space-y-3">
        <h3 className="font-space-grotesk text-sm font-semibold text-white line-clamp-2 min-h-[2.5rem] group-hover:text-purple-200 transition-colors">
          {product.name || "Unknown"}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
            ))}
          </div>
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-200 border-purple-400/30 text-xs">
            <Shield className="w-2 h-2 mr-1" />
            {product.source || "Unknown"}
          </Badge>
        </div>
        <p className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Rs. {product.price || "N/A"}
        </p>
        {!isPreview && (
          <div className="flex gap-1">
            <Button
              size="sm"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs group/btn"
              onClick={handleBuyClick}
            >
              <ShoppingCart className="h-3 w-3 mr-1 group-hover/btn:animate-bounce" />
              Buy
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onChatWithProduct(product)}
              className="border-blue-400/50 text-blue-300 hover:bg-blue-500/20 group/btn"
            >
              <MessageCircle className="h-3 w-3 group-hover/btn:animate-pulse" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ProductListItemProps {
  product: SearchResult
  isSelected: boolean
  onToggleComparison: (product: SearchResult) => void
  onChatWithProduct: (product: SearchResult) => void
  getImageUrl: (product: SearchResult) => string
  isPreview?: boolean
}

function ProductListItem({
  product,
  isSelected,
  onToggleComparison,
  onChatWithProduct,
  getImageUrl,
  isPreview = false,
}: ProductListItemProps) {
  // Debug: Log product being rendered
  console.log("Rendering ProductListItem for:", product)

  return (
    <Card
      className={`group hover:shadow-md transition-all duration-300 ${
        isSelected
          ? "ring-2 ring-purple-500 shadow-lg shadow-purple-500/30 bg-purple-500/10"
          : "hover:shadow-purple-500/20 bg-white/5"
      } backdrop-blur-xl border border-white/10 ${isPreview ? "opacity-70" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-shrink-0 relative">
            <div className="absolute top-2 left-2 z-10">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleComparison(product)}
                className="bg-white/20 border-white/40 data-[state=checked]:bg-purple-600 shadow-lg"
              />
            </div>
            <img
              src={getImageUrl(product)}
              alt={product.name || "Unknown"}
              className="w-24 h-24 object-cover rounded-lg shadow-lg group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg?height=96&width=96"
              }}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <h3 className="font-space-grotesk text-lg font-semibold text-white group-hover:text-purple-200 transition-colors line-clamp-2">
              {product.name || "Unknown"}
            </h3>

            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-200 border-purple-400/30">
                <Shield className="w-3 h-3 mr-1" />
                {product.source || "Unknown"}
              </Badge>
              {product.similarity && (
                <Badge variant="outline" className="border-green-400/50 text-green-300">
                  <Zap className="w-3 h-3 mr-1" />
                  {(product.similarity * 100).toFixed(0)}% match
                </Badge>
              )}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>

            <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Rs. {product.price || "N/A"}
            </p>
          </div>

          <div className="flex flex-col gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(product.url, "_blank")}
              className="border-purple-400/50 text-purple-200 hover:bg-purple-500/20 group/btn"
            >
              <ExternalLink className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
              View
            </Button>

            <Button
              size="sm"
              onClick={() => onChatWithProduct(product)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 group/btn"
            >
              <MessageCircle className="h-4 w-4 mr-2 group-hover/btn:animate-pulse" />
              Ask AI
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}