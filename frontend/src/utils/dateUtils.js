export const computeAge = (dob) => {
  if (!dob) return '';
  try {
    const d = new Date(dob);
    const t = new Date();
    let years = t.getFullYear() - d.getFullYear();
    const m = t.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < d.getDate())) years--;
    return years < 0 ? '' : String(years);
  } catch {
    return '';
  }
};
