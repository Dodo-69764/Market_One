import { HeroSection } from "@/components/hero-section"
import { StatsSection } from "@/components/stats-section"
import { FeaturesSection } from "@/components/features-section"
import { SearchInterface } from "@/components/search-interface"

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-900">
        {/* Animated mesh gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-800/30 via-pink-800/20 to-blue-800/30 animate-gradient-shift"></div>

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-float-slow"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-float-slow animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-float-slow animation-delay-4000"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

        {/* Noise texture */}
        <div className="absolute inset-0 bg-noise opacity-5"></div>
      </div>

      <div className="relative z-10">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <div className="container mx-auto px-4 py-16">
          <SearchInterface />
        </div>
      </div>
    </div>
  )
}
