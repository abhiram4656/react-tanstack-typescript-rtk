import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/api/query-client.config';
import UsersDemo from './components/UsersDemo';
import UsersDemoRTK from './components/UsersDemoRTK';
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<'tanstack' | 'rtk'>('tanstack');

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              TanStack Query vs RTK Query - Side-by-Side Comparison
            </h1>
            <p className="text-gray-600 mt-2">
              Complete demonstration of GET, POST, PUT, PATCH, DELETE with JSONPlaceholder API
            </p>

            {/* Tab Switcher */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setActiveTab('tanstack')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'tanstack'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                TanStack Query (Original)
              </button>
              <button
                onClick={() => setActiveTab('rtk')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'rtk'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                RTK Query (Enterprise)
              </button>
            </div>
          </header>

          <main>
            {activeTab === 'tanstack' ? <UsersDemo /> : <UsersDemoRTK />}
          </main>
        </div>
      </div>

      {/* Toast notifications */}
      <Toaster position="top-right" />

      {/* React Query DevTools - only in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App
