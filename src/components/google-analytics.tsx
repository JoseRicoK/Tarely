"use client";

import Script from "next/script";
import { useState, useEffect } from "react";
import { getCookieConsent } from "./cookie-banner";

const GA_MEASUREMENT_ID = "G-DRPLRV9LHY";

export function GoogleAnalytics() {
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    // Check initial consent
    setConsentGiven(getCookieConsent() === "accepted");

    // Listen for consent changes
    const handleConsentChange = () => {
      setConsentGiven(getCookieConsent() === "accepted");
    };

    window.addEventListener("cookie-consent-change", handleConsentChange);
    return () => window.removeEventListener("cookie-consent-change", handleConsentChange);
  }, []);

  if (!consentGiven) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
