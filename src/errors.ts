export function getFriendlyErrorMessage(
  statusCode: number,
  providerName: string,
  originalMessage: string
): string {
  const knownErrors: Record<number, string> = {
    401: `${providerName} API key is invalid or expired. Please use "Open Model: Set API Key" to update it.`,
    402: `${providerName} account has insufficient credits or quota. Please check your account balance.`,
    403: `${providerName} API access is forbidden. The API key may lack required permissions.`,
    404: `${providerName} model endpoint not found. Please verify the model ID in your settings.`,
    429: `${providerName} rate limit exceeded. Requests will be retried automatically.`,
    500: `${providerName} server error. The service may be temporarily unavailable.`,
    502: `${providerName} gateway error. Please try again later.`,
    503: `${providerName} service is temporarily unavailable. Please try again later.`,
  };
  return knownErrors[statusCode] ?? `${providerName} API error (${statusCode}): ${originalMessage}`;
}
