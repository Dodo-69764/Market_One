"use client"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  GitCompare,
  TrendingUp,
  Star,
  DollarSign,
  ShoppingBag,
  Sparkles,
  CheckCircle,
  Loader2,
  BarChart3,
  FileText,
  Zap,
  Award,
  Shield,
  AlertTriangle
} from "lucide-react"

interface SearchResult {
  name: string
  price: number | null
  description?: string
  image?: string
  source?: string
  similarity?: number
  url?: string
  vector: number[]
  query_vector: number[]
}

interface EnhancedProductComparisonProps {
  products: [SearchResult, SearchResult]
  isOpen: boolean
  onClose: () => void
}

interface ComparisonResponse {
  summary: string
  product1_advantages: string[]
  product2_advantages: string[]
  price_analysis: string
  recommendation: string
  winner: "product1" | "product2" | "tie"
  specs_comparison?: {
    [key: string]: {
      product1: string
      product2: string
      winner?: "product1" | "product2" | "tie"
    }
  }
}

export function EnhancedProductComparison({ products, isOpen, onClose }: EnhancedProductComparisonProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (isOpen && products.length === 2) {
      generateComparison()
    }
  }, [isOpen, products])

  const generateComparison = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("http://localhost:8000/compare-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prod1: products[0],
          prod2: products[1],
          searchType: products[0].image ? "image" : "text",
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log("API Response:", data)

      const normalizedData: ComparisonResponse = {
        summary: data.summary || "No summary available.",
        product1_advantages: Array.isArray(data.product1_advantages) ? data.product1_advantages : [],
        product2_advantages: Array.isArray(data.product2_advantages) ? data.product2_advantages : [],
        price_analysis: data.price_analysis || `${products[0].name} is Rs.${products[0].price || "N/A"} vs ${products[1].name} is Rs.${products[1].price || "N/A"}`,
        recommendation: data.recommendation || "No recommendation available.",
        winner: data.winner || "tie",
        specs_comparison: data.specs_comparison || {},
      }

      setComparisonData(normalizedData)
    } catch (error) {
      console.error("Comparison error:", error)
      setError("Failed to fetch comparison data. Please try again.")
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
    return isWinner ? <Award className="w-5 h-5 text-green-400" /> : <Shield className="w-5 h-5 text-blue-400" />
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] bg-gradient-to-br from-gray-900/95 to-purple-900/95 backdrop-blur-xl border border-purple-400/30 text-white overflow-hidden">
        <DialogHeader className="border-b border-purple-400/20 pb-4">
          <DialogTitle className="font-space-grotesk text-2xl text-white flex items-center gap-3">
            <GitCompare className="w-6 h-6 text-purple-400" />
            AI-Powered Product Comparison
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto" />
                <p className="text-purple-200 text-lg">AI is analyzing products...</p>
                <p className="text-purple-300 text-sm">Comparing features, prices, and specifications</p>
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid grid-cols-4 bg-white/5 backdrop-blur-xl border border-white/20 shadow-xl mb-4">
                <TabsTrigger
                  value="overview"
                  className="font-space-grotesk data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-purple-200"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="specs"
                  className="font-space-grotesk data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-purple-200"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Specifications
                </TabsTrigger>
                <TabsTrigger
                  value="pricing"
                  className="font-space-grotesk data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-purple-200"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Pricing
                </TabsTrigger>
                <TabsTrigger
                  value="summary"
                  className="font-space-grotesk data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-purple-200"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  AI Summary
                </TabsTrigger>
              </TabsList>
              <div className="flex-1 overflow-hidden">
                <TabsContent value="overview" className="h-full mt-0">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {products.map((product, index) => (
                          <Card key={index} className="bg-white/5 backdrop-blur-xl border border-white/10">
                            <CardHeader className="pb-4">
                              <div className="flex items-start gap-4">
                                <img
                                  src={product.image || "/placeholder.svg?height=100&width=100"}
                                  alt={product.name}
                                  className="w-24 h-24 object-cover rounded-lg shadow-lg"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = "/placeholder.svg?height=100&width=100"
                                  }}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    {getWinnerIcon(index)}
                                    <CardTitle className="font-space-grotesk text-lg text-white line-clamp-2">
                                      {product.name}
                                    </CardTitle>
                                  </div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-200">
                                      {product.source}
                                    </Badge>
                                    {product.similarity && (
                                      <Badge variant="outline" className="border-green-400/50 text-green-300">
                                                        {(product.similarity * 100).toFixed(0)}% match
                                      </Badge>
                                    )}
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
                                      )
                                    )
                                  ) : (
                                    <p className="text-purple-200 text-sm">No key advantages available for this product.</p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="specs" className="h-full mt-0">
                  <ScrollArea className="h-full pr-4">
                    {comparisonData?.specs_comparison && (
                      <div className="space-y-4">
                        {Object.entries(comparisonData.specs_comparison).map(([spec, data]) => (
                          <Card key={spec} className="bg-white/5 backdrop-blur-xl border border-white/10">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-3 gap-4 items-center">
                                <div className="font-medium text-purple-200">{spec}</div>
                                <div className="text-center">
                                  <span className="text-white">{data.product1}</span>
                                  {data.winner === "product1" && <TrendingUp className="w-4 h-4 text-green-400 inline ml-2" />}
                                </div>
                                <div className="text-center">
                                  <span className="text-white">{data.product2}</span>
                                  {data.winner === "product2" && <TrendingUp className="w-4 h-4 text-green-400 inline ml-2" />}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="pricing" className="h-full mt-0">
                  <ScrollArea className="h-full pr-4">
                    {comparisonData && (
                      <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
                        <CardHeader>
                          <CardTitle className="font-space-grotesk text-xl text-white flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-400" />
                            Price Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <p className="text-purple-200 leading-relaxed">{comparisonData.price_analysis}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                              {products.map((product, index) => (
                                <div key={index} className="text-center p-4 bg-white/5 rounded-lg">
                                  <p className="text-purple-300 text-sm mb-2">{product.name.split(" ").slice(0, 3).join(" ")}</p>
                                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    Rs. {product.price || "N/A"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="summary" className="h-full mt-0">
                  <ScrollArea className="h-full pr-4">
                    {comparisonData && (
                      <div className="space-y-6">
                        <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
                          <CardHeader>
                            <CardTitle className="font-space-grotesk text-xl text-white flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-purple-400" />
                              AI Comparison Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-purple-200 leading-relaxed">{comparisonData.summary}</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-400/30">
                          <CardHeader>
                            <CardTitle className="font-space-grotesk text-xl text-white flex items-center gap-2">
                              <Star className="w-5 h-5 text-yellow-400" />
                              Final Recommendation
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-purple-100 leading-relaxed">{comparisonData.recommendation}</p>
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
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
