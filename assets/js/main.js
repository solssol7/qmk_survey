// assets/js/main.js
(() => {
    const { $, getParam, getUTM, getOrCreateSessionId, toast, setActiveView } = window.Utils;
    const { TYPES } = window.QUIZ_DATA;
  
    const session_id = getOrCreateSessionId();
    const user_id = getParam("user_id"); // 앱 내: 항상 들어온다고 했던 값
    const utm = getUTM();
  
    // 외부에서 quiz.js가 호출할 hooks
    window.AppActions = {
      async onAnswer({ questionIndex, choiceIndex }){
        await window.Analytics.logEvent({
          event_name: "answer",
          session_id,
          user_id: user_id || null,
          question_index: questionIndex,
          choice_index: choiceIndex,
          meta: { utm, referrer: document.referrer || null }
        });
      },
      async onResult({ resultKey, scores }){
        const t = TYPES[resultKey];
        await window.Analytics.logEvent({
          event_name: "result_view",
          session_id,
          user_id: user_id || null,
          result_key: resultKey,
          result_name: t?.name || null,
          meta: { utm, scores, weights: t?.weights, referrer: document.referrer || null }
        });
      },
      async onSharedResult({ resultKey }){
        const t = TYPES[resultKey];
        await window.Analytics.logEvent({
          event_name: "result_view_shared",
          session_id,
          user_id: user_id || null,
          result_key: resultKey,
          result_name: t?.name || null,
          meta: { utm, referrer: document.referrer || null }
        });
      }
    };
  
    async function pageView(){
      await window.Analytics.logEvent({
        event_name: "page_view",
        session_id,
        user_id: user_id || null,
        meta: { utm, referrer: document.referrer || null, ua: navigator.userAgent }
      });
    }
  
    function setUidNote(){
      const el = $("uidNote");
      if(!el) return;
      if(user_id){
        el.innerHTML = `<b>앱에서 열렸어요.</b><br/>user_id = <span style="font-family:var(--mono)">${user_id}</span>`;
      }else{
        el.innerHTML = `<b>웹에서 열렸어요.</b><br/>앱에서 열면 user_id가 자동으로 들어와요.`;
      }
    }
  
    async function copyLink(){
      try{
        await navigator.clipboard.writeText($("shareUrl").value);
        toast("링크가 복사됐어요");
        await window.Analytics.logEvent({
          event_name:"share_copy",
          session_id,
          user_id: user_id || null,
          result_key: window.Quiz.state.resultKey,
          meta:{ utm }
        });
      }catch{
        alert("복사에 실패했어요. 주소창의 링크를 직접 복사해 주세요.");
      }
    }
  
    async function saveMyType(){
      const resultKey = window.Quiz.state.resultKey;
      if(!resultKey) return;
  
      const t = TYPES[resultKey];
  
      await window.Analytics.logEvent({
        event_name:"save_type_click",
        session_id,
        user_id: user_id || null,
        result_key: resultKey,
        result_name: t?.name || null,
        meta:{ utm }
      });
  
      // 결과 스냅샷 저장
      const payload = {
        session_id,
        user_id: user_id || null,
        quiz_version: window.APP_CONFIG.QUIZ_VERSION,
        result_key: resultKey,
        result_name: t?.name || null,
        scores: window.Quiz.state.score,
        weights: t?.weights || null,
        utm,
        referrer: document.referrer || null
      };
  
      if(!window.Analytics.enabled()){
        toast("데모 상태예요 (Supabase 설정 필요)");
        return;
      }
  
      const ok = await window.Analytics.saveResult(payload);
      toast(ok ? "저장 완료!" : "저장 실패(잠시 후 다시)");
    }
  
    function restart(){
      const url = new URL(location.href);
      url.hash = "";
      history.replaceState(null, "", url.toString());
      window.Quiz.showIntro();
      pageView();
    }
  
    // 바인딩
    $("btnStart").addEventListener("click", async () => {
      await window.Analytics.logEvent({ event_name:"quiz_start", session_id, user_id: user_id || null, meta:{ utm } });
      window.Quiz.startQuiz();
    });
  
    $("btnDemo").addEventListener("click", () => {
      window.Quiz.renderResult("PVE");
      setActiveView("viewResult");
    });
  
    $("btnPrev").addEventListener("click", () => window.Quiz.prev());
    $("btnRestart").addEventListener("click", () => restart());
  
    $("btnCopy").addEventListener("click", () => copyLink());
    $("btnSave").addEventListener("click", () => saveMyType());
  
    $("btnRetake").addEventListener("click", () => restart());
    $("btnExplain").addEventListener("click", () => window.Quiz.explain());
  
    // 부팅
    setUidNote();
    pageView();
    // 공유 링크라면 결과로 바로 진입
    window.Quiz.loadFromHash();
  })();
  