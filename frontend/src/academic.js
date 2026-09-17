export const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const minutes = (value) => {
  const parts = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value || "");
  return parts ? Number(parts[1]) * 60 + Number(parts[2]) : NaN;
};
export function timetableLabel(section) {
  return section?.dayOfWeek && section.startTime && section.endTime
    ? `${section.dayOfWeek} · ${section.startTime.slice(0, 5)}–${section.endTime.slice(0, 5)}`
    : "Timetable not set";
}
export function onDate(section, day, semesters) {
  const semester = semesters.find(row => String(row.id) === String(section.semesterId));
  const date = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const boundary = value => new Date(`${String(value).slice(0, 10)}T00:00:00`).getTime();
  return Boolean(Number.isFinite(minutes(section.startTime)) && Number.isFinite(minutes(section.endTime)) && semester && date >= boundary(semester.startDate) && date <= boundary(semester.endDate)
    && section.dayOfWeek === day.toLocaleDateString("en-GB", { weekday: "long" }));
}
export function enrollmentIssue(section, enrolledSections, semesters) {
  if (!section.dayOfWeek || !Number.isFinite(minutes(section.startTime)) || !Number.isFinite(minutes(section.endTime))) return "Timetable not set";
  if (minutes(section.startTime) >= minutes(section.endTime)) return "Timetable needs correction";
  const semester = semesters.find(row => String(row.id) === String(section.semesterId));
  if (!semester || new Date(semester.endDate) < new Date()) return "Enrollment closed";
  const conflict = enrolledSections.find(row => row.id !== section.id && String(row.semesterId) === String(section.semesterId)
    && row.dayOfWeek === section.dayOfWeek && minutes(section.startTime) < minutes(row.endTime) && minutes(section.endTime) > minutes(row.startTime));
  return conflict ? `Conflicts with ${conflict.sectionCode}` : "";
}
