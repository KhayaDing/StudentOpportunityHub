import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";

// Layouts
import AuthLayout from "@/components/layout/AuthLayout";
import MainLayout from "@/components/layout/MainLayout";

// Auth Pages
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import ResetPassword from "@/pages/auth/reset-password";

// Main Pages
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Opportunities from "@/pages/opportunities";
import OpportunityDetail from "@/pages/opportunities/detail";
import CreateOpportunity from "@/pages/opportunities/create";
import Applications from "@/pages/applications";
import Certificates from "@/pages/certificates";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminEmployers from "@/pages/admin/employers";
import AdminListings from "@/pages/admin/listings";
import AdminStudents from "@/pages/admin/students";

// Static Pages
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/login">
        <AuthLayout>
          <Login />
        </AuthLayout>
      </Route>
      <Route path="/register">
        <AuthLayout>
          <Register />
        </AuthLayout>
      </Route>
      <Route path="/reset-password">
        <AuthLayout>
          <ResetPassword />
        </AuthLayout>
      </Route>
      
      {/* Main Routes */}
      <Route path="/">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>
      <Route path="/dashboard">
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </Route>
      <Route path="/profile">
        <MainLayout>
          <Profile />
        </MainLayout>
      </Route>
      <Route path="/opportunities">
        <MainLayout>
          <Opportunities />
        </MainLayout>
      </Route>
      <Route path="/opportunities/create">
        <MainLayout>
          <CreateOpportunity />
        </MainLayout>
      </Route>
      <Route path="/opportunities/:id">
        {(params) => (
          <MainLayout>
            <OpportunityDetail id={params.id} />
          </MainLayout>
        )}
      </Route>
      <Route path="/applications">
        <MainLayout>
          <Applications />
        </MainLayout>
      </Route>
      <Route path="/certificates">
        <MainLayout>
          <Certificates />
        </MainLayout>
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard">
        <MainLayout>
          <AdminDashboard />
        </MainLayout>
      </Route>
      <Route path="/admin/employers">
        <MainLayout>
          <AdminEmployers />
        </MainLayout>
      </Route>
      <Route path="/admin/listings">
        <MainLayout>
          <AdminListings />
        </MainLayout>
      </Route>
      <Route path="/admin/students">
        <MainLayout>
          <AdminStudents />
        </MainLayout>
      </Route>
      
      {/* Static Pages */}
      <Route path="/about">
        <MainLayout>
          <About />
        </MainLayout>
      </Route>
      <Route path="/contact">
        <MainLayout>
          <Contact />
        </MainLayout>
      </Route>
      <Route path="/terms">
        <MainLayout>
          <Terms />
        </MainLayout>
      </Route>
      <Route path="/privacy">
        <MainLayout>
          <Privacy />
        </MainLayout>
      </Route>
      
      {/* Fallback to 404 */}
      <Route>
        <MainLayout>
          <NotFound />
        </MainLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
