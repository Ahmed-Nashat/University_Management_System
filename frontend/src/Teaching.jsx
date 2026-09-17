import { useEffect, useState } from "react";
import { Users, History, Send, RefreshCw } from "lucide-react";
import { request } from "./api.js";
import { timetableLabel } from "./academic.js";

export default function Teaching({ data, user, mode, onDemoChange }) {
  const professorId = mode === "demo" ? data.professors[0]?.id : user?.id;
  const sections = data.sections.filter(row => row.professorId === professorId);
  const [selected, setSelected] = useState("");
  const sectionId = sections.some(row => String(row.id) === selected) ? selected : String(sections[0]?.id || "");
  const section = sections.find(row => String(row.id) === sectionId);
  const [tab, setTab] = useState("roster");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  useEffect(() => {
    let active = true;
    setError(""); setResult(null);
    if (!sectionId) return;
    setLoading(true);
    const load = async () => {
      try {
        let next;
        if (mode === "demo") {
          const rows = tab === "roster"
            ? data.enrollments.filter(row => String(row.sectionId) === sectionId).map(row => ({ ...row, StudentModel: data.students.find(student => student.id === row.studentId) }))
            : (data.auditLogs || []).filter(row => String(row.sectionId) === sectionId).slice().reverse();
          next = { rows: rows.slice((page - 1) * 10, page * 10), meta: { totalCount: rows.length, totalPage: Math.ceil(rows.length / 10) } };
        } else next = await request(`${tab === "roster" ? "/sections/getSectionRoaster" : "/professors/auditLogs"}?sectionId=${sectionId}&page=${page}&limit=10`);
        if (active) setResult(next);
      } catch (e) { if (active) setError(e.message); }
      finally { if (active) setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [sectionId, tab, page, version, mode, data]);

  async function act(action, row, value) {
    setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "demo") onDemoChange(action, section, row, value);
      else {
        const path = action === "publish" ? "publishGrades" : action === "grade" ? "updateFinalGrade" : "updatStatus";
        await request(`/professors/${path}`, { method: action === "publish" ? "PATCH" : "PUT", body: JSON.stringify({ sectionId: section.id,
          ...(row ? { studentNumber: row.StudentModel.studentNumber } : {}),
          ...(action === "grade" ? { finalGrade: value } : action === "status" ? { status: value } : {}) }) });
      }
      setNotice(action === "publish" ? "Draft grades published. Students can now see them." : "Result saved as a draft. Publish when you are ready.");
      setConfirmPublish(false); setVersion(v => v + 1);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <section className="teaching-panel">
    <div className="teaching-toolbar">
      <label className="field">Your section
        <select aria-label="Teaching section" value={sectionId} disabled={busy} onChange={e => { setSelected(e.target.value); setPage(1); setNotice(""); setConfirmPublish(false); }}>
          {!sections.length && <option value="">No assigned sections</option>}
          {sections.map(row => <option key={row.id} value={row.id}>{row.sectionCode} · {data.courses.find(course => course.id === row.courseId)?.name}</option>)}
        </select>
      </label>
      {section && <p className="quiet">{timetableLabel(section)} · Room {section.room}</p>}
      <button className="button secondary" disabled={loading || busy || !section} onClick={() => setVersion(v => v + 1)}><RefreshCw size={16}/> Refresh</button>
    </div>
    {section ? <>
      <div className="teaching-toolbar">
        <div className="segmented glass">
          <button aria-pressed={tab === "roster"} className={tab === "roster" ? "selected" : ""} disabled={busy} onClick={() => { setTab("roster"); setPage(1); }}><Users size={16}/> Roster & grades</button>
          <button aria-pressed={tab === "history"} className={tab === "history" ? "selected" : ""} disabled={busy} onClick={() => { setTab("history"); setPage(1); }}><History size={16}/> Audit history</button>
        </div>
        <button className="button primary" disabled={busy || loading} onClick={() => setConfirmPublish(true)}><Send size={16}/> Publish grades</button>
      </div>
      {confirmPublish && <div className="publish-confirm">
        <p>Publish all saved draft grades in <strong>{section.sectionCode}</strong>? Students will see them immediately. Save any edits below first.</p>
        <button className="button primary" disabled={busy} onClick={() => act("publish")}>{busy ? "Publishing…" : "Confirm publication"}</button>
        <button className="button secondary" disabled={busy} onClick={() => setConfirmPublish(false)}>Cancel</button>
      </div>}
      <p className="quiet">{tab === "roster" ? "Save grades and results separately. Changes return to draft until published." : "Recorded changes show the professor, time, and before-and-after result. History starts from the audit feature’s installation."}</p>
      {notice && <p className="success-note" role="status">{notice}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {loading ? <p role="status">Loading {tab}…</p> : result && <>
        <div className="table-wrap"><table className="roster-table"><thead><tr>
          {(tab === "roster" ? ["Student", "Final grade", "Result", "Publication"] : ["When / professor", "Student", "Action", "Before", "After"]).map(label => <th key={label}>{label}</th>)}
        </tr></thead><tbody>
          {result.rows.map(row => tab === "roster" ? <GradeRow key={`${row.id}-${version}`} row={row} busy={busy} onSave={act}/> : <tr key={row.id}>
            <td>{new Date(row.createdAt).toLocaleString()}<small className="table-detail">{row.professorName}</small></td>
            <td>{row.studentNumber}</td><td>{row.action === "grade_published" ? "Published" : "Result updated"}</td>
            <td><Snapshot value={row.before}/></td><td><Snapshot value={row.after}/></td>
          </tr>)}
        </tbody></table></div>
        {!result.rows.length && <div className="empty"><h2>{tab === "roster" ? "No students enrolled yet" : "No changes recorded yet"}</h2><p>{tab === "roster" ? "Students will appear here after enrolling." : "Saved grade changes and publications will appear here."}</p></div>}
        <div className="pagination"><span>{result.meta.totalCount} {tab === "roster" ? "students" : "changes"}</span><div>
          <button className="button secondary" disabled={page <= 1 || busy} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span>Page {page} of {Math.max(1, result.meta.totalPage)}</span>
          <button className="button secondary" disabled={page >= result.meta.totalPage || busy} onClick={() => setPage(p => p + 1)}>Next</button>
        </div></div>
      </>}
    </> : <div className="empty"><h2>No assigned sections</h2><p>Assign a section to your professor account in Sections to manage its roster.</p></div>}
  </section>;
}

function Snapshot({ value }) {
  return <span>{value?.finalGrade || "No grade"}<small className="table-detail">{value?.status} · {value?.gradeStatus}</small></span>;
}
function GradeRow({ row, busy, onSave }) {
  const [grade, setGrade] = useState(row.finalGrade || "");
  const [status, setStatus] = useState(row.status);
  const student = row.StudentModel;
  return <tr>
    <td><strong>{student?.userName || `${student?.firstName || ""} ${student?.lastName || ""}`}</strong><small className="table-detail">{student?.studentNumber}</small><small className="table-detail">{student?.email}</small></td>
    <td><form className="inline-grade" onSubmit={e => { e.preventDefault(); onSave("grade", row, grade); }}>
      <input aria-label={`Grade for ${student?.studentNumber}`} value={grade} onChange={e => setGrade(e.target.value.toUpperCase())} required pattern="([A-Za-z][+\-]?|[+\-][A-Za-z])" placeholder="A+" disabled={busy}/>
      <button className="button secondary" disabled={busy || !student || grade === (row.finalGrade || "")}>Save grade</button>
    </form></td>
    <td><form className="inline-grade" onSubmit={e => { e.preventDefault(); onSave("status", row, status); }}>
      <select aria-label={`Result for ${student?.studentNumber}`} value={status} onChange={e => setStatus(e.target.value)} disabled={busy}>{["pending", "passed", "failed"].map(item => <option key={item}>{item}</option>)}</select>
      <button className="button secondary" disabled={busy || !student || status === row.status}>Save result</button>
    </form></td>
    <td><span className={`badge ${row.gradeStatus === "published" ? "passed" : "pending"}`}>{row.gradeStatus || "draft"}</span></td>
  </tr>;
}
