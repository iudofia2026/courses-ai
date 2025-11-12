import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yale-blue mb-4">
            Yale Schedule Builder
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Build your perfect Yale schedule with AI. Tell us your preferences,
            requirements, and constraints, and we'll create optimized schedule
            options just for you.
          </p>
        </header>

        <ChatInterface />
      </div>
    </main>
  )
}