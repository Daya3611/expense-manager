import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      </div>
      
      {/* Main content card */}
      <main className="relative z-10 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-10 w-full max-w-xl text-center transform hover:scale-105 transition-all duration-300">
        {/* Optional App Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-400 to-green-400 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-4xl text-white">💸</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white drop-shadow mb-4">Personal Expense Manager</h1>
        <p className="mt-2 text-lg text-gray-200 mb-8">
          Track your finances, control spending, and gain real insight—all with a simple, beautiful dashboard.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <a href="/login" className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-lg transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none">
            Log In
          </a>
          <a href="/register" className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl shadow-lg transition focus:ring-2 focus:ring-green-500 focus:outline-none focus:ring-offset-2">
            Register
          </a>
        </div>
      </main>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-white rounded-full animate-ping opacity-60"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-green-400 rounded-full animate-ping opacity-80" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-20 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping opacity-70" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-10 w-1 h-1 bg-white rounded-full animate-ping opacity-50" style={{animationDelay: '3s'}}></div>
      </div>
    </div>
  );
}
