import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to display in a readable format
export function formatDate(date: string | null | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Format date to include time
export function formatDateTime(date: string | null | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Calculate days remaining until a deadline
export function daysRemaining(deadline: string | null | undefined): string {
  if (!deadline) return 'No deadline';
  
  const deadlineDate = new Date(deadline);
  const today = new Date();
  
  // Set hours to 0 to compare just the dates
  today.setHours(0, 0, 0, 0);
  
  const differenceInTime = deadlineDate.getTime() - today.getTime();
  const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
  
  if (differenceInDays < 0) {
    return 'Expired';
  } else if (differenceInDays === 0) {
    return 'Today';
  } else if (differenceInDays === 1) {
    return '1 day';
  } else {
    return `${differenceInDays} days`;
  }
}

// Format duration string
export function formatDuration(value: number | null, type: string | null): string {
  if (!value || !type) return 'N/A';
  
  if (value === 1) {
    // Singular
    return `1 ${type.slice(0, -1)}`; // Remove 's' from months, weeks, days
  } else {
    // Plural
    return `${value} ${type}`;
  }
}

// Generate initials from name
export function getInitials(firstName?: string | null, lastName?: string | null): string {
  if (!firstName && !lastName) return '?';
  
  let initials = '';
  
  if (firstName) {
    initials += firstName.charAt(0).toUpperCase();
  }
  
  if (lastName) {
    initials += lastName.charAt(0).toUpperCase();
  }
  
  return initials || '?';
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Get error message from API response
export function getErrorMessage(error: any): string {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Calculate profile completion percentage
export function calculateProfileCompletion(profile: any): number {
  if (!profile) return 0;
  
  const fields = [
    'institution',
    'program',
    'yearOfStudy',
    'bio',
    'cvUrl'
  ];
  
  let completed = 0;
  let total = fields.length;
  
  // Count non-empty fields
  fields.forEach(field => {
    if (profile[field]) {
      completed++;
    }
  });
  
  // Add skills as a separate item
  if (profile.skills && profile.skills.length > 0) {
    completed++;
  }
  total++;
  
  return Math.floor((completed / total) * 100);
}
