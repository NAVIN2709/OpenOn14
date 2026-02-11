import { useEffect } from "react";

export default function OpenInBrowser() {
  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor;

    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);

    // where you ultimately want users to land
    const params = new URLSearchParams(window.location.search);
    const path = params.get("to") || "/";
    const target = `https://kapdaswag.in${path}`;

    if (isAndroid) {
      // Android Intent → forces Chrome
      window.location.href =
        "intent://kapdaswag.in" +
        path +
        "#Intent;scheme=https;package=com.android.chrome;end";
    } else if (isIOS) {
      // iOS Universal Link → forces Safari
      window.location.href = target;
    } else {
      // desktop or other
      window.location.href = target;
    }
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "40px", textAlign: "center" }}>
      <h2>Opening in your browser…</h2>
      <p>If nothing happens, <a href="https://kapdaswag.in">tap here</a>.</p>
    </div>
  );
}
