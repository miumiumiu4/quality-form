(() => {
  const C = window.QS_CONFIG || {}, $ = id => document.getElementById(id);
  const P = new URLSearchParams(location.search), param = k => (P.get(k) || "").slice(0, 80);
  // 予約とつながったリンク（?c=会社番号&job=受付番号&t=合言葉）：回答は、その会社の窓口に入る。担当・経路・金額・都道府県は、予約台帳から入るので聞かない
  const LINK = { c: param("c"), job: param("job"), t: param("t") }, LINKED = !!(LINK.c && LINK.job && LINK.t && (C.COMPANIES || {})[LINK.c]);
  const ENDPOINT = LINKED ? C.COMPANIES[LINK.c] : C.GAS_URL;
  const postJson = (url, o) => fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(o) }).then(r => r.json());
  const ITEMS = [
    { k: "内部の汚れ・ニオイ確認", t: "エアコンの内部の汚れや、カビのようなニオイは、取れましたか？" },
    { k: "壁の汚れなし確認", t: "エアコンの下の壁や床に、汚れは残っていませんでしたか？（汚れがなければ「はい」）" },
    { k: "乾拭き確認", t: "水が垂れた場所（廊下・洗面所など）は、拭き取られていましたか？", na: "wipe" },
    { k: "動作異常なし確認", t: "作業のあと、エアコンは正常に動きましたか？" },
    { k: "破損なし確認", t: "エアコンや家具に、傷や破損はありませんでしたか？（なければ「はい」）" },
    { k: "カーテン復旧確認", t: "カーテンや家具は、元どおりに戻っていましたか？", na: "curtain" },
    { k: "排水溝サービス満足", t: "排水溝やお風呂の換気扇フィルターのお掃除（おまけ）には、ご満足いただけましたか？", na: "drain" },
    { k: "トイレ掃除満足", t: "トイレ掃除（おまけ）には、ご満足いただけましたか？", na: "toilet" },
    { k: "補償の理解", t: "作業日から1週間は、不具合があれば会社負担で対応する補償があることの説明を、受けましたか？" },
    { k: "緊急連絡の理解", t: "異変があったときの連絡先（会社のメールまたはLINE）の説明を、受けましたか？" }
  ];
  const CONCERNS = ["汚れ・ニオイが残っている", "水ぬれ・床の汚れ", "傷・破損", "説明が足りない", "時間・段取り", "言葉づかい・マナー", "料金", "その他"];
  const REASONS = ["汚れが気になった", "ニオイが気になった", "エアコンを使う前のメンテナンス", "エアコンの効きを改善したかった", "アレルギーがあるため", "赤ちゃんが産まれる", "エアコンから水漏れがした", "引越しのため", "来客があるため", "定期的なお手入れ", "その他"];
  const FAMILY = ["赤ちゃん・小さなお子さん", "ペット", "アレルギー・喘息", "ご高齢の方"];
  const AGES = ["〜29歳", "30代", "40代", "50代", "60代", "70歳以上", "答えない"];
  const NEXT = ["1年後ごろにお知らせがほしい", "半年後ごろにお知らせがほしい", "お知らせは不要"];
  const svc = param("svc"), svcSet = svc ? new Set(svc.split(",")) : null;   // svc=wipe,curtain,drain,toilet：実施した作業（書かれていない作業は聞かない）
  const S = { c: {}, star: 0, nps: -1, concerns: new Set(), reasons: new Set(), family: new Set(), visit: "" };
  $("brand").textContent = C.COMPANY_NAME || "ご利用ありがとうございました";
  if (!C.GAS_URL) $("demo").hidden = false;

  function sel(el, list) { el.innerHTML = ""; ["", ...list].forEach(v => { const o = document.createElement("option"); o.value = v; o.textContent = v || "選ばない"; el.appendChild(o); }); }
  function chips(box, list, set, single) {
    list.forEach(v => { const b = document.createElement("button"); b.type = "button"; b.textContent = v; b.setAttribute("aria-pressed", "false");
      b.onclick = () => {
        if (single) { S.visit = S.visit === v ? "" : v; [...box.children].forEach(x => x.setAttribute("aria-pressed", String(x.textContent === S.visit))); }
        else { set.has(v) ? set.delete(v) : set.add(v); b.setAttribute("aria-pressed", String(set.has(v))); }
      }; box.appendChild(b); });
  }
  // 1. 作業の確認
  const itemsBox = $("items");
  ITEMS.forEach(it => {
    if (it.na && svcSet && !svcSet.has(it.na)) { S.c[it.k] = null; return; }
    const d = document.createElement("div"); d.className = "item"; d.dataset.k = it.k;
    d.innerHTML = `<p>${it.t}</p><div class="seg" role="group" aria-label="${it.t}"></div>`;
    const seg = d.querySelector(".seg");
    [["はい", 1, ""], ["いいえ", 0, "x"], ...(it.na ? [["該当なし", null, ""]] : [])].forEach(([lab, val, cls]) => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = lab; b.className = cls; b.setAttribute("aria-pressed", "false");
      b.onclick = () => { S.c[it.k] = val; [...seg.children].forEach(x => x.setAttribute("aria-pressed", String(x === b))); d.classList.toggle("bad", val === 0); progress(); };
      seg.appendChild(b);
    });
    itemsBox.appendChild(d);
  });
  $("allok").onclick = () => { itemsBox.querySelectorAll(".item").forEach(d => { if (S.c[d.dataset.k] === undefined) d.querySelector(".seg").children[0].click(); }); };
  // 2. 気持ち
  const stars = $("stars");
  for (let i = 1; i <= 5; i++) { const b = document.createElement("button"); b.type = "button"; b.textContent = "★"; b.setAttribute("role", "radio"); b.setAttribute("aria-label", i + "つ星");
    b.onclick = () => { S.star = i; [...stars.children].forEach((x, j) => x.classList.toggle("on", j < i)); progress(); }; stars.appendChild(b); }
  const nps = $("nps");
  for (let i = 0; i <= 10; i++) { const b = document.createElement("button"); b.type = "button"; b.textContent = i; b.setAttribute("aria-pressed", "false");
    b.onclick = () => { S.nps = i; [...nps.children].forEach((x, j) => x.setAttribute("aria-pressed", String(j === i))); progress(); }; nps.appendChild(b); }
  chips($("concerns"), CONCERNS, S.concerns); chips($("reasons"), REASONS, S.reasons); chips($("family"), FAMILY, S.family); chips($("visit"), ["今回が初めて", "2回目以降"], null, true);
  // 3. あなたについて（リンクで渡された項目は聞かない）
  sel($("src"), C.SOURCES || []); sel($("house"), C.HOUSE || []); sel($("area"), C.PREFS || []); sel($("age"), AGES); sel($("next"), NEXT);
  if (param("src") || LINKED) $("ask-src").hidden = true;
  if (param("house")) $("ask-house").hidden = true;
  if (param("area") || LINKED) $("ask-area").hidden = true;
  // 担当スタッフ：自由記入ではなく、選ぶ形。リンクに staff があれば聞かない。一覧は受け口（名寄せ表）から取る
  const sb = $("staffbox");
  if (param("staff") || LINKED) $("ask-staff").hidden = true;
  else {
    const s = document.createElement("select"); s.id = "staff"; sel(s, []); sb.appendChild(s); $("ask-staff").hidden = true;
    const fill = list => { if (!list.length) return; sel(s, list.map(x => x.name)); [...s.options].slice(1).forEach((o, i) => { o.value = list[i].id; }); s.options[0].textContent = "（わからない・選ばない）"; $("ask-staff").hidden = false; };
    if ((C.STAFF_LIST || []).length) fill(C.STAFF_LIST.map((n, i) => ({ id: "S" + String(i + 1).padStart(3, "0"), name: n })));
    else if (C.GAS_URL) fetch(C.GAS_URL + "?action=staff").then(r => r.json()).then(j => fill((j && j.staff) || [])).catch(() => {});
  }
  $("comment").oninput = e => { $("cnt").textContent = e.target.value.length; };

  function progress() {
    const total = ITEMS.length + 3; let done = 0;
    ITEMS.forEach(it => { if (S.c[it.k] !== undefined) done++; }); if (S.star) done++; if (S.nps >= 0) done++; if ($("self").checked) done++;
    $("progbar").style.width = Math.round(100 * done / total) + "%";
  }
  $("self").onchange = progress;

  const err = m => { const e = $("err"); e.textContent = m; e.hidden = !m; if (m) e.scrollIntoView({ block: "center", behavior: "smooth" }); };
  $("f").addEventListener("submit", async ev => {
    ev.preventDefault(); err("");
    const miss = ITEMS.find(it => S.c[it.k] === undefined);
    if (miss) { itemsBox.querySelector(`[data-k="${miss.k}"]`).scrollIntoView({ block: "center", behavior: "smooth" }); return err("「作業の確認」に、まだ答えていない項目があります。"); }
    if (!S.star) return err("「全体の気持ち」の星を選んでください。");
    if (S.nps < 0) return err("「すすめたい気持ち」（0〜10）を選んでください。");
    if (!$("self").checked) return err("「ご本人のご意思です」にチェックを入れてください。");
    const email = ($("email").value || "").trim();
    if (!email) { $("email").scrollIntoView({ block: "center", behavior: "smooth" }); return err("メールアドレスを入力してください（ご回答の確認と、気になる点があった時のご連絡に使います）。"); }
    if (!/^[^\s@,;<>"']+@[^\s@,;<>"']+\.[^\s@,;<>"']+$/.test(email)) return err("メールアドレスの形を確かめてください。");
    const v = k => (document.getElementById(k)?.value || "").trim();
    const body = { kind: LINKED ? "quality.submit" : "submit", jobId: LINKED ? LINK.job : undefined, token: LINKED ? LINK.t : undefined, requestId: (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "") : String(Date.now()) + Math.random().toString(36).slice(2, 10)),
      job: param("job"), staff: param("staff") || v("staff"), src: param("src") || v("src"), site: param("site"), house: param("house") || v("house"), area: param("area") || v("area"), amt: param("amt"),
      visit: S.visit, star: S.star, nps: S.nps, confirm: S.c, concerns: [...S.concerns], reasons: [...S.reasons], family: [...S.family], age: v("age"), next: v("next"),
      email, comment: $("comment").value.trim(), website: $("hp").value, ua: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "スマホ" : "パソコン" };
    const btn = $("submit"); btn.disabled = true; btn.textContent = "送信しています…";
    try {
      let id = "demo";
      if (ENDPOINT) {
        const j = await postJson(ENDPOINT, body); if (!j.ok) throw new Error(j.message || "送信できませんでした"); id = j.id || "";
      }
      done(id, body);
    } catch (e) { btn.disabled = false; btn.textContent = "この内容で送信する"; err("送信できませんでした。電波のよい所で、もう一度押してください。（" + (e.message || e) + "）"); }
  });

  function done(id, body) {
    $("f").hidden = true; $("intro").hidden = true; $("progbar").style.width = "100%";
    const d = $("done"); d.hidden = false; d.className = "card thanks";
    const hasCm = !!body.comment, hasLink = !!C.REVIEW_URL;
    const contact = [C.CONTACT_LINE_URL && `<a class="linkbtn alt" href="${C.CONTACT_LINE_URL}" target="_blank" rel="noopener">LINEで会社に連絡する</a>`, C.CONTACT_EMAIL && `<a class="linkbtn alt" href="mailto:${C.CONTACT_EMAIL}">メールで会社に連絡する</a>`].filter(Boolean).join("");
    // 口コミのご案内：評価にかかわらず、全員に同じ内容を出す。文章は会社が作らない。報酬・割引はなし。
    d.innerHTML = `<h2>ご回答ありがとうございました</h2><p>いただいたご意見は、サービスの改善に使わせていただきます。</p>
      <div class="box"><h3>よろしければ、Googleマップに口コミをお寄せください（任意）</h3>
        <ul><li>お礼の品や割引は、ありません。投稿しなくても、サービスに影響はありません。</li><li>口コミは、<b>実際のご体験を、お客様ご自身の言葉</b>でお書きください。</li></ul>
        <p class="note">書くときの観点の例：作業のていねいさ／説明のわかりやすさ／仕上がり／依頼したきっかけ</p>
        ${hasLink ? `<a class="linkbtn" id="gm" href="${C.REVIEW_URL}" target="_blank" rel="noopener">Googleマップで口コミを書く</a>` : `<p class="note">（口コミのリンクは、準備中です）</p>`}
        ${hasCm ? `<button type="button" class="linkbtn alt" id="cp">さきほどの「ひとこと」を、そのままコピーする</button><p class="note">コピーされるのは、お客様が書いた文章そのままです（貼り付けた後に、自由に直せます）。</p>` : ""}</div>
      ${contact ? `<div class="box" style="background:var(--card)"><h3>会社に直接お伝えしたいことがある方へ</h3>${contact}</div>` : ""}`;
    const track = what => { if (ENDPOINT && id && id !== "demo") fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ kind: LINKED ? "quality." + what : what, id }), keepalive: true }).catch(() => {}); };
    const gm = $("gm"); if (gm) gm.addEventListener("click", () => track("click"));
    const cp = $("cp"); if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(body.comment); cp.textContent = "コピーしました"; } catch (e) { cp.textContent = "コピーできませんでした。長押しでコピーしてください"; } };
    scrollTo({ top: 0, behavior: "smooth" });
  }
  progress();
  // つながったリンクは、最初に確かめる（長く答えたあとで「リンクが正しくありません」にならないように）
  if (LINKED) postJson(ENDPOINT, { kind: "quality.info", jobId: LINK.job, token: LINK.t }).then(j => {
    if (!j.ok) { $("f").hidden = true; const m = $("intro"); m.innerHTML = "<h1>リンクを開けませんでした</h1><p></p>"; m.querySelector("p").textContent = j.message || "リンクが正しくありません。メールのリンクから開きなおしてください。"; }
    else if (j.answered) { $("f").hidden = true; $("intro").innerHTML = "<h1>ご回答ありがとうございました</h1><p>この件は、すでにご回答をいただいています。</p>"; }
  }).catch(() => {});
})();
