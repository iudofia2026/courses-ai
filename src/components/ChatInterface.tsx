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

    // Process user input and update preferences
    let response: Message

    switch (currentStep) {
      case 'courses':
        // Parse course interests from user input
        const courses = inputValue.split(',').map(course => course.trim()).filter(course => course)
        setUserPreferences(prev => ({ ...prev, desiredCourses: courses }))

        response = {
          role: 'assistant',
          content: `Great! I see you're interested in: ${courses.join(', ')}. Now, how many credits would you like to take this semester? (Most students take 12-18 credits)`,
          timestamp: new Date(),
        }
        setCurrentStep('credits')
        break

      case 'credits':
        const credits = parseInt(inputValue) || 15
        setUserPreferences(prev => ({ ...prev, creditLoad: credits }))

        response = {
          role: 'assistant',
          content: `Perfect! ${credits} credits it is. Now let's talk about timing. Do you have any time constraints? For example, what's the earliest you'd want classes to start and latest to end? Any specific times you're unavailable?`,
          timestamp: new Date(),
        }
        setCurrentStep('times')
        break

      case 'times':
        // Simple parsing of time preferences - could be enhanced
        const timeInfo = inputValue.toLowerCase()
        let earliestStart = '08:00'
        let latestEnd = '18:00'

        if (timeInfo.includes('morning') || timeInfo.includes('early')) {
          earliestStart = '08:00'
        } else if (timeInfo.includes('afternoon')) {
          earliestStart = '12:00'
        }

        if (timeInfo.includes('evening') || timeInfo.includes('late')) {
          latestEnd = '20:00'
        }

        setUserPreferences(prev => ({
          ...prev,
          timeConstraints: {
            earliestStart,
            latestEnd,
            unavailableTimes: []
          }
        }))

        response = {
          role: 'assistant',
          content: `Thanks for that information! What's your major, and are there any specific major requirements you need to fulfill this semester?`,
          timestamp: new Date(),
        }
        setCurrentStep('major')
        break

      case 'major':
        // Parse major and requirements
        const majorInfo = inputValue.split(',').map(item => item.trim())
        const major = majorInfo[0] || 'Undeclared'
        const requirements = majorInfo.slice(1)

        setUserPreferences(prev => ({
          ...prev,
          major,
          majorRequirements: requirements,
          courseTypes: ['lecture', 'seminar', 'lab'],
          additionalPrefs: ''
        }))

        response = {
          role: 'assistant',
          content: `Excellent! I have all the information I need. Let me analyze the Yale course catalog and generate some optimized schedule options for you. This might take a moment...`,
          timestamp: new Date(),
        }
        setCurrentStep('generating')

        // Trigger actual schedule generation
        generateSchedules()
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
  }

  const generateSchedules = async () => {
    try {
      console.log('Calling schedule generation API with preferences:', userPreferences)

      const response = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userPreferences),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.schedules.length > 0) {
        const successMessage: Message = {
          role: 'assistant',
          content: `I've generated ${result.schedules.length} schedule options for you! Here are your recommendations:\n\n${result.schedules.map((schedule: any, index: number) =>
            `**Schedule ${index + 1}** (${schedule.totalCredits} credits):\n${schedule.courses.map((course: any) => `• ${course.course_code}: ${course.title}`).join('\n')}\n\n*${schedule.reasoning}*\n${schedule.conflicts.length > 0 ? `⚠️ Conflicts: ${schedule.conflicts.join(', ')}` : '✅ No conflicts detected'}`
          ).join('\n\n---\n\n')}`,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, successMessage])
      } else {
        throw new Error(result.error || 'Failed to generate schedules')
      }
    } catch (error) {
      console.error('Error generating schedules:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: `I'm sorry, I encountered an error generating your schedules. ${error instanceof Error ? error.message : 'Please try again or adjust your preferences.'}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
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