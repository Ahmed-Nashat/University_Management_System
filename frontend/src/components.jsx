import { useEffect, useRef, useState } from "react";
import { X, LoaderCircle, AlertCircle } from "lucide-react";
import { minutes } from "./academic.js";
import { modules, formValues, makePayload, recordLabel } from "./modules.js";

export function Modal({ title, subtitle, children, onClose, busy = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="dialog-header">
        <div>
          <h2 id="dialog-title">{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
          disabled={busy}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function RecordForm({ moduleKey, record, data, onSave, onClose }) {
  const definition = modules[moduleKey];
  const [values, setValues] = useState(() => formValues(moduleKey, record));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const editing = Boolean(record);
  async function submit(event) {
    event.preventDefault();
    setError("");
    const payload = makePayload(moduleKey, values, editing);
    if (
      moduleKey === "semesters" &&
      new Date(values.endDate) <= new Date(values.startDate)
    )
      return setError("End date must be after the start date.");
    if (moduleKey === "sections" && minutes(values.endTime) <= minutes(values.startTime))
      return setError("End time must be later than start time.");
    setBusy(true);
    try {
      await onSave(payload);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  return (
    <Modal
      title={`${editing ? "Edit" : "Add"} ${definition.singular}`}
      subtitle={
        editing
          ? "Update the details below."
          : "Complete the details to create a new record."
      }
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          {definition.fields.map((f) => {
            const disabled = editing && f.immutable;
            const required = f.required && !(editing && f.optionalOnEdit);
            const common = {
              id: f.key,
              name: f.key,
              required: !disabled && required,
              disabled: disabled || busy,
              value: values[f.key] ?? "",
              onChange: (event) =>
                setValues({ ...values, [f.key]: event.target.value }),
              "aria-describedby": f.help ? `${f.key}-help` : undefined,
            };
            const choices = f.relation
              ? data[f.relation].map((item) => ({
                  value: item.id,
                  label: recordLabel(f.relation, item),
                }))
              : f.options?.map((value) => ({ value, label: value }));
            return (
              <div className="field" key={f.key}>
                <label htmlFor={f.key}>
                  {f.label}
                  {required && !disabled && <span> *</span>}
                </label>
                {choices ? (
                  <select {...common}>
                    <option value="">
                      {editing && f.optionalOnEdit
                        ? "Keep current selection"
                        : `Select ${f.label.toLowerCase()}`}
                    </option>
                    {choices.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    {...common}
                    type={f.type || "text"}
                    min={f.min}
                    max={f.max}
                    minLength={f.minLength}
                    maxLength={f.maxLength}
                    pattern={f.pattern}
                    placeholder={f.placeholder}
                    autoComplete={
                      f.type === "password"
                        ? editing
                          ? "current-password"
                          : "new-password"
                        : "off"
                    }
                  />
                )}
                {f.help && <small id={`${f.key}-help`}>{f.help}</small>}
                {disabled && (
                  <small>This field cannot be changed after creation.</small>
                )}
              </div>
            );
          })}
        </div>
        {error && (
          <p className="form-error" role="alert">
            <AlertCircle size={18} />
            {error}
          </p>
        )}
        <div className="dialog-footer">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            {busy && <LoaderCircle size={16} className="spin" />}
            {busy
              ? "Saving…"
              : editing
                ? "Save changes"
                : `Add ${definition.singular}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function DeleteDialog({ moduleKey, record, onDelete, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal
      title={`Remove ${modules[moduleKey].singular}?`}
      subtitle={recordLabel(moduleKey, record)}
      onClose={onClose}
      busy={busy}
    >
      <p className="delete-copy">
        This record will be removed from the active list. Live records are
        soft-deleted by the API.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="dialog-footer">
        <button className="button secondary" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button
          className="button danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onDelete();
            } catch (e) {
              setError(e.message);
              setBusy(false);
            }
          }}
        >
          {busy ? "Removing…" : "Remove record"}
        </button>
      </div>
    </Modal>
  );
}
