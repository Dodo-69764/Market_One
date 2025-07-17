"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Tag, Store, ArrowUpDown } from "lucide-react"
import type { SearchFilters as FilterType, SearchResult } from "@/types/search"

interface SearchFiltersProps {
  filters: FilterType
  onFiltersChange: (filters: FilterType) => void
  results: SearchResult[]
}


const sortOptions = [
  { value: "relevance", label: "Most Relevant" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "source", label: "Group by Source" },
]

export function SearchFilters({ filters, onFiltersChange, results }: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters)

  // Extract dynamic sources from results
  const availableSources = Array.from(new Set(results.map((product) => product.source).filter(Boolean)))

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const updateFilters = (updates: Partial<FilterType>) => {
    const newFilters = { ...localFilters, ...updates }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const toggleCategory = (category: string) => {
    const newCategories = localFilters.categories.includes(category)
      ? localFilters.categories.filter((c) => c !== category)
      : [...localFilters.categories, category]
    updateFilters({ categories: newCategories })
  }

  const toggleSource = (source: string) => {
    const newSources = localFilters.sources.includes(source)
      ? localFilters.sources.filter((s) => s !== source)
      : [...localFilters.sources, source]
    updateFilters({ sources: newSources })
  }

  const clearAllFilters = () => {
    const clearedFilters: FilterType = {
      priceRange: [0, 100000],
      categories: [],
      sources: [],
      sortBy: "relevance",
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  return (
    <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="font-space-grotesk text-xl text-white flex items-center">
            <Tag className="w-5 h-5 mr-2 text-purple-400" />
            Search Filters
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-purple-300 hover:text-white hover:bg-white/10"
          >
            Clear All
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Categories */}
        <div className="space-y-3">
          <label className="font-medium text-white flex items-center">
            <Tag className="w-4 h-4 mr-2 text-purple-400" />
            Categories
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={localFilters.categories.includes(category) ? "default" : "outline"}
                className={`cursor-pointer transition-all duration-200 ${
                  localFilters.categories.includes(category)
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "border-purple-400/50 text-purple-300 hover:bg-purple-500/20"
                }`}
                onClick={() => toggleCategory(category)}
              >
                {category}
                {localFilters.categories.includes(category) && <X className="w-3 h-3 ml-1" />}
              </Badge>
            ))}
          </div>
        </div>

        {/* Dynamic Sources */}
        {availableSources.length > 0 && (
          <div className="space-y-3">
            <label className="font-medium text-white flex items-center">
              <Store className="w-4 h-4 mr-2 text-purple-400" />
              Sources ({availableSources.length} available)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableSources.map((source) => (
                <div key={source} className="flex items-center space-x-2">
                  <Checkbox
                    id={source}
                    checked={localFilters.sources.includes(source)}
                    onCheckedChange={() => toggleSource(source)}
                    className="border-purple-400/50 data-[state=checked]:bg-purple-600"
                  />
                  <label
                    htmlFor={source}
                    className="text-sm text-purple-200 cursor-pointer hover:text-white transition-colors"
                  >
                    {source}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sort By */}
        <div className="space-y-3">
          <label className="font-medium text-white flex items-center">
            <ArrowUpDown className="w-4 h-4 mr-2 text-purple-400" />
            Sort By
          </label>
          <Select value={localFilters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
            <SelectTrigger className="bg-white/5 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-white hover:bg-purple-600">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
