import { clientSentryDsn, sentryEnabled } from "@/core/monitoring/sentry";
import { initProductAnalytics } from "@/core/analytics/productAnalytics";

const dsn = clientSentryDsn();

if (sentryEnabled(dsn)) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      tracesSampleRate: 0.1,
    });
  });
}

initProductAnalytics();
