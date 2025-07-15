/* global type declarations */
declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

"use client"

import React, { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, Sparkles, ShoppingBag, DollarSign, Loader2, Mic, MicOff } from "lucide-react"
import type { SearchResult } from "@/types/search"

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
}

interface ProductChatbotProps {
  product: SearchResult
  isOpen: boolean
  onClose: () => void
}

export function ProductChatbot({ product, isOpen, onClose }: ProductChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognition.onerror = (e) => {
        console.error("Speech recognition error", e);
        setIsListening(false);
      }

      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [])

  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }

  const toggleMic = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      setInputValue("")
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  useEffect(() => {
    if (isOpen) {
      const welcomeMessage: Message = {
        id: "welcome",
        content: `Hi! I'm your AI assistant. I can help you learn more about "${product.name}". Ask me about its features, specifications, pricing, or anything else you'd like to know!`,
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
      speak(welcomeMessage.content)
    }
  }, [isOpen, product.name])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const botContent = generateBotResponse(userMessage.content, product);

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: botContent,
        sender: "bot",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botResponse])
      speak(botContent)
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      speak(errorMessage.content)
    } finally {
      setIsLoading(false)
    }
  }

  const generateBotResponse = (input: string, product: SearchResult): string => {
    const q = input.toLowerCase()
    if (q.includes("price") || q.includes("cost") || q.includes("expensive")) return `The current price for "${product.name}" is Rs. ${product.price || "N/A"}. This price is from ${product.source}. Would you like me to help you find similar products at different price points?`
    if (q.includes("feature") || q.includes("specification") || q.includes("spec")) return `Based on the product information, "${product.name}" appears to be a quality product from ${product.source}. For detailed specifications, I'd recommend checking the full product page.`
    if (q.includes("review") || q.includes("rating") || q.includes("quality")) return `This product has good ratings and appears to be well-regarded. ${product.similarity ? `(${(product.similarity * 100).toFixed(0)}% match)` : "It's a good match for your needs."}`
    if (q.includes("buy") || q.includes("purchase") || q.includes("order")) return `You can purchase "${product.name}" directly from ${product.source}. Would you like to compare it with alternatives first?`
    if (q.includes("compare") || q.includes("alternative") || q.includes("similar")) return `To compare "${product.name}" with others, use the comparison tool. Want me to summarize its highlights first?`
    return `Great question! "${product.name}" from ${product.source} seems to be a solid choice. Let me know what specifics you need.`
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const suggestedQuestions = [
    "What are the key features?",
    "Is this a good deal?",
    "How does it compare to alternatives?",
    "What do reviews say?",
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] bg-gradient-to-br from-gray-900/95 to-purple-900/95 backdrop-blur-xl border border-purple-400/30 text-white">
        <DialogHeader className="border-b border-purple-400/20 pb-4">
          {/* You can keep the existing product header UI here */}
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {message.sender === "bot" && (
                    <Avatar className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600">
                      <AvatarFallback><Bot className="w-4 h-4 text-white" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.sender === "user" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "bg-white/10 backdrop-blur-sm border border-white/20 text-purple-100"}`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <span className="text-xs opacity-70 mt-2 block">{message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  {message.sender === "user" && (
                    <Avatar className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600">
                      <AvatarFallback><User className="w-4 h-4 text-white" /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600">
                    <AvatarFallback><Bot className="w-4 h-4 text-white" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                      <span className="text-sm text-purple-200">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="py-3 border-t border-purple-400/20">
            <p className="text-sm text-purple-300 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <Button key={index} variant="outline" size="sm" onClick={() => setInputValue(question)} className="text-xs border-purple-400/30 text-purple-200 hover:bg-purple-500/20">
                  {question}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-purple-400/20 items-center">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about this product..."
              className="flex-1 bg-white/10 border-purple-400/30 text-white placeholder:text-purple-300 focus:border-purple-400"
              disabled={isLoading}
            />
            <Button onClick={toggleMic} className="bg-purple-700 hover:bg-purple-800" type="button">
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              type="button"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}