import { Link } from "wouter";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
      <header className="h-16 border-b bg-white dark:bg-slate-950 dark:border-slate-800">
        <div className="container flex items-center h-full">
          <Link href="/">
            <a className="text-xl font-bold text-primary-600 dark:text-primary-400">KimConnect</a>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {children}
        </div>
      </main>

      <footer className="py-6 border-t bg-white dark:bg-slate-950 dark:border-slate-800">
        <div className="container text-center text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} KimConnect. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href="/about">
              <a className="hover:text-gray-700 dark:hover:text-gray-300">About</a>
            </Link>
            <Link href="/terms">
              <a className="hover:text-gray-700 dark:hover:text-gray-300">Terms</a>
            </Link>
            <Link href="/privacy">
              <a className="hover:text-gray-700 dark:hover:text-gray-300">Privacy</a>
            </Link>
            <Link href="/contact">
              <a className="hover:text-gray-700 dark:hover:text-gray-300">Contact</a>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
