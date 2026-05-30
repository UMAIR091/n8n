(function (window, document) {
  "use strict";

  var SCRIPT_ID = "recoverly-tracker";
  var BATCH_INTERVAL_MS = 5000;
  var MAX_RETRIES = 3;

  var script = document.getElementById(SCRIPT_ID) || document.currentScript;
  var workspaceId = script ? script.getAttribute("data-workspace-id") : null;
  var endpoint =
    script && script.getAttribute("data-endpoint")
      ? script.getAttribute("data-endpoint")
      : (window.__RECOVERLY_ENDPOINT__ || "https://app.recoverly.io/api/track");

  if (!workspaceId) {
    console.warn("[Recoverly] data-workspace-id missing on tracker script.");
    return;
  }

  // Session ID — persisted for 30 min sliding window
  function getSessionId() {
    var key = "rcvly_sid";
    var tsKey = "rcvly_sid_ts";
    var now = Date.now();
    var existing = localStorage.getItem(key);
    var ts = parseInt(localStorage.getItem(tsKey) || "0", 10);
    if (existing && now - ts < 30 * 60 * 1000) {
      localStorage.setItem(tsKey, now.toString());
      return existing;
    }
    var id =
      "s_" +
      Math.random().toString(36).slice(2, 10) +
      "_" +
      now.toString(36);
    localStorage.setItem(key, id);
    localStorage.setItem(tsKey, now.toString());
    return id;
  }

  function getUtmParams() {
    var params = {};
    var search = window.location.search;
    var p = new URLSearchParams(search);
    if (p.get("utm_source")) params.utmSource = p.get("utm_source");
    if (p.get("utm_medium")) params.utmMedium = p.get("utm_medium");
    if (p.get("utm_campaign")) params.utmCampaign = p.get("utm_campaign");
    return params;
  }

  function getDeviceInfo() {
    var ua = navigator.userAgent;
    var device = /Mobi|Android/i.test(ua) ? "mobile" : "desktop";
    var browser = "unknown";
    if (/Chrome/.test(ua) && !/Chromium|Edge/.test(ua)) browser = "Chrome";
    else if (/Firefox/.test(ua)) browser = "Firefox";
    else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = "Safari";
    else if (/Edge/.test(ua)) browser = "Edge";
    return { device: device, browser: browser };
  }

  function getCustomerId() {
    // Check meta tag or data attribute on body
    var meta = document.querySelector('meta[name="recoverly-customer-id"]');
    if (meta) return meta.getAttribute("content");
    var body = document.body;
    if (body && body.getAttribute("data-customer-id")) {
      return body.getAttribute("data-customer-id");
    }
    return null;
  }

  var queue = [];
  var sessionId = getSessionId();
  var utm = getUtmParams();
  var device = getDeviceInfo();

  function buildBaseEvent(type) {
    var ev = {
      sessionId: sessionId,
      workspaceId: workspaceId,
      eventType: type,
      page: document.title,
      url: window.location.href,
      occurredAt: new Date().toISOString(),
    };
    if (utm.utmSource) ev.utmSource = utm.utmSource;
    if (utm.utmMedium) ev.utmMedium = utm.utmMedium;
    if (utm.utmCampaign) ev.utmCampaign = utm.utmCampaign;
    ev.device = device.device;
    ev.browser = device.browser;
    var cid = getCustomerId();
    if (cid) ev.customerId = cid;
    return ev;
  }

  function enqueue(eventType, metadata) {
    var ev = buildBaseEvent(eventType);
    if (metadata) ev.metadata = metadata;
    queue.push(ev);
  }

  function flush(sync) {
    if (queue.length === 0) return;
    var batch = queue.slice();
    queue = [];

    var payload = JSON.stringify({ events: batch });
    var retries = 0;

    function attempt() {
      if (sync && navigator.sendBeacon) {
        var blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(endpoint, blob);
        return;
      }

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(function () {
        if (retries < MAX_RETRIES) {
          retries++;
          setTimeout(attempt, 1000 * retries);
        }
      });
    }

    attempt();
  }

  // Auto-flush every BATCH_INTERVAL_MS
  setInterval(function () { flush(false); }, BATCH_INTERVAL_MS);

  // Flush on page unload
  window.addEventListener("beforeunload", function () { flush(true); });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush(true);
  });

  // Track initial page view
  enqueue("PAGE_VIEW");

  // Detect checkout initiation (buttons with common checkout text/class)
  document.addEventListener("click", function (e) {
    var target = e.target;
    while (target && target !== document.body) {
      var text = (target.textContent || "").toLowerCase().trim();
      var cls = (target.className || "").toLowerCase();
      var isCheckout =
        /checkout|pay now|subscribe|start trial|get started|purchase|buy/i.test(text) ||
        /checkout|pay-now|subscribe/i.test(cls);
      if (isCheckout) {
        enqueue("CHECKOUT_INITIATED", {
          buttonText: target.textContent.trim().slice(0, 100),
        });
        break;
      }
      target = target.parentElement;
    }
  });

  // Public API
  window.Recoverly = {
    track: function (eventType, metadata) {
      enqueue(eventType, metadata);
    },
    identify: function (customerId) {
      document.body.setAttribute("data-customer-id", customerId);
    },
    flush: function () {
      flush(false);
    },
  };
})(window, document);
