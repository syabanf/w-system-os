"use client";

import { useEffect, useMemo } from "react";
import { useClientsStore } from "@/state/clients.store";
import { SearchableSelect } from "@/presentation/shared/SearchableSelect";

interface ClientFilterSelectProps {
  /** Selected client id; "" means "all clients". */
  value: string;
  onChange: (clientId: string) => void;
  className?: string;
}

/**
 * Shared "Filter by client" control: a searchable dropdown of every client plus
 * an "All clients" reset. Drop into any client-linked module's header and pair
 * with a local `useState("")`. Reads the live clients store so newly-added
 * clients appear immediately.
 */
export function ClientFilterSelect({ value, onChange, className }: ClientFilterSelectProps) {
  const clients = useClientsStore((s) => s.items);
  const hydrate = useClientsStore((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const options = useMemo(
    () => [
      { value: "", label: "All clients" },
      ...clients.map((c) => ({ value: c.id, label: c.name })),
    ],
    [clients],
  );

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={options}
      ariaLabel="Filter by client"
      className={className ?? "w-48"}
    />
  );
}
