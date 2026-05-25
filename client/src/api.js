const API = '/api';

export async function fetchBoard() {
  const res = await fetch(`${API}/jira/board`);
  if (!res.ok) throw new Error('Failed to load board');
  return res.json();
}

export async function fetchChangeRequests() {
  const res = await fetch(`${API}/change-requests`);
  if (!res.ok) throw new Error('Failed to load change requests');
  return res.json();
}

export async function generateChangeRequest(jiraKey) {
  const res = await fetch(`${API}/change-requests/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jiraKey }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Generation failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function fetchChangeTasks(changeNumber) {
  const res = await fetch(
    `${API}/change-requests/${encodeURIComponent(changeNumber)}/ctasks`
  );
  if (!res.ok) throw new Error('Failed to load change tasks');
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${API}/health`);
  return res.json();
}
