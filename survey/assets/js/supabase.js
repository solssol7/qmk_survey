// assets/js/supabase.js
window.Analytics = (() => {
    const { SUPABASE_URL, SUPABASE_ANON_KEY, QUIZ_VERSION } = window.APP_CONFIG;
  
    function enabled(){ return !!(SUPABASE_URL && SUPABASE_ANON_KEY); }
  
    async function insert(table, rows){
      if(!enabled()) return { ok:false, skipped:true };
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
        throw new Error(`Supabase insert failed: ${res.status} ${text}`);
      }
      return { ok:true };
    }
  
    async function logEvent({ event_name, session_id, user_id, meta={}, question_index=null, choice_index=null, result_key=null, result_name=null }){
      const row = {
        event_name,
        session_id,
        user_id,
        quiz_version: QUIZ_VERSION,
        question_index,
        choice_index,
        result_key,
        result_name,
        meta,
      };
      try{
        await insert("quiz_events", [row]);
      }catch(e){
        console.warn(e);
      }
    }
  
    async function saveResult(payload){
      try{
        await insert("quiz_results", [payload]);
        return true;
      }catch(e){
        console.warn(e);
        return false;
      }
    }
  
    return { enabled, logEvent, saveResult };
  })();
  