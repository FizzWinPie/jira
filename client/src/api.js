const API = '/api';

export async function fetchChangeRequests() {
  const res = await fetch(`${API}/change-requests`);
  if (!res.ok) throw new Error('Failed to load change requests');
  return res.json();
}

export async function fetchChangeRequest(changeNumber) {
  const res = await fetch(
    `${API}/change-requests/${encodeURIComponent(changeNumber)}`
  );
  if (!res.ok) throw new Error('Failed to load change request');
  return res.json();
}

export async function fetchChangeTasks(changeNumber) {
  const res = await fetch(
    `${API}/change-requests/${encodeURIComponent(changeNumber)}/ctasks`
  );
  if (!res.ok) throw new Error('Failed to load change tasks');
  return res.json();
}

export async function fetchChangeTask(changeNumber, ctaskNumber) {
  const res = await fetch(
    `${API}/change-requests/${encodeURIComponent(changeNumber)}/ctasks/${encodeURIComponent(ctaskNumber)}`
  );
  if (!res.ok) throw new Error('Failed to load change task');
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${API}/health`);
  return res.json();
}
