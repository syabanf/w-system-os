import type { AppModuleId } from "@/constants/appModules";

export type MDFieldType = "text" | "number" | "color" | "boolean" | "select";

export interface MDFieldDef {
  key: string;
  label: string;
  type: MDFieldType;
  required?: boolean;
  options?: string[];
  hint?: string;
}

export interface MDCategoryDef {
  id: string; // e.g. "hr.departments"
  module: AppModuleId;
  label: string;
  description?: string;
  fields: MDFieldDef[];
  /** A column rendering tip — show this many of the fields in the table view. */
  displayKeys?: string[];
}

// Items are intentionally loose so the same store can hold every category.
export type MDItem = {
  id: string;
} & Record<string, unknown>;
