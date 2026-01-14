// assets/js/main.js
(() => {
  const { $, getParam, getUTM, getOrCreateSessionId, toast, setActiveView } = window.Utils;
  const { TYPES } = window.QUIZ_DATA;

  const session_id = getOrCreateSessionId();
  const user_id = getParam("user_id"); // 앱 내: ?user_id=#####
  const utm = getUTM();

  function setUidNote(){
    const el = $("uidNote");
    if(!el) return;

    if(user_id){
      el.innerHTML = `<b>앱에서 열렸어요.</b><br/>user_id = <span style="font-family:ui-monospace, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">${user_id}</span>`;
    }else{
      el.innerHTML = `<b>웹에서 열렸어요.</b><br/>앱에서 열면 user_id가 자동으로 들어와요.`;
    }
  }

  // 외부 hooks(quiz.js에서 호출)
  window.AppActions = {
    async onAnswer({ questionIndex, choiceIndex }){
      if(!window.Analytics?.enabled()) return;
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
      if(window.Analytics?.enabled()){
        await window.Analytics.logEvent({
          event_name: "result_view",
          session_id,
          user_id: user_id || null,
          result_key: resultKey,
          result_name: t?.name || null,
          meta: { utm, scores, weights: t?.weights, referrer: document.referrer || null }
        });
      }
    },
    async onSharedResult({ resultKey }){
      const t = TYPES[resultKey];
      if(window.Analytics?.enabled()){
        await window.Analytics.logEvent({
          event_name: "result_view_shared",
          session_id,
          user_id: user_id || null,
          result_key: resultKey,
          result_name: t?.name || null,
          meta: { utm, referrer: document.referrer || null }
        });
      }
    }
  };

  async function pageView(){
    if(!window.Analytics?.enabled()) return;
    await window.Analytics.logEvent({
      event_name: "page_view",
      session_id,
      user_id: user_id || null,
      meta: { utm, referrer: document.referrer || null, ua: navigator.userAgent }
    });
  }

  async function copyLink(){
    try{
      await navigator.clipboard.writeText($("shareUrl").value);
      toast("링크가 복사됐어요");
      if(window.Analytics?.enabled()){
        await window.Analytics.logEvent({
          event_name:"share_copy",
          session_id,
          user_id: user_id || null,
          result_key: window.Quiz.state.resultKey,
          meta:{ utm }
        });
      }
    }catch{
      alert("복사에 실패했어요. 주소창의 링크를 직접 복사해 주세요.");
    }
  }

  async function saveMyType(){
    const resultKey = window.Quiz.state.resultKey;
    if(!resultKey) return;
    const t = TYPES[resultKey];

    // 이벤트
    if(window.Analytics?.enabled()){
      await window.Analytics.logEvent({
        event_name:"save_type_click",
        session_id,
        user_id: user_id || null,
        result_key: resultKey,
        result_name: t?.name || null,
        meta:{ utm }
      });
    }

    // 결과 저장
    const payload = {
      session_id,
      user_id: user_id || null,
      quiz_version: window.APP_CONFIG?.QUIZ_VERSION || "unknown",
      result_key: resultKey,
      result_name: t?.name || null,
      scores: window.Quiz.state.score,
      weights: t?.weights || null,
      utm,
      referrer: document.referrer || null
    };

    if(!window.Analytics?.enabled()){
      toast("데모 상태예요 (Supabase 설정 필요)");
      return;
    }

    const ok = await window.Analytics.saveResult(payload);
    toast(ok ? "저장 완료!" : "저장 실패(잠시 후 다시)");
  }

  function restartToIntro(){
    const url = new URL(location.href);
    url.hash = "";
    history.replaceState(null, "", url.toString());
    window.Quiz.showIntro();
    setActiveView("viewIntro");
    pageView();
  }

  // 바인딩
  $("btnStart")?.addEventListener("click", async () => {
    if(window.Analytics?.enabled()){
      await window.Analytics.logEvent({ event_name:"quiz_start", session_id, user_id: user_id || null, meta:{ utm } });
    }
    window.Quiz.startQuiz();
  });

  $("btnDemo")?.addEventListener("click", () => {
    window.Quiz.renderResult("PVE");
    setActiveView("viewResult");
  });

  $("btnPrev")?.addEventListener("click", () => window.Quiz.prev());
  $("btnRestart")?.addEventListener("click", () => restartToIntro());
  $("btnRestartMini")?.addEventListener("click", () => window.Quiz.prev()); // 소BTI 느낌 "← 뒤로"

  $("btnCopy")?.addEventListener("click", () => copyLink());
  $("btnSave")?.addEventListener("click", () => saveMyType());

  $("btnRetake")?.addEventListener("click", () => restartToIntro());
  $("btnRetake2")?.addEventListener("click", () => restartToIntro());

  $("btnExplain")?.addEventListener("click", () => window.Quiz.explain());

  // boot
  setUidNote();
  pageView();

  // 공유 링크(#t=...)면 결과로 바로
  window.Quiz.loadFromHash();
})();
