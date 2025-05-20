import { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: User | null;
  className?: string;
}

export default function UserAvatar({ user, className }: UserAvatarProps) {
  const initials = getInitials(user?.firstName, user?.lastName);
  
  return (
    <Avatar className={cn("", className)}>
      <AvatarImage 
        src={user?.profileImageUrl || ""} 
        alt={`${user?.firstName || ""} ${user?.lastName || ""}`} 
      />
      <AvatarFallback className="bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
