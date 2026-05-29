export const config = {
  appsScriptUrl: process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ?? "",
} as const;

if (!config.appsScriptUrl) {
  console.warn(
    "NEXT_PUBLIC_APPS_SCRIPT_URL is not set. Set it in .env.local to connect to Google Sheets."
  );
}
