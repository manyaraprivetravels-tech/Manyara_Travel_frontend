

import { ChevronDown } from "lucide-react";

export default function LoadMoreButton({
  shown,
  total,
  remaining,
  pageSize,
  onClick,
}) {
  if (remaining <= 0) return null;

  const next = Math.min(pageSize, remaining);

  return (
    <div className="mt-10 flex flex-col items-center gap-3 sm:mt-12">
      <p className="text-xs font-medium text-muted" aria-live="polite">
        Showing {shown} of {total}
      </p>

      <button
        type="button"
        onClick={onClick}
        className="
          group
          inline-flex
          items-center
          gap-2
          rounded-full
          border
          border-primary/20
          bg-white
          px-6
          py-3
          text-sm
          font-semibold
          text-primary
          shadow-sm
          transition-all
          duration-300
          hover:-translate-y-0.5
          hover:bg-primary
          hover:text-white
          hover:shadow-brand
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-primary/30
          focus-visible:ring-offset-2
        "
      >
        Load {next} more
        <ChevronDown
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5"
          aria-hidden="true"
        />
      </button>
    </div>
  );
}