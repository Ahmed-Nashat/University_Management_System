import { modules } from "./modules.js";

export function mutationRequest(key, action, data, row) {
  const module = modules[key];
  const query = new URLSearchParams();
  const body = { ...data };
  if (action !== "create")
    query.set(
      action === "remove" ? module.deleteQuery || module.query : module.query,
      row[module.identity],
    );
  if (key === "enrollments" && action === "create") {
    query.set("studentId", body.studentId);
    delete body.studentId;
  }
  return {
    path: `/${key}/${module[action]}${query.size ? `?${query}` : ""}`,
    options: {
      method:
        action === "create" ? "POST" : action === "update" ? "PATCH" : "DELETE",
      body: JSON.stringify(action === "remove" ? {} : body),
    },
  };
}

export async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json) {
    if (response.status === 401 && !path.startsWith("/auth/"))
      window.dispatchEvent(new Event("campus-session-expired"));
    throw new Error(
      json?.err ||
        json?.msg ||
        "The university API is unavailable. Check that the backend is running, then retry.",
    );
  }
  return json.data;
}

export async function listRecords(key) {
  const rows = [];
  // Fetch in bounded pages; some API counts include joined rows, so stop on an empty page.
  for (let page = 1; page <= 100; page++) {
    const data = await request(`/${key}?page=${page}&limit=100`);
    const batch = data?.rows || data?.semesters;
    if (!Array.isArray(batch))
      throw new Error(`Unexpected ${key} response from the API.`);
    rows.push(...batch);
    const totalPages = data.meta?.totalPage ?? data.totalPage ?? 1;
    if (!batch.length || page >= totalPages)
      return [
        ...new Map(
          rows.filter((row) => !row.deletedAt).map((row) => [row.id, row]),
        ).values(),
      ];
  }
  throw new Error(
    "This dataset exceeds the current UI loading limit. Narrowing large datasets requires server-side filtering.",
  );
}

export async function mutate(key, action, data, row) {
  const { path, options } = mutationRequest(key, action, data, row);
  return request(path, options);
}
