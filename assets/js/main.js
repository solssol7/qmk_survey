// assets/js/main.js
(() => {
  const { $, getParam, getUTM, getOrCreateSessionId, toast, setActiveView } = window.Utils;
  const { TYPES } = window.QUIZ_DATA;

  // [설정] 여기에 실제 앱 딥링크 스킴(Scheme)이나 유니버셜 링크 기본 주소를 적어주세요.
  // 예: "cool-grocery://quiz/result" 또는 "https://link.cool-grocery.com/result"
  const APP_DEEP_LINK_BASE = "example-app://quiz/result"; 

  const session_id = getOrCreateSessionId();
  const user_id = getParam("user_id"); 
  const utm = getUTM();

  function setUidNote(){
    const el = $("uidNote");
    if(!el) return;
    // user_id 확인용 (필요 시 주석 해제)
    // if(user_id) el.textContent = `User: ${user_id}`;
  }

  // Analytics Hooks
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
      // 딥링크로 들어왔을 때 로직 (웹에서 처리할 일이 있다면 사용)
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

  // [핵심 변경] 공유용 딥링크 생성 함수
  function getDeepLink() {
    // 1. 기본 딥링크 주소 가져오기
    let baseUrl = APP_DEEP_LINK_BASE;
    
    // 2. 파라미터 조립을 위한 URL 객체 생성 (가상의 base 사용)
    //    만약 APP_DEEP_LINK_BASE가 'myapp://' 형태라면 URLSearchParams를 직접 쓰는 게 나을 수 있음
    const params = new URLSearchParams();

    // 3. 추천인 ID 붙이기 (현재 user_id가 있다면 recommend_user_id로 변환)
    if (user_id) {
      params.set("recommend_user_id", user_id);
    }

    // 4. 결과 타입(Type) 붙이기
    if (window.Quiz.state.resultKey) {
      params.set("t", window.Quiz.state.resultKey); // 예: t=PVE
    }

    // 5. 최종 URL 조합 (구분자 ? 또는 & 처리)
    const queryString = params.toString();
    if (!queryString) return baseUrl;

    // 이미 base에 ?가 있으면 &로 연결, 없으면 ?로 연결
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}${queryString}`;
  }

  // [수정] 링크 복사 기능
  async function copyLink(){
    const deepLink = getDeepLink(); // 딥링크 생성
    
    try {
      await navigator.clipboard.writeText(deepLink);
      toast("앱 공유 링크가 복사되었어요!");
      
      // 로그 전송
      if(window.Analytics?.enabled()){
        await window.Analytics.logEvent({
          event_name:"share_copy_deeplink",
          session_id,
          user_id: user_id || null,
          result_key: window.Quiz.state.resultKey,
          meta:{ utm, deepLink }
        });
      }
    } catch {
      // 보안상 클립보드 접근이 막힌 경우 (prompt 활용)
      prompt("아래 링크를 복사해서 공유하세요!", deepLink);
    }
  }

  // [수정] 기본 공유 기능 (Web Share API)
  async function shareNative() {
    const deepLink = getDeepLink();

    if (navigator.share) {
      try {
        await navigator.share({
          title: '장보기 MBTI 테스트',
          text: '나의 장보기 성향을 앱에서 확인해보세요!',
          url: deepLink, // 여기에 딥링크를 넣음
        });
      } catch (err) {
        // 공유 취소됨
      }
    } else {
      copyLink();
    }
  }

  // 이미지 저장 기능 (기존 유지)
  function saveResultImage() {
    const target = document.querySelector(".card");
    if (!window.html2canvas) {
      toast("잠시만 기다려주세요...");
      return;
    }
    toast("이미지를 만들고 있어요...");

    html2canvas(target, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true
    }).then(canvas => {
      const link = document.createElement("a");
      const filename = `market_mbti_${window.Quiz.state.resultKey || "result"}.png`;
      link.download = filename;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast("이미지가 저장되었어요!");
      
      if(window.Analytics?.enabled()){
         window.Analytics.logEvent({
          event_name:"save_image",
          session_id,
          user_id: user_id || null,
          result_key: window.Quiz.state.resultKey,
          meta:{ utm }
        });
      }
    }).catch(err => {
      console.error(err);
      toast("저장에 실패했어요. 다시 시도해주세요.");
    });
  }

  function restartToIntro(){
    const url = new URL(location.href);
    url.hash = "";
    history.replaceState(null, "", url.toString());
    window.Quiz.showIntro();
    setActiveView("viewIntro");
    pageView();
  }

  // 이벤트 리스너 연결
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
  
  // 버튼 액션
  $("btnCopy")?.addEventListener("click", () => copyLink());
  $("btnShare")?.addEventListener("click", () => shareNative());
  $("btnSave")?.addEventListener("click", () => saveResultImage());
  
  $("btnRestart")?.addEventListener("click", () => restartToIntro());

  // 초기화
  setUidNote();
  pageView();

  // 웹 URL 해시로 들어온 경우도 처리 (테스트용)
  window.Quiz.loadFromHash();
})();
