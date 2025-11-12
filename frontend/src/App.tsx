/**
 * Main App component - Sets up routing, providers, and global error handling.
 * Configures React Query, React Router, and overall application structure.
 */

import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from './components/ErrorBoundary';

// Import pages (lazy loaded for better performance)
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import SchedulesPage from './pages/SchedulesPage';
import CourseDetailPage from './pages/CourseDetailPage';

// Import components
import { FullPageLoader, Spinner } from './components/LoadingStates';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});


// 404 Not Found page
function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
        <a href="/" className="btn-primary">
          Go Home
        </a>
      </div>
    </div>
  );
}

// Loading component for Suspense
function PageLoader() {
  return <FullPageLoader />;
}

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Main routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/schedules" element={<SchedulesPage />} />
                <Route path="/courses/:courseId" element={<CourseDetailPage />} />

                {/* Legacy/Redirect routes */}
                <Route path="/course/:courseId" element={<Navigate to="/courses/:courseId" replace />} />

                {/* 404 page */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </div>

          {/* React Query Devtools - Only in development */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;