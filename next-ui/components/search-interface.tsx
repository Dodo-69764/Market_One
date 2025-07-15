"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextSearch } from "./text-search"
import { ImageSearch } from "./image-search"
import { GroupedSearchResults } from "./grouped-search-results"
import { LLMQuerySection } from "./llm-query-section"
import { ViewToggle } from "./view-toggle"
import { SearchFilters } from "./search-filters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, ImageIcon, Filter, Sparkles } from "lucide-react"
import type { SearchResult, LLMMetadata, ViewMode, SearchFilters as FilterType } from "@/types/search"

export function SearchInterface() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [metadata, setMetadata] = useState<LLMMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("tiles")
  const [activeTab, setActiveTab] = useState("text")
  const [filters, setFilters] = useState<FilterType>({
    priceRange: [0, 100000],
    categories: [],
    sources: [],
    sortBy: "relevance",
  })
  const [showFilters, setShowFilters] = useState(false)

  const handleSearchResults = (searchResults: SearchResult[], meta: LLMMetadata) => {
    setResults(searchResults)
    setMetadata(meta)
  }

  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading)
  }

  const handleFiltersChange = (newFilters: FilterType) => {
    setFilters(newFilters)
  }

  return (
    <div id="search-interface" className="max-w-7xl mx-auto space-y-8">
      <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
        <CardHeader className="text-center pb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10 animate-gradient-shift"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-purple-400 mr-3 animate-pulse" />
              <CardTitle className="font-space-grotesk text-3xl font-bold text-white">
                Intelligent Search Engine
              </CardTitle>
              <Sparkles className="w-8 h-8 text-purple-400 ml-3 animate-pulse" />
            </div>
            <p className="font-inter text-purple-200 text-lg">
              Choose your preferred search method and discover products like never before
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col lg:flex-row gap-6 mb-8">
              <TabsList className="grid grid-cols-2 bg-white/5 backdrop-blur-xl border border-white/20 shadow-xl">
                <TabsTrigger
                  value="text"
                  className="font-space-grotesk data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-purple-200 transition-all duration-300 data-[state=active]:shadow-lg"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Text Search
                </TabsTrigger>
                <TabsTrigger
                  value="image"
                  className="font-space-grotesk data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-purple-200 transition-all duration-300 data-[state=active]:shadow-lg"
                >
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Image Search
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
                    showFilters
                      ? "bg-purple-600 border-purple-500 text-white shadow-lg"
                      : "bg-white/5 border-white/20 text-purple-200 hover:bg-white/10"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="font-medium">Filters</span>
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mb-8">
                <SearchFilters filters={filters} onFiltersChange={handleFiltersChange} results={results} />
              </div>
            )}

            <TabsContent value="text" className="mt-0">
              <TextSearch onResults={handleSearchResults} onLoadingChange={handleLoadingChange} />
            </TabsContent>

            <TabsContent value="image" className="mt-0">
              <ImageSearch onResults={handleSearchResults} onLoadingChange={handleLoadingChange} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {metadata && <LLMQuerySection metadata={metadata} />}

      {(results.length > 0 || isLoading) && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-space-grotesk text-4xl font-bold text-white">
              {isLoading ? "Searching..." : `Found ${results.length} products`}
            </h2>
            {!isLoading && results.length > 0 && <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />}
          </div>

          <GroupedSearchResults results={results} viewMode={viewMode} isLoading={isLoading} filters={filters} />
        </div>
      )}
    </div>
  )
}
