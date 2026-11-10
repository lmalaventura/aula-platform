export type SearchSubject = Readonly<{
  slug: string;
  title: string;
  label: string;
}>;
export function subjectQuery(value: string | string[] | undefined): string {
  return (typeof value === "string" ? value : (value?.[0] ?? ""))
    .trim()
    .slice(0, 200);
}
function words(value: string): string[] {
  return (
    value
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("it")
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}
export function searchSubjects<T extends SearchSubject>(
  subjects: readonly T[],
  query: string,
): T[] {
  const terms = words(subjectQuery(query));
  if (!terms.length) return subjectQuery(query) ? [] : [...subjects];
  const queryText = terms.join(" ");
  return subjects
    .map((subject, order) => {
      const title = words(subject.title),
        label = words(subject.label).join("");
      const matches = terms.every(
        (term) =>
          title.some((word) => word.startsWith(term)) || label.startsWith(term),
      );
      const score = title.join(" ").startsWith(queryText)
        ? 0
        : label.startsWith(queryText)
          ? 1
          : 2;
      return { subject, order, matches, score };
    })
    .filter((item) => item.matches)
    .sort((a, b) => a.score - b.score || a.order - b.order)
    .map((item) => item.subject);
}
export function subjectSearchDestination(
  subjects: readonly SearchSubject[],
  query: string,
): string {
  const q = subjectQuery(query),
    found = searchSubjects(subjects, q);
  if (words(q).length && found.length === 1)
    return "/insegnamenti/" + found[0].slug;
  return "/insegnamenti" + (q ? "?q=" + encodeURIComponent(q) : "");
}
