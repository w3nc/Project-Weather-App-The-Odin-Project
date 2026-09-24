export function formatHour(time24, format = "12h") {
  const [h] = time24.split(":").map(Number);
  if (format === "24h") return `${String(h).padStart(2, "0")}:00`;
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:00 ${period}`;
}

export function formatDayName(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}
