"use client";
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  searchSubjects,
  subjectQuery,
  subjectSearchDestination,
  type SearchSubject,
} from "@/lib/catalog/subject-search";
import { UiIcon } from "./ui-icon";

export function SubjectSearch({
  subjects,
  initialQuery = "",
}: {
  subjects: readonly SearchSubject[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(-1);
  const id = useId(),
    router = useRouter(),
    composing = useRef(false);
  const matches = searchSubjects(subjects, query),
    suggestions = matches.slice(0, 6);
  const visible = open && Boolean(subjectQuery(query)),
    expanded = visible && suggestions.length > 0;
  const selected = active >= 0 && active < suggestions.length ? active : -1;
  function go(href: string) {
    setOpen(false);
    setActive(-1);
    router.push(href);
  }
  return (
    <form
      action="/insegnamenti"
      role="search"
      aria-label="Cerca un insegnamento"
      className="subject-search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onSubmit={(event) => {
        event.preventDefault();
        if (!composing.current) go(subjectSearchDestination(subjects, query));
      }}
    >
      <div className="subject-search-field">
        <label htmlFor={id} className="sr-only">
          Che materia cerchi?
        </label>
        <input
          id={id}
          type="search"
          name="q"
          maxLength={200}
          autoComplete="off"
          placeholder="Che materia cerchi?"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={id + "-list"}
          aria-activedescendant={
            expanded && selected >= 0 ? id + "-option-" + selected : undefined
          }
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={() => {
            composing.current = false;
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              if (suggestions.length)
                setActive((n) =>
                  event.key === "ArrowDown"
                    ? (n + 1) % suggestions.length
                    : n <= 0
                      ? suggestions.length - 1
                      : n - 1,
                );
            } else if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              setActive(-1);
            } else if (event.key === "Enter" && expanded && selected >= 0) {
              event.preventDefault();
              go("/insegnamenti/" + suggestions[selected].slug);
            }
          }}
        />
        <button type="submit" aria-label="Cerca insegnamenti">
          <UiIcon name="search" />
        </button>
      </div>
      <div className="subject-suggestions" hidden={!visible}>
        <ul
          id={id + "-list"}
          role="listbox"
          aria-label="Insegnamenti suggeriti"
          hidden={!expanded}
        >
          {suggestions.map((subject, index) => (
            <li key={subject.slug} role="none">
              <button
                id={id + "-option-" + index}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={selected === index}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => go("/insegnamenti/" + subject.slug)}
              >
                <span className="suggestion-label" aria-hidden="true">
                  {subject.label}
                </span>
                <span>{subject.title}</span>
                <UiIcon name="arrow" />
              </button>
            </li>
          ))}
        </ul>
        {!suggestions.length && (
          <p className="search-empty">
            Nessuna materia con questo nome. Prova un’altra parola.
          </p>
        )}
        {matches.length > suggestions.length && (
          <button type="submit" className="search-all">
            Vedi tutti i risultati ({matches.length})
          </button>
        )}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {visible
          ? matches.length +
            (matches.length === 1
              ? " insegnamento trovato"
              : " insegnamenti trovati")
          : ""}
      </p>
    </form>
  );
}
