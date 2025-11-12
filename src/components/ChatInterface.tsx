'use client'

import { useState } from 'react'
import { UserPreferences, GeneratedSchedule } from '@/types/course'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {}

const ChatInterface: React.FC<ChatInterfaceProps> = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help you build the perfect Yale schedule. Let's start by learning about your preferences. What courses are you interested in taking this semester?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<'courses' | 'credits' | 'times' | 'major' | 'generating'>('courses')
  const [userPreferences, setUserPreferences] = useState<Partial<UserPreferences>>({
    desiredCourses: [],
    timeConstraints: {
      earliestStart: '08:00',
      latestEnd: '18:00',
      unavailableTimes: []
    }
  })

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Simulate processing and determine next step
    setTimeout(() => {
      let response: Message

      switch (currentStep) {
        case 'courses':
          response = {
            role: 'assistant',
            content: `Great! I see you're interested in those courses. Now, how many credits would you like to take this semester? (Most students take 12-18 credits)`,
            timestamp: new Date(),
          }
          setCurrentStep('credits')
          break
        case 'credits':
          response = {
            role: 'assistant',
            content: `Perfect! Now let's talk about timing. Do you have any time constraints? For example, do you prefer morning or afternoon classes? Any times you absolutely can't take classes?`,
            timestamp: new Date(),
          }
          setCurrentStep('times')
          break
        case 'times':
          response = {
            role: 'assistant',
            content: `Thanks for that information! What's your major, and are there any specific major requirements you need to fulfill this semester?`,
            timestamp: new Date(),
          }
          setCurrentStep('major')
          break
        case 'major':
          response = {
            role: 'assistant',
            content: `Excellent! I have all the information I need. Let me analyze the Yale course catalog and generate some optimized schedule options for you. This might take a moment...`,
            timestamp: new Date(),
          }
          setCurrentStep('generating')

          // Trigger schedule generation after a delay
          setTimeout(() => {
            const generationComplete: Message = {
              role: 'assistant',
              content: `I've generated several schedule options for you! Here are your top 3 recommendations based on your preferences. Each schedule balances your course interests, credit requirements, time constraints, and major requirements.`,
              timestamp: new Date(),
            }
            setMessages(prev => [...prev, generationComplete])
            setIsLoading(false)
          }, 3000)
          return
        default:
          response = {
            role: 'assistant',
            content: `Thanks for that information! Is there anything else you'd like me to consider when building your schedule?`,
            timestamp: new Date(),
          }
      }

      setMessages(prev => [...prev, response])
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-yale-blue text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-75 block mt-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yale-blue focus:border-transparent"
            disabled={isLoading || currentStep === 'generating'}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim() || currentStep === 'generating'}
            className="bg-yale-blue text-white px-6 py-2 rounded-lg hover:bg-yale-dark focus:outline-none focus:ring-2 focus:ring-yale-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>

        {/* Progress indicator */}
        <div className="mt-3 flex justify-center">
          <div className="flex space-x-2">
            {['courses', 'credits', 'times', 'major', 'generating'].map((step, index) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full ${
                  step === currentStep
                    ? 'bg-yale-blue'
                    : ['courses', 'credits', 'times', 'major'].indexOf(currentStep) > index
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface