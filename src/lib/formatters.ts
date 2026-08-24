// ============================================================
// KAIZY FORMATTERS — Precision Formatting Utilities
// Prevents ₹0 / ₹NaN displays & formats currency for India (en-IN)
// ============================================================

/**
 * Formats a currency amount into standard Indian Rupee format (₹).
 * Returns '—' for 0, null, undefined, NaN, or negative values.
 */
export const formatPrice = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === "") return "—";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num) || num <= 0) return "—";
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
};

/**
 * Formats a currency amount allowing zero (e.g. ₹0 discount/balance)
 */
export const formatPriceWithZero = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === "") return "—";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num) || num < 0) return "—";
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
};

/**
 * Generates deterministic avatar background color from a string name
 */
export const getDeterministicColor = (name: string = "User"): string => {
  const colors = [
    "#FF6B00", // Saffron Brand
    "#3B82F6", // Blue
    "#10B981", // Emerald
    "#8B5CF6", // Purple
    "#F59E0B", // Amber
    "#06B6D4", // Cyan
    "#EC4899", // Pink
    "#0284C7", // Trust Blue
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/**
 * Extracts initials from a user's name (e.g. "Raju Kumar" -> "RK", "Suresh" -> "S")
 */
export const getInitials = (name?: string | null): string => {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
