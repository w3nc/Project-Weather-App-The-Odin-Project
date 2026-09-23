export function formatHour(time24) {
  // "06:00:00" → "6:00 AM"
  const [h] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:00 ${period}`;
}

export function formatDayName(dateStr) {
  // "2024-05-28" → "Tue"
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}
