// このファイルだけ書きかえれば、自社用になります。空（""）の所は、画面に出ない／デモ表示になります。
window.QS_CONFIG = {
  COMPANY_NAME: "ありがとうエアコンお掃除専門店",
  GAS_URL: "https://script.google.com/macros/s/AKfycbwv-4YcUkJfx2C7olTie2zTXNhtejVPQZ0Fxr-zZM1D7pIL34bh3iVw_QWetTftTlZ8Sw/exec",          // フォームの受け口（Apps Script ウェブアプリ）のURL。空ならデモ（送信しても記録されません）
  REVIEW_URL: "",       // Googleマップの口コミ用リンク。ビジネスプロフィールの管理画面（パソコン）→「クチコミを読む」→「クチコミを増やす」でコピー
  CONTACT_LINE_URL: "", // 会社のLINEのURL（任意）
  CONTACT_EMAIL: "",    // 会社のメール（任意）
  SOURCES: ["ユアマイスター", "ホームページ", "くらしのマーケット", "直接（電話・LINE・メールなど）", "その他"],  // リンクで src が渡されない時に聞く選択肢
  STAFF_LIST: [],       // 例：["スタッフA","スタッフB"]。空で、リンクにも staff が無ければ、入力欄を出す
  HOUSE: ["マンション・アパート", "戸建て", "その他"],
  PREFS: ["神奈川県", "東京都", "埼玉県", "千葉県", "愛知県", "大阪府", "山梨県", "群馬県", "福岡県", "兵庫県", "その他"]
};
