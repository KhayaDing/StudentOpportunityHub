import { Skill } from "@/types";
import { Badge } from "@/components/ui/badge";

interface SkillBadgeProps {
  skill: Skill;
  onRemove?: () => void;
}

export function SkillBadge({ skill, onRemove }: SkillBadgeProps) {
  return (
    <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30">
      {skill.name}
      {onRemove && (
        <button
          type="button"
          className="ml-1 rounded-full text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
          onClick={onRemove}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </Badge>
  );
}
