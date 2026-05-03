export function getExpectedEmailTrackingToken() {
  return process.env.EMAIL_TRACKING_WRITE_TOKEN?.trim() || null;
}

export function isEmailTrackingTokenAuthorized(headers: Headers) {
  const expectedToken = getExpectedEmailTrackingToken();

  if (!expectedToken) {
    return true;
  }

  const bearerToken = headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const headerToken = headers.get('x-email-tracking-token');

  return bearerToken === expectedToken || headerToken === expectedToken;
}
