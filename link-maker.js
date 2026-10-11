// お客様用リンクとQRをつくる（スタッフ用）。2026-10-11：インラインから分けた（CSP）。URLは文字として入れる（HTMLとして解釈しない）
(() => {
  const $ = i => document.getElementById(i);
  $("mk").onclick = () => {
    let b = ($("base").value || "").trim() || "index.html";
    if (!/^(https?:\/\/|[A-Za-z0-9_./-]+$)/.test(b)) { alert("フォームのURLは https:// で始まるアドレスを入れてください"); return; }
    const p = new URLSearchParams();
    ["job", "staff", "src", "site", "house", "area", "amt"].forEach(k => { const v = ($(k).value || "").trim(); if (v) p.set(k, v); });
    p.set("svc", [...document.querySelectorAll(".svc:checked")].map(x => x.value).join(","));
    const u = b + (b.includes("?") ? "&" : "?") + p.toString();
    $("out").hidden = false;
    const a = document.createElement("a"); a.href = u; a.target = "_blank"; a.rel = "noopener"; a.textContent = u;
    $("url").textContent = ""; $("url").appendChild(a);
    $("qr").textContent = "";
    if (window.QRCode) QRCode.toCanvas(u, { width: 220 }, (e, c) => { if (!e) $("qr").appendChild(c); });
  };
})();
