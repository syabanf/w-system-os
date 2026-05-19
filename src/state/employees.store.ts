"use client";

import { create } from "zustand";
import type { Employee } from "@/domain/entities/Employee";
import { mockEmployees } from "@/infrastructure/data/employees.mock";

const STORAGE_KEY = "wit-erp-os.employees";

function loadFromStorage(): Employee[] {
  if (typeof window === "undefined") return mockEmployees;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return mockEmployees;
    const parsed = JSON.parse(raw) as Employee[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : mockEmployees;
  } catch {
    return mockEmployees;
  }
}

function persist(employees: Employee[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  } catch {
    // ignore storage failures
  }
}

function nextEmployeeNumber(employees: Employee[]): string {
  const numeric = employees
    .map((e) => Number(e.employeeNumber.replace(/^WIT-/, "")))
    .filter((n) => !Number.isNaN(n));
  const max = numeric.length > 0 ? Math.max(...numeric) : 2000;
  return `WIT-${max + 1}`;
}

function genId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export type EmployeeDraft = Omit<Employee, "id" | "memberId" | "employeeNumber">;

interface EmployeesState {
  employees: Employee[];
  isHydrated: boolean;
  hydrate: () => void;
  add: (draft: EmployeeDraft) => Employee;
  update: (id: string, patch: Partial<Employee>) => void;
  remove: (id: string) => void;
  reset: () => void;
}

export const useEmployeesStore = create<EmployeesState>((set, get) => ({
  employees: mockEmployees,
  isHydrated: false,
  hydrate: () => {
    if (get().isHydrated) return;
    set({ employees: loadFromStorage(), isHydrated: true });
  },
  add: (draft) => {
    const employees = get().employees;
    const employee: Employee = {
      ...draft,
      id: genId("emp"),
      memberId: genId("tm"),
      employeeNumber: nextEmployeeNumber(employees),
    };
    const next = [...employees, employee];
    persist(next);
    set({ employees: next });
    return employee;
  },
  update: (id, patch) => {
    const next = get().employees.map((e) => (e.id === id ? { ...e, ...patch, id } : e));
    persist(next);
    set({ employees: next });
  },
  remove: (id) => {
    const next = get().employees.filter((e) => e.id !== id);
    persist(next);
    set({ employees: next });
  },
  reset: () => {
    persist(mockEmployees);
    set({ employees: mockEmployees });
  },
}));
