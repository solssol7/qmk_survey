// assets/js/supabase.js
window.Analytics = (() => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY, QUIZ_VERSION } = window.APP_CONFIG;

  function enabled(){ return !!(SUPABASE_URL && SUPABASE_ANON_KEY); }

  async function insert(table, rows){
    if(!enabled()) return { ok:false, skipped:true };
    
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify(rows),
      });

      if(!res.ok){
        const text = await res.text().catch(()=> "");
        console.warn(`Supabase insert failed: ${res.status} ${text}`);
        return { ok: false };
      }
      return { ok: true };
    } catch(e) {
      console.warn("Supabase error:", e);
      return { ok: false };
    }
  }

  // [수정] userId 파라미터 이름 변경 및 매핑
  async function saveResult({ session_id, userId, result_key, result_name, scores, weights, utm, referrer }){
    const row = {
      session_id,
      user_id: userId,     // [중요] JS 변수 userId -> DB 컬럼 user_id 매핑
      quiz_version: QUIZ_VERSION,
      result_key,
      result_name,
      scores,
      weights,
      utm,
      referrer
    };
    
    return await insert("quiz_results", [row]);
  }

  return { enabled, saveResult };
})();
