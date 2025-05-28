import fetch from 'node-fetch';

const BASE_URL = process.env.VITE_EFILE_BASE_URL || 'https://api.uslegalpro.com/v4';
const CLIENT_TOKEN = process.env.VITE_EFILE_CLIENT_TOKEN;
const USERNAME = process.env.VITE_EFILE_USERNAME;
const PASSWORD = process.env.VITE_EFILE_PASSWORD;

export async function authenticate() {
  const res = await fetch(`${BASE_URL}/il/user/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', clienttoken: CLIENT_TOKEN },
    body: JSON.stringify({ data: { username: USERNAME, password: PASSWORD } })
  });
  if (!res.ok) {
    throw new Error(`Auth failed: ${res.status}`);
  }
  const data = await res.json();
  return data.item.auth_token;
}

export async function fetchPaymentAccounts(token) {
  const res = await fetch(`${BASE_URL}/il/payment-accounts`, {
    headers: { authtoken: token }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch accounts: ${res.status}`);
  }
  const data = await res.json();
  return data.item || [];
}
