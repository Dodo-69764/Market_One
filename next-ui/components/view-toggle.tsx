"use client"

import { Button } from "@/components/ui/button"
import { Grid3X3, List } from "lucide-react"
import type { ViewMode } from "@/types/search"

interface ViewToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex gap-1 border rounded-md p-1">
      <Button
        variant={viewMode === "tiles" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("tiles")}
        className={viewMode === "tiles" ? "bg-purple-600 hover:bg-purple-700" : ""}
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("list")}
        className={viewMode === "list" ? "bg-purple-600 hover:bg-purple-700" : ""}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  )
}
