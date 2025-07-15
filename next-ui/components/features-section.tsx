"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, ImageIcon, Brain, Zap, Shield, Globe, Sparkles, TrendingUp, ShoppingBag } from "lucide-react"

const features = [
  {
    icon: Search,
    title: "Smart Text Search",
    description: "Find exactly what you're looking for with our intelligent search that understands context and intent",
    color: "from-purple-500 to-pink-500",
    accent: "purple",
  },
  {
    icon: ImageIcon,
    title: "Visual Product Search",
    description:
      "Upload any image and discover similar products instantly with our advanced computer vision technology",
    color: "from-blue-500 to-purple-500",
    accent: "blue",
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description:
      "Get personalized recommendations and detailed product comparisons powered by advanced machine learning",
    color: "from-pink-500 to-red-500",
    accent: "pink",
  },
  {
    icon: Zap,
    title: "Lightning Fast Results",
    description: "Experience instant search results with our optimized infrastructure and smart caching technology",
    color: "from-yellow-500 to-orange-500",
    accent: "yellow",
  },
  {
    icon: Shield,
    title: "Secure Shopping",
    description: "Shop with confidence knowing all our partner stores are verified and your data is protected",
    color: "from-green-500 to-teal-500",
    accent: "green",
  },
  {
    icon: Globe,
    title: "Global Marketplace",
    description: "Access products from trusted retailers worldwide, all in one convenient platform",
    color: "from-indigo-500 to-purple-500",
    accent: "indigo",
  },
]

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    const element = document.getElementById("features-section")
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <section id="features-section" className="py-24 px-4 relative">
      {/* Section background enhancement */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/20 to-transparent"></div>

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center mb-6">
            <ShoppingBag className="w-12 h-12 text-purple-400 mr-4 animate-pulse" />
            <h2
              className={`font-orbitron text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200 transform transition-all duration-1000 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              WHY CHOOSE US
            </h2>
            <ShoppingBag className="w-12 h-12 text-purple-400 ml-4 animate-pulse" />
          </div>
          <p
            className={`font-space-grotesk text-2xl text-purple-200 max-w-4xl mx-auto leading-relaxed transform transition-all duration-1000 delay-200 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            Discover the future of online shopping with our revolutionary AI-powered platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className={`group bg-white/5 backdrop-blur-2xl border border-white/10 hover:bg-white/10 transition-all duration-700 transform hover:scale-105 hover:-translate-y-3 shadow-2xl hover:shadow-purple-500/25 ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <CardHeader className="pb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div
                    className={`relative w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl`}
                  >
                    <Icon className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                  <CardTitle className="font-space-grotesk text-2xl font-bold text-white group-hover:text-purple-200 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="font-inter text-purple-200 leading-relaxed group-hover:text-purple-100 transition-colors duration-300">
                    {feature.description}
                  </p>

                  {/* Hover effect accent */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Additional premium elements */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-8 py-4 shadow-2xl">
            <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            <span className="font-space-grotesk text-lg text-white font-medium">
              Join the shopping revolution today
            </span>
            <TrendingUp className="w-6 h-6 text-purple-400 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  )
}
