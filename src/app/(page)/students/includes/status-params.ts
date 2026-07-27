import type { StatusFilter } from "./toolbar";

export const STATUS_PARAMS: Record<Exclude<StatusFilter, "">, { is_active?: boolean; is_verified?: boolean }> = {
  active: { is_active: true, is_verified: true },
  inactive: { is_active: false },
  pending: { is_active: true, is_verified: false },
};
