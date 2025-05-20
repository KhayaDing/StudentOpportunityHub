import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, User, LogOut, Sun, Moon, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
import UserAvatar from "@/components/shared/UserAvatar";
import Sidebar from "@/components/layout/Sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

  // Close sidebar on location change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-900/80"
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 flex w-full max-w-xs">
          <div className="w-full">
            <div className="flex h-16 items-center justify-between px-6 border-b bg-white dark:bg-slate-950 dark:border-slate-800">
              <Link href="/">
                <a className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  KimConnect
                </a>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Sidebar className="px-6 py-6" />
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-10 h-16 border-b bg-white dark:bg-slate-950 dark:border-slate-800">
        <div className="container h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/">
              <a className="text-xl font-bold text-primary-600 dark:text-primary-400">
                KimConnect
              </a>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative rounded-full" size="icon">
                    <UserAvatar
                      user={user}
                      className="h-8 w-8"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    {user?.firstName} {user?.lastName}
                  </DropdownMenuLabel>
                  <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                    {user?.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <a className="flex w-full cursor-default items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => logout()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <Link href="/login">
                  <a>Login</a>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:bg-white dark:lg:bg-slate-950 dark:lg:border-slate-800">
          <div className="flex-1 overflow-y-auto">
            <Sidebar className="p-6" />
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t bg-white dark:bg-slate-950 dark:border-slate-800">
        <div className="container flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} KimConnect. All rights reserved.</p>
          <div className="mt-2 md:mt-0 space-x-4">
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
