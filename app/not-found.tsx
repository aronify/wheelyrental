import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-white px-4 sm:px-6 lg:px-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Blobs - Light Blue */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>
        
        {/* Grid Pattern - Subtle */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb08_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* 404 Number - Dark Blue, No Pulse */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-9xl sm:text-[12rem] font-black text-blue-700 leading-none mb-4">
            404
          </h1>
        </div>

        {/* Error Message */}
        <div className="mb-12 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Faqja nuk u gjet
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-md mx-auto">
            Ups! Faqja që po kërkoni duket se ka marrë një drejtim të gabuar. 
            Le t'ju kthejmë në rrugën e duhur.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <Link
            href="/dashboard"
            className="group relative px-8 py-4 bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 min-w-[200px] justify-center border border-blue-600"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Shko te Paneli</span>
          </Link>

          <Link
            href="/"
            className="group px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-3 min-w-[200px] justify-center"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Kthehu në Shtëpi</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

