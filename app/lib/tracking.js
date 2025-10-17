"use client";

export const trackEvent = (eventName, parameters = {}) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, parameters);
    console.log("[Tracking] GA4 Event:", eventName, parameters);
  }
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, parameters);
    console.log("[Tracking] Meta Pixel Event:", eventName, parameters);
  }
  if (typeof window !== "undefined" && window.ttq) {
    window.ttq.track(eventName, parameters);
    console.log("[Tracking] TikTok Pixel Event:", eventName, parameters);
  }
};

export const trackPageView = (url) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", process.env.NEXT_PUBLIC_GA_ID, { page_path: url });
    console.log("[Tracking] GA4 PageView:", url);
  }
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView");
    console.log("[Tracking] Meta Pixel PageView");
  }
  if (typeof window !== "undefined" && window.ttq) {
    window.ttq.track("Browse");
    console.log("[Tracking] TikTok Pixel PageView");
  }
};
