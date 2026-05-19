"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder, className }: SearchInputProps) {
  return (
    <label
      className={cn(
        "group flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition-colors focus-within:border-white/25 focus-within:bg-white/8",
        className,
      )}
    >
      <Search className="h-3.5 w-3.5 text-zinc-500 group-focus-within:text-zinc-100" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search"}
        className="w-full bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
      />
    </label>
  );
}
