"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp, Brain, Target, X, Tag } from "lucide-react"
import type { LLMMetadata } from "@/types/search"

interface LLMQuerySectionProps {
  metadata: LLMMetadata
}

export function LLMQuerySection({ metadata }: LLMQuerySectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="border-purple-200 bg-purple-50/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-purple-100/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg text-purple-900">AI Query Analysis</CardTitle>
              </div>
              <Button variant="ghost" size="sm">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Core Term */}
            {metadata.core_term && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-gray-700">Refined Query:</span>
                </div>
                <Badge variant="default" className="bg-purple-600 text-white text-sm px-3 py-1">
                  {metadata.core_term}
                </Badge>
              </div>
            )}

            {/* Positive Keywords */}
            {metadata.positive_keywords && metadata.positive_keywords.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-gray-700">Positive Keywords:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {metadata.positive_keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Negative Keywords */}
            {metadata.negative_keywords && metadata.negative_keywords.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-gray-700">Excluded Terms:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {metadata.negative_keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="bg-red-100 text-red-800">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {metadata.categories && metadata.categories.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-gray-700">Categories:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {metadata.categories.map((category, index) => (
                    <Badge key={index} variant="outline" className="border-blue-200 text-blue-800">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
