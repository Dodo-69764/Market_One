"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, ImageIcon, Loader2, Sparkles } from "lucide-react"
import { searchByImage } from "@/lib/api"
import type { SearchResult, LLMMetadata } from "@/types/search"

interface ImageSearchProps {
  onResults: (results: SearchResult[], metadata: LLMMetadata) => void
  onLoadingChange: (loading: boolean) => void
}

export function ImageSearch({ onResults, onLoadingChange }: ImageSearchProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile) return

    setIsLoading(true)
    onLoadingChange(true)

    try {
      // TODO: Replace with your actual backend URL
      const response = await searchByImage(selectedFile)
      onResults(response.items, response.meta)
    } catch (error) {
      console.error("Image search failed:", error)
      // TODO: Add proper error handling/toast notifications
    } finally {
      setIsLoading(false)
      onLoadingChange(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl blur-xl"></div>
        <Card
          className={`relative border-2 border-dashed transition-all duration-300 bg-white/5 backdrop-blur-md ${
            isDragOver
              ? "border-purple-400 bg-purple-500/20 scale-105"
              : "border-purple-400/50 hover:border-purple-400/80 hover:bg-white/10"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CardContent className="p-12">
            {previewUrl ? (
              <div className="space-y-6 text-center">
                <div className="relative inline-block group">
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Preview"
                    className="max-w-xs max-h-64 rounded-xl shadow-2xl transition-transform duration-300 group-hover:scale-105"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-3 -right-3 rounded-full w-8 h-8 p-0 shadow-lg hover:scale-110 transition-transform duration-200"
                    onClick={clearFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">{selectedFile?.name}</p>
                  <p className="text-purple-200 text-sm">
                    {selectedFile && `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-pulse-glow">
                  <ImageIcon className="h-10 w-10 text-white" />
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">Upload an Image</p>
                  <p className="text-purple-200">Drag and drop or click to browse</p>
                  <p className="text-purple-300 text-sm">Supports JPG, PNG, WebP up to 10MB</p>
                </div>
                <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" id="image-upload" />
                <label htmlFor="image-upload">
                  <Button
                    variant="outline"
                    size="lg"
                    className="cursor-pointer bg-white/10 backdrop-blur-sm border-purple-400/50 text-purple-200 hover:bg-white/20 hover:border-purple-400 transition-all duration-300 transform hover:scale-105"
                    asChild
                  >
                    <span>
                      <Upload className="h-5 w-5 mr-2" />
                      Choose Image
                    </span>
                  </Button>
                </label>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedFile && (
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          size="lg"
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Analyzing Image...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Search by Image
            </>
          )}
        </Button>
      )}
    </div>
  )
}
