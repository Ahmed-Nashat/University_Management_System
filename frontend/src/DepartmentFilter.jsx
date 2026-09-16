import { useEffect, useId, useRef, useState } from "react";
import { Building2, Check, ChevronDown } from "lucide-react";

export default function DepartmentFilter({ departments, value, onChange }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const list = useRef(null);
  const search = useRef({ text: "", time: 0 });
  const id = useId();
  const options = [
    { value: "", label: "All departments" },
    ...departments.map((item) => ({
      value: String(item.id),
      label: item.name,
    })),
  ];
  const selected = Math.max(
    0,
    options.findIndex((item) => item.value === value),
  );
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) return;
    const outside = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  useEffect(() => {
    if (open)
      list.current?.querySelectorAll('[role="option"]')[active]?.focus();
  }, [open, active]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function handleKey(event) {
    const moves = {
      ArrowDown: (active + 1) % options.length,
      ArrowUp: (active - 1 + options.length) % options.length,
      Home: 0,
      End: options.length - 1,
    };
    if (Object.hasOwn(moves, event.key)) {
      event.preventDefault();
      setActive(moves[event.key]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (
      event.key.length === 1 &&
      event.key !== " " &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      const now = Date.now();
      search.current = {
        text:
          (now - search.current.time < 600 ? search.current.text : "") +
          event.key.toLowerCase(),
        time: now,
      };
      const match = options.findIndex((item) =>
        item.label.toLowerCase().startsWith(search.current.text),
      );
      if (match >= 0) setActive(match);
    }
  }

  return (
    <div
      className="department-filter"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={`department-trigger ${open ? "is-open" : ""}`}
        aria-label={`Filter department: ${options[selected].label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => {
          setActive(selected);
          setOpen(!open);
        }}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            setActive(selected);
            setOpen(true);
          }
        }}
      >
        <Building2 size={16} strokeWidth={1.6} aria-hidden="true" />
        <span>{options[selected].label}</span>
        <ChevronDown
          className="department-chevron"
          size={16}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          id={id}
          ref={list}
          className="department-menu"
          role="listbox"
          aria-label="Departments"
          onKeyDown={handleKey}
        >
          {options.map((option, index) => (
            <button
              type="button"
              key={option.value}
              className="department-option"
              role="option"
              aria-selected={option.value === value}
              tabIndex={index === active ? 0 : -1}
              onFocus={() => setActive(index)}
              onClick={() => {
                onChange(option.value);
                close();
              }}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <Check size={16} strokeWidth={2} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
