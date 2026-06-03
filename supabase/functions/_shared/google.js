// Autenticación con Google mediante cuenta de servicio (service account) y
// cliente mínimo de la API de Google Calendar para las Edge Functions.
//
// La service account firma un JWT (RS256) y lo intercambia por un access token
// con scope de Calendar. No requiere flujo OAuth interactivo ni refresh tokens.

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/calendar';
const CAL_API = 'https://www.googleapis.com/calendar/v3';

let _cachedToken = null; // { token, exp }

function b64url(input) {
  let str = typeof input === 'string' ? btoa(input)
    : btoa(String.fromCharCode(...new Uint8Array(input)));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Convierte la clave privada PEM (PKCS#8) del JSON en un CryptoKey para firmar.
async function importPrivateKey(pem) {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'pkcs8',
    der.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

function getServiceAccount() {
  const raw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no configurada');
  return JSON.parse(raw);
}

// Devuelve un access token válido (con caché en memoria hasta poco antes de
// expirar).
export async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (_cachedToken && _cachedToken.exp - 60 > now) return _cachedToken.token;

  const sa = getServiceAccount();
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: sa.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  const key = await importPrivateKey(sa.private_key);
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${b64url(sig)}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token Google falló: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  _cachedToken = { token: json.access_token, exp: now + (json.expires_in || 3600) };
  return _cachedToken.token;
}

// Llamada genérica a la API de Calendar. Devuelve { ok, status, data }.
export async function calendarFetch(path, { method = 'GET', body, query } = {}) {
  const token = await getAccessToken();
  let url = `${CAL_API}${path}`;
  if (query) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(query).filter(([, v]) => v != null)),
    ).toString();
    if (qs) url += `?${qs}`;
  }
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { ok: res.ok, status: res.status, data };
}

export const calendarId = () => Deno.env.get('GCAL_CALENDAR_ID');
export const timeZone = () => Deno.env.get('GCAL_TIMEZONE') || 'Europe/Madrid';
