"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"

const stats = [
  { label: "Products Indexed", value: "50M+", icon: "🛍️" },
  { label: "AI Accuracy", value: "99.2%", icon: "🎯" },
  { label: "Search Speed", value: "<0.5s", icon: "⚡" },
  { label: "Happy Customers", value: "2M+", icon: "😊" },
]

export function StatsSection() {
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

    const element = document.getElementById("stats-section")
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <section id="stats-section" className="py-16 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-orbitron text-4xl md:text-5xl font-bold text-white mb-4">Trusted by Millions</h2>
          <p className="font-space-grotesk text-xl text-purple-200 max-w-2xl mx-auto">
            Join millions of satisfied customers who have found their perfect products through our AI-powered platform
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className={`bg-white/10 backdrop-blur-md border-purple-400/30 hover:bg-white/20 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="text-2xl md:text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-purple-200 text-sm font-medium">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
