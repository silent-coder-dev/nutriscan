import React from 'react';
import { Check } from 'lucide-react';

interface Rule {
  label: string;
  met: boolean;
}

export default function RuleChecklist({ rules }: { rules: Rule[] }) {
  return (
    <ul className="mt-2.5 flex flex-wrap gap-1.5 text-[12px]">
      {rules.map((rule) => (
        <li
          key={rule.label}
          className={`inline-flex items-center gap-1.5 h-7 pl-1.5 pr-2.5 rounded-full border transition-colors ${
            rule.met ? 'border-river/40 bg-river/10 text-river' : 'border-line text-dim'
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full flex items-center justify-center ${
              rule.met ? 'bg-river text-bg' : 'bg-line'
            }`}
          >
            {rule.met && <Check className="w-2.5 h-2.5 stroke-[3.5]" />}
          </span>
          {rule.label}
        </li>
      ))}
    </ul>
  );
}
