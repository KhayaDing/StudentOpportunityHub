import { LocationType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { MapPin, Wifi, ArrowLeftRight } from "lucide-react";

interface OpportunityStatusBadgeProps {
  locationType: LocationType;
}

export function OpportunityStatusBadge({ locationType }: OpportunityStatusBadgeProps) {
  switch (locationType) {
    case "remote":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30">
          <Wifi className="mr-1 h-3 w-3" />
          Remote
        </Badge>
      );
    case "in-person":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30">
          <MapPin className="mr-1 h-3 w-3" />
          In-Person
        </Badge>
      );
    case "hybrid":
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:hover:bg-purple-900/30">
          <ArrowLeftRight className="mr-1 h-3 w-3" />
          Hybrid
        </Badge>
      );
    default:
      return null;
  }
}
