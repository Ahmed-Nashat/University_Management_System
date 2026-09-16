import { useEffect, useRef, useState } from "react";
import {
  GraduationCap,
  CalendarDays,
  BookOpen,
  Award,
  Plus,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  Users,
  Building2,
  Layers,
  ClipboardList,
  BriefcaseBusiness,
  Check,
  Clock3,
  MapPin,
  X,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { modules, recordLabel } from "./modules.js";
import { createDemoData, changeDemo } from "./demo.js";
import { listRecords, mutate, request } from "./api.js";
import { Modal, RecordForm, DeleteDialog } from "./components.jsx";
import Login from "./Login.jsx";

const moduleIcons = {
  students: Users,
  professors: GraduationCap,
  departments: Building2,
  courses: BookOpen,
  sections: Layers,
  semesters: CalendarDays,
  enrollments: ClipboardList,
};
const emptyData = Object.fromEntries(
  Object.keys(modules).map((key) => [key, []]),
);
const dateLabel = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
const timeLabel = (value) =>
  new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
function monday(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
function sameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export default function App() {
  const [demo, setDemo] = useState(createDemoData);
  const [live, setLive] = useState(emptyData);
  const [mode, setMode] = useState("demo");
  const [role, setRole] = useState("student");
  const [user, setUser] = useState(null);
  const [signedIn, setSignedIn] = useState(false);
  const [page, setPage] = useState("classes");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [pagination, setPagination] = useState(1);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [week, setWeek] = useState(() => monday("2026-09-14T12:00:00"));
  const [view, setView] = useState("week");
  const loadId = useRef(0);
  const data = mode === "demo" ? demo : live;
  const student =
    mode === "demo"
      ? demo.students[0]
      : data.students.find((row) => row.id === user?.id);
  const studentEnrollments = data.enrollments.filter(
    (row) => row.studentId === student?.id,
  );
  const mySections = data.sections.filter((section) =>
    studentEnrollments.some((row) => row.sectionId === section.id),
  );
  const find = (key, id) =>
    data[key].find((row) => String(row.id) === String(id));
  function navigate(next) {
    setPage(next);
    setSearch("");
    setFilter("");
    setPagination(1);
    setModal(null);
  }
  function switchRole(next) {
    setRole(next);
    setMode("demo");
    loadId.current++;
    setLoading(false);
    setError("");
    navigate(next === "student" ? "classes" : "overview");
  }
  async function refresh(nextRole = role) {
    if (typeof nextRole !== "string") nextRole = role;
    const id = ++loadId.current;
    setLoading(true);
    setError("");
    setLive(emptyData);
    try {
      const next =
        nextRole === "student"
          ? await request("/portal/workspace")
          : Object.fromEntries(
              await Promise.all(
                Object.keys(modules).map(async (key) => [
                  key,
                  await listRecords(key),
                ]),
              ),
            );
      if (id === loadId.current) setLive(next);
    } catch (e) {
      if (id === loadId.current) setError(e.message);
    } finally {
      if (id === loadId.current) setLoading(false);
    }
  }
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    const expired = () => {
      loadId.current++;
      setUser(null);
      setSignedIn(false);
      setLive(emptyData);
      setModal(null);
      setToast("Your session expired. Please sign in again.");
    };
    window.addEventListener("campus-session-expired", expired);
    return () => window.removeEventListener("campus-session-expired", expired);
  }, []);
  async function login(nextUser) {
    setUser(nextUser);
    setRole(nextUser.role);
    setMode("live");
    setSignedIn(true);
    setWeek(monday(new Date()));
    navigate(nextUser.role === "student" ? "classes" : "overview");
    await refresh(nextUser.role);
  }
  async function logout() {
    try {
      if (mode === "live")
        await request("/auth/logout", { method: "POST", body: "{}" });
    } catch (e) {
      setError(e.message);
      return;
    }
    loadId.current++;
    setSignedIn(false);
    setUser(null);
    setLive(emptyData);
    setModal(null);
    setError("");
    setToast("");
  }
  async function save(key, action, payload, row) {
    if (mode === "demo") setDemo(changeDemo(demo, key, action, payload, row));
    else await mutate(key, action, payload, row);
    setModal(null);
    setToast(
      `${modules[key].singular[0].toUpperCase() + modules[key].singular.slice(1)} ${action === "remove" ? "removed" : action === "create" ? "added" : "updated"}${mode === "demo" ? " in demo" : ""}.`,
    );
    if (mode === "live") await refresh();
  }
  async function enroll(section) {
    if (!student) return;
    if (studentEnrollments.some((row) => row.sectionId === section.id)) return;
    if (mode === "live") {
      try {
        setModal({ ...modal, busy: true, error: "" });
        await request("/portal/enroll", {
          method: "POST",
          body: JSON.stringify({ sectionId: section.id }),
        });
        setModal(null);
        setToast("You’re enrolled. Your class is now in your schedule.");
        await refresh();
      } catch (e) {
        setModal({ ...modal, busy: false, error: e.message });
      }
      return;
    }
    const enrollment = {
      id: Math.max(0, ...demo.enrollments.map((row) => row.id)) + 1,
      studentId: student.id,
      sectionId: section.id,
      enrolledAt: new Date().toISOString(),
      status: "pending",
      finalGrade: null,
    };
    setDemo({ ...demo, enrollments: [...demo.enrollments, enrollment] });
    setModal(null);
    setToast("You’re enrolled. Your class is now in your schedule. Demo only.");
  }
  function cell(key, row) {
    const relations = {
      departmentId: "departments",
      professorId: "professors",
      courseId: "courses",
      semesterId: "semesters",
      studentId: "students",
      sectionId: "sections",
    };
    if (relations[key]) {
      const related = find(relations[key], row[key]);
      return related
        ? recordLabel(relations[key], related)
        : key === "professorId"
          ? row.professor?.name || "—"
          : "—";
    }
    if (["startDate", "endDate", "enrolledAt"].includes(key))
      return dateLabel(row[key]);
    if (key === "schedule")
      return `${dateLabel(row[key])} · ${timeLabel(row[key])}`;
    return row[key] ?? "—";
  }
  const visibleSections = data.sections.filter((section) => {
    const course = find("courses", section.courseId);
    return (
      (!filter || String(course?.departmentId) === filter) &&
      `${course?.name} ${section.sectionCode} ${find("professors", section.professorId)?.name}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });
  const professorPage = role === "professor" && modules[page];
  const rows = professorPage
    ? data[page].filter(
        (row) =>
          (!filter || String(row.departmentId) === filter) &&
          professorPage.columns.some(([key]) =>
            String(cell(key, row)).toLowerCase().includes(search.toLowerCase()),
          ),
      )
    : [];
  const pages = Math.max(1, Math.ceil(rows.length / 8));
  const currentPage = Math.min(pagination, pages);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(week);
    d.setDate(d.getDate() + i);
    return d;
  });
  const shownDays = view === "today" ? [new Date()] : days;
  const semester =
    data.semesters.find(
      (item) =>
        new Date(item.startDate) <= new Date() &&
        new Date(item.endDate) >= new Date(),
    ) || data.semesters[0];

  if (!signedIn)
    return (
      <Login
        onLogin={login}
        onDemo={(nextRole) => {
          switchRole(nextRole);
          setSignedIn(true);
          setWeek(monday("2026-09-14T12:00:00"));
        }}
      />
    );

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            navigate(role === "student" ? "classes" : "overview");
          }}
        >
          <GraduationCap size={29} strokeWidth={1.6} />
          <span>
            campus<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="semester-label">
          <span className="status-dot" />
          {semester
            ? `${semester.term} semester · ${semester.academicYear}`
            : "University workspace"}
        </div>
        <div className="account-controls">
          {mode === "demo" ? (
            <label className="role-picker">
              <span className="sr-only">Preview workspace</span>
              <select
                value={role}
                onChange={(event) => switchRole(event.target.value)}
              >
                <option value="student">Student preview</option>
                <option value="professor">Professor preview</option>
              </select>
            </label>
          ) : (
            <span className="quiet">{user?.name}</span>
          )}
          <button className="button secondary sign-out" onClick={logout}>
            {mode === "demo" ? "Sign in" : "Sign out"}
          </button>
        </div>
      </header>
      <div className="demo-bar">
        <span>
          <span className="demo-tag">
            {mode === "demo" ? "UI PREVIEW" : "CONNECTED"}
          </span>
          {mode === "demo"
            ? "Sample data. Changes last until you refresh."
            : role === "student"
              ? "Your classes and grades."
              : "Changes are saved to university records."}
        </span>
        {mode === "live" && (
          <button onClick={() => refresh()}>
            Refresh
            <RefreshCw size={14} />
          </button>
        )}
      </div>
      <main id="main">
        {error && (
          <div className="error-banner" role="alert">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button className="button secondary" onClick={refresh}>
              Retry
            </button>
          </div>
        )}
        {loading ? (
          <div className="loading" role="status">
            <RefreshCw className="spin" />
            Loading university records…
          </div>
        ) : (
          <>
            {role === "student" && (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">YOUR STUDENT SPACE</p>
                    <h1>
                      {page === "classes"
                        ? "My classes"
                        : page === "enroll"
                          ? "Find your next class."
                          : "My grades"}
                    </h1>
                    <p>
                      {page === "classes"
                        ? `A little structure for a big week, ${student?.firstName || "student"}.`
                        : page === "enroll"
                          ? "Explore sections. Make room for something new."
                          : "Your progress, one course at a time."}
                    </p>
                  </div>
                  {page === "classes" && (
                    <button
                      className="button accent"
                      onClick={() => navigate("enroll")}
                    >
                      <Plus size={18} />
                      Enroll in a section
                    </button>
                  )}
                </div>
                {page === "classes" && (
                  <>
                    <div className="schedule-toolbar">
                      <div className="week-picker">
                        <button
                          className="icon-button"
                          aria-label="Previous week"
                          onClick={() => {
                            const next = new Date(week);
                            next.setDate(next.getDate() - 7);
                            setWeek(next);
                          }}
                        >
                          <ChevronLeft size={19} />
                        </button>
                        <span>
                          {week.toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                          })}{" "}
                          –{" "}
                          {days[6].toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        <button
                          className="icon-button"
                          aria-label="Next week"
                          onClick={() => {
                            const next = new Date(week);
                            next.setDate(next.getDate() + 7);
                            setWeek(next);
                          }}
                        >
                          <ChevronRight size={19} />
                        </button>
                      </div>
                      <div
                        className="segmented glass"
                        aria-label="Schedule view"
                      >
                        <button
                          className={view === "week" ? "selected" : ""}
                          aria-pressed={view === "week"}
                          onClick={() => setView("week")}
                        >
                          Week
                        </button>
                        <button
                          className={view === "today" ? "selected" : ""}
                          aria-pressed={view === "today"}
                          onClick={() => setView("today")}
                        >
                          Today
                        </button>
                      </div>
                      <span className="quiet schedule-count">
                        {mySections.length} enrolled sections
                      </span>
                    </div>
                    <div
                      className="schedule-scroll"
                      tabIndex="0"
                      role="region"
                      aria-label="Weekly class schedule"
                    >
                      <div className={`schedule ${view}`}>
                        <div className="time-column">
                          <div className="day-heading" />
                          {Array.from({ length: 11 }, (_, i) => (
                            <div className="hour-label" key={i}>
                              {String(i + 8).padStart(2, "0")}:00
                            </div>
                          ))}
                        </div>
                        {shownDays.map((day) => (
                          <div className="day-column" key={day.toISOString()}>
                            <div
                              className={`day-heading ${sameDay(day, new Date()) ? "is-today" : ""}`}
                            >
                              <span>
                                {day.toLocaleDateString("en-GB", {
                                  weekday: "short",
                                })}
                              </span>
                              <strong>{day.getDate()}</strong>
                            </div>
                            <div className="day-track">
                              {mySections
                                .filter((section) =>
                                  sameDay(section.schedule, day),
                                )
                                .map((section) => {
                                  const course = find(
                                    "courses",
                                    section.courseId,
                                  );
                                  const date = new Date(section.schedule);
                                  const position = Math.max(
                                    0,
                                    Math.min(
                                      9.5,
                                      date.getHours() -
                                        8 +
                                        date.getMinutes() / 60,
                                    ),
                                  );
                                  return (
                                    <button
                                      key={section.id}
                                      className={`class-block tone-${section.id % 3}`}
                                      style={{ top: `${position * 58}px` }}
                                      onClick={() =>
                                        setModal({
                                          type: "section",
                                          record: section,
                                        })
                                      }
                                    >
                                      <span className="class-code">
                                        {course?.code}
                                      </span>
                                      <strong>
                                        {course?.name || section.sectionCode}
                                      </strong>
                                      <span>
                                        {timeLabel(section.schedule)} ·{" "}
                                        {section.room}
                                      </span>
                                      <ArrowUpRight size={15} />
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="schedule-note">
                      <span>
                        <span className="legend-dot" />
                        Your enrolled classes
                      </span>
                      <span>
                        All times are local · Select a class for details
                      </span>
                    </div>
                    {mySections.length > 0 && (
                      <section className="outside-hours">
                        <h2>Your class details</h2>
                        <div className="class-list">
                          {mySections.map((section) => (
                            <button
                              key={section.id}
                              onClick={() =>
                                setModal({ type: "section", record: section })
                              }
                            >
                              <span>
                                {find("courses", section.courseId)?.name ||
                                  section.sectionCode}
                              </span>
                              <small>
                                {dateLabel(section.schedule)} ·{" "}
                                {timeLabel(section.schedule)} · {section.room}
                              </small>
                              <ArrowUpRight size={16} />
                            </button>
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
                {page === "enroll" && (
                  <>
                    <div className="list-toolbar">
                      <label className="search">
                        <Search size={18} />
                        <input
                          placeholder="Search courses or professors"
                          aria-label="Search sections"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </label>
                      <label>
                        <span className="sr-only">Department</span>
                        <select
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                        >
                          <option value="">All departments</option>
                          {data.departments.map((item) => (
                            <option value={item.id} key={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <span className="quiet">
                        {visibleSections.length} sections
                      </span>
                    </div>
                    <div className="course-grid">
                      {visibleSections.map((section) => {
                        const course = find("courses", section.courseId);
                        const enrolled = studentEnrollments.some(
                          (row) => row.sectionId === section.id,
                        );
                        const seats = Math.max(
                          0,
                          section.capacity -
                            (section.occupied ??
                              data.enrollments.filter(
                                (row) => row.sectionId === section.id,
                              ).length),
                        );
                        return (
                          <article className="course-card" key={section.id}>
                            <div className="course-top">
                              <span className="course-code">
                                {course?.code}
                              </span>
                              <span className="quiet">
                                {section.sectionCode}
                              </span>
                            </div>
                            <h2>{course?.name || section.sectionCode}</h2>
                            <p>
                              {course?.description ||
                                "Explore this course section."}
                            </p>
                            <div className="course-meta">
                              <span>
                                <GraduationCap size={16} />
                                {find("professors", section.professorId)
                                  ?.name || "Unassigned"}
                              </span>
                              <span>
                                <CalendarDays size={16} />
                                {dateLabel(section.schedule)} ·{" "}
                                {timeLabel(section.schedule)}
                              </span>
                              <span>
                                <MapPin size={16} />
                                Room {section.room}
                              </span>
                            </div>
                            <div className="course-bottom">
                              <span>{seats} seats available</span>
                              <button
                                className={`button ${enrolled ? "enrolled" : "secondary"}`}
                                disabled={enrolled || seats === 0}
                                onClick={() =>
                                  setModal({ type: "enroll", record: section })
                                }
                              >
                                {enrolled ? (
                                  <>
                                    <Check size={16} />
                                    Enrolled
                                  </>
                                ) : seats === 0 ? (
                                  "Full"
                                ) : (
                                  <>
                                    View section
                                    <ArrowUpRight size={15} />
                                  </>
                                )}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                    {!visibleSections.length && (
                      <Empty
                        title="No sections found"
                        copy="Try a different search or department."
                      />
                    )}
                  </>
                )}
                {page === "grades" && (
                  <>
                    <div className="grade-summary">
                      <div>
                        <p className="eyebrow">ACADEMIC RECORD</p>
                        <h2>Every step counts.</h2>
                        <p>Published results for your enrolled sections.</p>
                      </div>
                      <div>
                        <strong>
                          {
                            studentEnrollments.filter((row) => row.finalGrade)
                              .length
                          }
                          <span> / {studentEnrollments.length}</span>
                        </strong>
                        <small>results published</small>
                      </div>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Course</th>
                            <th>Section</th>
                            <th>Final grade</th>
                            <th>Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentEnrollments.map((row) => {
                            const section = find("sections", row.sectionId);
                            return (
                              <tr key={row.id}>
                                <td>
                                  <strong>
                                    {find("courses", section?.courseId)?.name ||
                                      "Unavailable course"}
                                  </strong>
                                </td>
                                <td>{section?.sectionCode || "—"}</td>
                                <td>
                                  <span className="grade">
                                    {row.finalGrade || "—"}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${row.status}`}>
                                    {row.finalGrade
                                      ? row.status
                                      : "Not published"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {!studentEnrollments.length && (
                      <Empty
                        title="Your academic journey starts here"
                        copy="Enroll in a section to see it in your academic record."
                      />
                    )}
                  </>
                )}
              </>
            )}
            {role === "professor" && (
              <>
                <nav
                  className="faculty-nav glass"
                  aria-label="Professor management"
                >
                  <button
                    className={page === "overview" ? "active" : ""}
                    onClick={() => navigate("overview")}
                  >
                    <BriefcaseBusiness size={16} />
                    Overview
                  </button>
                  {Object.entries(modules).map(([key, module]) => {
                    const Icon = moduleIcons[key];
                    return (
                      <button
                        key={key}
                        className={page === key ? "active" : ""}
                        onClick={() => navigate(key)}
                      >
                        <Icon size={16} />
                        {module.title}
                      </button>
                    );
                  })}
                </nav>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">PROFESSOR WORKSPACE</p>
                    <h1>{professorPage?.title || "A campus in motion."}</h1>
                    <p>
                      {professorPage?.description ||
                        "Your academic community, all in one place."}
                    </p>
                  </div>
                  {professorPage && (
                    <button
                      className="button accent"
                      disabled={Boolean(error)}
                      onClick={() => setModal({ type: "create", key: page })}
                    >
                      <Plus size={18} />
                      Add {professorPage.singular}
                    </button>
                  )}
                </div>
                {page === "overview" && (
                  <>
                    <div className="metrics">
                      {["students", "professors", "courses", "departments"].map(
                        (key) => {
                          const Icon = moduleIcons[key];
                          return (
                            <button key={key} onClick={() => navigate(key)}>
                              <Icon size={23} strokeWidth={1.5} />
                              <strong>{error ? "—" : data[key].length}</strong>
                              <span>{modules[key].title}</span>
                              <ArrowUpRight
                                className="metric-arrow"
                                size={18}
                              />
                            </button>
                          );
                        },
                      )}
                    </div>
                    <section className="overview-section">
                      <div>
                        <p className="eyebrow">ACADEMIC OPERATIONS</p>
                        <h2>Keep the semester moving.</h2>
                        <p>
                          Manage sections, review enrollments, and maintain your
                          academic calendar.
                        </p>
                      </div>
                      <div className="quick-links">
                        {["sections", "enrollments", "semesters"].map((key) => {
                          const Icon = moduleIcons[key];
                          return (
                            <button key={key} onClick={() => navigate(key)}>
                              <Icon size={23} />
                              <span>
                                <strong>{modules[key].title}</strong>
                                <small>{data[key].length} records</small>
                              </span>
                              <ArrowRight size={18} />
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  </>
                )}
                {professorPage && (
                  <>
                    <div className="list-toolbar">
                      <label className="search">
                        <Search size={18} />
                        <input
                          aria-label={`Search ${page}`}
                          placeholder={`Search ${page}…`}
                          value={search}
                          onChange={(e) => {
                            setSearch(e.target.value);
                            setPagination(1);
                          }}
                        />
                      </label>
                      {professorPage.fields.some(
                        (f) => f.key === "departmentId",
                      ) && (
                        <select
                          aria-label="Filter department"
                          value={filter}
                          onChange={(e) => {
                            setFilter(e.target.value);
                            setPagination(1);
                          }}
                        >
                          <option value="">All departments</option>
                          {data.departments.map((item) => (
                            <option value={item.id} key={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <span className="quiet">{rows.length} records</span>
                      {mode === "live" && (
                        <button
                          className="icon-button"
                          aria-label="Refresh records"
                          onClick={refresh}
                        >
                          <RefreshCw size={18} />
                        </button>
                      )}
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            {professorPage.columns.map(([key, label]) => (
                              <th key={key}>{label}</th>
                            ))}
                            <th className="actions-heading">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows
                            .slice((currentPage - 1) * 8, currentPage * 8)
                            .map((row) => (
                              <tr key={row.id}>
                                {professorPage.columns.map(([key], i) => (
                                  <td key={key}>
                                    {key === "status" ? (
                                      <span className={`badge ${row[key]}`}>
                                        {row[key]}
                                      </span>
                                    ) : i === 0 ? (
                                      <strong>{cell(key, row)}</strong>
                                    ) : (
                                      cell(key, row)
                                    )}
                                  </td>
                                ))}
                                <td>
                                  <div className="row-actions">
                                    <button
                                      className="icon-button"
                                      aria-label={`Edit ${recordLabel(page, row)}`}
                                      onClick={() =>
                                        setModal({
                                          type: "edit",
                                          key: page,
                                          record: row,
                                        })
                                      }
                                    >
                                      <Pencil size={16} />
                                    </button>
                                    <button
                                      className="icon-button delete"
                                      aria-label={`Remove ${recordLabel(page, row)}`}
                                      onClick={() =>
                                        setModal({
                                          type: "delete",
                                          key: page,
                                          record: row,
                                        })
                                      }
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {!rows.length && (
                      <Empty
                        title={
                          error ? "Records unavailable" : "No records found"
                        }
                        copy={
                          error
                            ? "Retry the connection to load records."
                            : search || filter
                              ? "Try adjusting your search or filters."
                              : `Add your first ${professorPage.singular} to get started.`
                        }
                      />
                    )}
                    <div className="pagination">
                      <span>
                        {rows.length
                          ? `Showing ${(currentPage - 1) * 8 + 1}–${Math.min(currentPage * 8, rows.length)} of ${rows.length}`
                          : "0 records"}
                      </span>
                      <div>
                        <button
                          className="icon-button"
                          aria-label="Previous page"
                          disabled={currentPage === 1}
                          onClick={() => setPagination(currentPage - 1)}
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <span>
                          Page {currentPage} of {pages}
                        </span>
                        <button
                          className="icon-button"
                          aria-label="Next page"
                          disabled={currentPage >= pages}
                          onClick={() => setPagination(currentPage + 1)}
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>
      {role === "student" && (
        <nav className="student-dock glass" aria-label="Student navigation">
          {[
            ["classes", CalendarDays, "Classes"],
            ["enroll", Plus, "Enroll"],
            ["grades", Award, "Grades"],
          ].map(([key, Icon, label]) => (
            <button
              key={key}
              className={page === key ? "active" : ""}
              aria-current={page === key ? "page" : undefined}
              onClick={() => navigate(key)}
            >
              <Icon size={20} strokeWidth={1.7} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
      {toast && (
        <div className="toast glass" role="status">
          <Check size={18} />
          <span>{toast}</span>
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal && ["create", "edit"].includes(modal.type) && (
        <RecordForm
          key={`${modal.key}-${modal.record?.id || "new"}`}
          moduleKey={modal.key}
          record={modal.record}
          data={data}
          onClose={() => setModal(null)}
          onSave={(payload) =>
            save(
              modal.key,
              modal.type === "create" ? "create" : "update",
              payload,
              modal.record,
            )
          }
        />
      )}
      {modal?.type === "delete" && (
        <DeleteDialog
          moduleKey={modal.key}
          record={modal.record}
          onClose={() => setModal(null)}
          onDelete={() => save(modal.key, "remove", {}, modal.record)}
        />
      )}
      {modal && ["section", "enroll"].includes(modal.type) && (
        <Modal
          title={
            find("courses", modal.record.courseId)?.name ||
            modal.record.sectionCode
          }
          subtitle={modal.record.sectionCode}
          busy={modal.busy}
          onClose={() => setModal(null)}
        >
          <div className="section-details">
            <span className="course-code">
              {find("courses", modal.record.courseId)?.code}
            </span>
            <p>{find("courses", modal.record.courseId)?.description}</p>
            <dl>
              <div>
                <dt>
                  <GraduationCap size={17} />
                  Professor
                </dt>
                <dd>
                  {find("professors", modal.record.professorId)?.name || "—"}
                </dd>
              </div>
              <div>
                <dt>
                  <Clock3 size={17} />
                  Schedule
                </dt>
                <dd>
                  {dateLabel(modal.record.schedule)} ·{" "}
                  {timeLabel(modal.record.schedule)}
                </dd>
              </div>
              <div>
                <dt>
                  <MapPin size={17} />
                  Room
                </dt>
                <dd>{modal.record.room}</dd>
              </div>
              <div>
                <dt>
                  <Users size={17} />
                  Capacity
                </dt>
                <dd>{modal.record.capacity} students</dd>
              </div>
            </dl>
            {modal.type === "enroll" && mode === "demo" && (
              <p className="quiet">
                This preview enrollment only changes sample data.
              </p>
            )}
            {modal.error && (
              <p role="alert" className="login-error">
                {modal.error}
              </p>
            )}
          </div>
          <div className="dialog-footer">
            <button
              className="button secondary"
              disabled={modal.busy}
              onClick={() => setModal(null)}
            >
              Close
            </button>
            {modal.type === "enroll" && (
              <button
                className="button accent"
                disabled={modal.busy}
                onClick={() => enroll(modal.record)}
              >
                {modal.busy ? "Enrolling…" : "Confirm enrollment"}
                <ArrowRight size={17} />
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Empty({ title, copy }) {
  return (
    <div className="empty">
      <BookOpen size={30} strokeWidth={1.3} />
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}
