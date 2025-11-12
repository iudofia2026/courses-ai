/**
 * HomePage component - Main landing page for the AI Course Scheduler.
 * Features course search, quick actions, and educational content about the platform.
 */

import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  AcademicCapIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { LoadingButton } from '../components/LoadingStates';

export function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const features = [
    {
      icon: SparklesIcon,
      title: 'AI-Powered Search',
      description: 'Find courses using natural language queries. Search for "AI courses with morning classes" or "math with Professor Smith".',
    },
    {
      icon: CalendarIcon,
      title: 'Smart Schedule Generation',
      description: 'Automatically generate conflict-free schedules based on your preferences and constraints.',
    },
    {
      icon: ChartBarIcon,
      title: 'Quality Scoring',
      description: 'Get personalized schedule recommendations based on professor ratings, workload, and time preferences.',
    },
    {
      icon: UserGroupIcon,
      title: 'Section Management',
      description: 'Easily switch between different sections and see real-time enrollment availability.',
    },
  ];

  const quickActions = [
    {
      title: 'Browse All Courses',
      description: 'Explore the complete course catalog',
      icon: AcademicCapIcon,
      action: () => navigate('/search'),
      color: 'bg-blue-500',
    },
    {
      title: 'Generate Schedule',
      description: 'Create your optimal course schedule',
      icon: CalendarIcon,
      action: () => navigate('/schedules'),
      color: 'bg-green-500',
    },
    {
      title: 'Popular Searches',
      description: 'See what other students are looking for',
      icon: ChartBarIcon,
      action: () => navigate('/search?trending=true'),
      color: 'bg-purple-500',
    },
  ];

  const sampleQueries = [
    'Computer Science courses for fall',
    'Mathematics with morning classes',
    'AI and machine learning courses',
    'Psychology with Professor Johnson',
    'Business courses on Tuesday/Thursday',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <AcademicCapIcon className="h-8 w-8 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900">AI Course Scheduler</h1>
            </div>
            <nav className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/search')}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Search Courses
              </button>
              <button
                onClick={() => navigate('/schedules')}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                My Schedule
              </button>
              <button
                className="btn-primary"
                onClick={() => navigate('/search')}
              >
                Get Started
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Find Your Perfect
              <span className="text-primary-600"> Course Schedule</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Use AI to search courses, generate conflict-free schedules, and optimize your academic journey.
              Start with a simple search or explore our smart features.
            </p>

            {/* Main Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Try 'AI courses with morning classes' or 'Professor Smith'"
                autoFocus={true}
                showSuggestions={true}
              />
            </div>

            {/* Sample Queries */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              <p className="text-sm text-gray-500 w-full mb-2">Popular searches:</p>
              {sampleQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(query)}
                  className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-50 hover:border-primary-300 transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Start</h2>
            <p className="text-lg text-gray-600">Get started with these common actions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="card hover:shadow-lg transition-shadow duration-200 text-left group"
              >
                <div className={`inline-flex p-3 rounded-lg text-white mb-4 ${action.color} group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-gray-600 mb-4">{action.description}</p>
                <div className="flex items-center text-primary-600 font-medium">
                  Get Started
                  <ArrowRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white rounded-2xl shadow-sm">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Smart Features</h2>
            <p className="text-lg text-gray-600">Everything you need to build the perfect schedule</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg">
                    <feature.icon className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Build your perfect schedule in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: 'Search Courses',
                description: 'Use our AI-powered search to find courses that match your interests and requirements.',
                icon: MagnifyingGlassIcon,
              },
              {
                step: 2,
                title: 'Select Courses',
                description: 'Choose your preferred courses and sections. We will show real-time availability and professor ratings.',
                icon: CheckCircleIcon,
              },
              {
                step: 3,
                title: 'Generate Schedule',
                description: 'Let AI create conflict-free schedules optimized for your preferences and academic goals.',
                icon: SparklesIcon,
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary-600 text-white rounded-full text-2xl font-bold mx-auto">
                    {step.step}
                  </div>
                  {step.step < 3 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-300 -translate-x-8"></div>
                  )}
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <step.icon className="h-8 w-8 text-primary-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Build Your Perfect Schedule?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already using AI to optimize their course selection and schedule planning.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <LoadingButton
                onClick={() => navigate('/search')}
                className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg"
              >
                Start Searching
              </LoadingButton>
              <button
                onClick={() => navigate('/schedules')}
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-8 rounded-lg transition-colors"
              >
                View Demo
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <AcademicCapIcon className="h-6 w-6" />
                <span className="text-lg font-bold">AI Course Scheduler</span>
              </div>
              <p className="text-gray-400 text-sm">
                Making course selection and schedule planning smarter with AI.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => navigate('/search')} className="hover:text-white">Course Search</button></li>
                <li><button onClick={() => navigate('/schedules')} className="hover:text-white">Schedule Builder</button></li>
                <li><button className="hover:text-white">Features</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button className="hover:text-white">Documentation</button></li>
                <li><button className="hover:text-white">API Reference</button></li>
                <li><button className="hover:text-white">Support</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button className="hover:text-white">About</button></li>
                <li><button className="hover:text-white">Blog</button></li>
                <li><button className="hover:text-white">Contact</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 AI Course Scheduler. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;