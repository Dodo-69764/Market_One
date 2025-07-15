"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { ArrowRight, TrendingUp, Zap, ShoppingBag, Globe, Cpu } from "lucide-react"

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative pt-8 pb-16 px-4 overflow-hidden">
      {/* Logo integration with elegant backdrop */}
      <div className="absolute top-8 left-8 z-20">
        <div className="relative group">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl transform rotate-1 group-hover:rotate-0 transition-transform duration-500"></div>
          <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl">
            <Image
              src="/images/market-one-logo.png"
              alt="Market_One Logo"
              width={120}
              height={80}
              className="object-contain filter drop-shadow-lg"
              priority
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto text-center pt-20">
        {/* Floating badge with enhanced styling */}
        <div
          className={`transform transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          <Badge className="mb-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-100 border border-purple-400/30 px-6 py-3 text-base font-medium backdrop-blur-xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105">
            <Cpu className="w-5 h-5 mr-2 animate-pulse" />
            Next-Gen AI Product Discovery
          </Badge>
        </div>

        {/* Enhanced main heading */}
        <div className="space-y-8 mb-12">
          <h1
            className={`font-orbitron text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200 transform transition-all duration-1000 delay-200 drop-shadow-2xl ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            MARKET
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-text">
              _ONE
            </span>
          </h1>

          <p
            className={`font-space-grotesk text-3xl md:text-4xl text-purple-200 font-light tracking-wide transform transition-all duration-1000 delay-400 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            All Markets, One Vista
          </p>

          <p
            className={`font-inter text-xl text-purple-300 max-w-4xl mx-auto leading-relaxed transform transition-all duration-1000 delay-600 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
          >
            Experience the future of product discovery with our revolutionary AI-powered platform. Search by text or
            image across millions of products with unprecedented accuracy and intelligence.
          </p>
        </div>

        {/* Enhanced CTA buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-6 justify-center items-center transform transition-all duration-1000 delay-800 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          <Button
            size="lg"
            onClick={() => {
              const searchSection = document.getElementById("search-interface")
              if (searchSection) {
                searchSection.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            }}
            className="group bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 hover:from-purple-700 hover:via-pink-700 hover:to-purple-800 text-white px-10 py-5 text-xl font-semibold shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 transform hover:scale-110 hover:-translate-y-1 border border-white/20"
          >
            <ShoppingBag className="mr-3 h-6 w-6 group-hover:animate-bounce" />
            Start Exploring
            <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Enhanced floating icons with premium styling */}
        <div className="absolute top-32 left-20 animate-float-elegant">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl rotate-12 hover:rotate-0 transition-transform duration-500">
            <TrendingUp className="w-10 h-10 text-purple-300" />
          </div>
        </div>

        <div className="absolute top-48 right-20 animate-float-elegant-delayed">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl -rotate-12 hover:rotate-0 transition-transform duration-500">
            <Globe className="w-8 h-8 text-pink-300" />
          </div>
        </div>

        <div className="absolute bottom-20 left-32 animate-float-elegant">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl rotate-45 hover:rotate-0 transition-transform duration-500">
            <Zap className="w-7 h-7 text-indigo-300" />
          </div>
        </div>
      </div>
    </section>
  )
}
