"use client";

import { cn } from "@/lib/utils";
import { INTERVENTION_SKILLS, SKILL_LABELS, type InterventionSkill } from "../skillConstants";

type Props = {
  value: string[];
  onChange: (skills: string[]) => void;
  readOnly?: boolean;
  className?: string;
};

export default function SkillsTagEditor({ value, onChange, readOnly, className }: Props) {
  const toggle = (skill: InterventionSkill) => {
    if (readOnly) return;
    onChange(
      value.includes(skill) ? value.filter((s) => s !== skill) : [...value, skill],
    );
  };

  return (
    <div
      data-testid="skills-tag-editor"
      className={cn("flex flex-wrap gap-1.5", className)}
    >
      {INTERVENTION_SKILLS.map((skill) => {
        const active = value.includes(skill);
        return (
          <button
            key={skill}
            type="button"
            data-testid={`skill-chip-${skill}`}
            onClick={() => toggle(skill)}
            disabled={readOnly}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
              active
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:cursor-default",
            )}
          >
            {SKILL_LABELS[skill]}
          </button>
        );
      })}
    </div>
  );
}
