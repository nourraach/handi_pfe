export const asString = (val: any): string => {
  if (Array.isArray(val)) return val[0] ?? "";
  if (val === undefined || val === null) return "";
  return String(val);
};
