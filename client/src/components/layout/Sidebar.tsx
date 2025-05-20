import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, 
  Briefcase, 
  FileText, 
  Award, 
  UserCircle, 
  LayoutDashboard,
  Users,
  Building2,
  FileCheck,
  Plus
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path === "/" && location === "/dashboard") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className={cn("space-y-6", className)}>
      {/* Main navigation */}
      <div className="space-y-1">
        <h2 className="px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
          Dashboard
        </h2>
        <div className="space-y-1">
          <NavItem href="/" icon={<Home className="h-5 w-5" />} active={isActive("/")}>
            Dashboard
          </NavItem>
          
          <NavItem 
            href="/opportunities" 
            icon={<Briefcase className="h-5 w-5" />} 
            active={isActive("/opportunities")}
          >
            Opportunities
          </NavItem>
          
          {user?.role === 'employer' && (
            <NavItem 
              href="/opportunities/create" 
              icon={<Plus className="h-5 w-5" />} 
              active={isActive("/opportunities/create")}
            >
              Post Opportunity
            </NavItem>
          )}
          
          <NavItem 
            href="/applications" 
            icon={<FileText className="h-5 w-5" />} 
            active={isActive("/applications")}
          >
            Applications
          </NavItem>
          
          <NavItem 
            href="/certificates" 
            icon={<Award className="h-5 w-5" />} 
            active={isActive("/certificates")}
          >
            Certificates
          </NavItem>
          
          <NavItem 
            href="/profile" 
            icon={<UserCircle className="h-5 w-5" />} 
            active={isActive("/profile")}
          >
            Profile
          </NavItem>
        </div>
      </div>

      {/* Admin section (visible only to admins) */}
      {user?.role === 'admin' && (
        <div className="space-y-1">
          <h2 className="px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            Admin
          </h2>
          <div className="space-y-1">
            <NavItem 
              href="/admin/dashboard" 
              icon={<LayoutDashboard className="h-5 w-5" />} 
              active={isActive("/admin/dashboard")}
            >
              Dashboard
            </NavItem>
            <NavItem 
              href="/admin/students" 
              icon={<Users className="h-5 w-5" />} 
              active={isActive("/admin/students")}
            >
              Students
            </NavItem>
            <NavItem 
              href="/admin/employers" 
              icon={<Building2 className="h-5 w-5" />} 
              active={isActive("/admin/employers")}
            >
              Employers
            </NavItem>
            <NavItem 
              href="/admin/listings" 
              icon={<FileCheck className="h-5 w-5" />} 
              active={isActive("/admin/listings")}
            >
              Listings
            </NavItem>
          </div>
        </div>
      )}
    </nav>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  active: boolean;
  children: React.ReactNode;
}

function NavItem({ href, icon, active, children }: NavItemProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-2 py-2 text-sm font-medium rounded-md",
          active
            ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-100"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        )}
      >
        <span className={cn("mr-3", active ? "text-primary-500 dark:text-primary-400" : "text-gray-400 dark:text-gray-500")}>{icon}</span>
        {children}
      </a>
    </Link>
  );
}
