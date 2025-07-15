"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2, Sparkles } from "lucide-react"
import { searchByText } from "@/lib/api"
import type { SearchResult, LLMMetadata } from "@/types/search"

interface TextSearchProps {
  onResults: (results: SearchResult[], metadata: LLMMetadata) => void
  onLoadingChange: (loading: boolean) => void
}

export function TextSearch({ onResults, onLoadingChange }: TextSearchProps) {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    onLoadingChange(true)

    try {
      // TODO: Replace with your actual backend URL
      const response = await searchByText(query)
      onResults(response.items, response.meta)
    } catch (error) {
      console.error("Search failed:", error)
      // TODO: Add proper error handling/toast notifications
    } finally {
      setIsLoading(false)
      onLoadingChange(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg blur-xl"></div>
        <div className="relative flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for products... (e.g., wireless headphones, laptop, smartphone)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 pr-4 py-4 text-lg bg-white/10 backdrop-blur-md border-purple-400/30 text-white placeholder:text-purple-300 focus:border-purple-400 focus:ring-purple-400/50 rounded-lg"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !query.trim()}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="text-center">
        <p className="text-purple-200 text-sm">Try: "gaming laptop under 50000" or "wireless bluetooth earbuds"</p>
      </div>
    </form>
  )
}
