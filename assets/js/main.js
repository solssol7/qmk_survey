// assets/js/main.js
(() => {
  const { $, getParam, getUTM, getOrCreateSessionId, toast, setActiveView } = window.Utils;
  const { TYPES } = window.QUIZ_DATA;

  // [설정] 앱 딥링크 주소
  const APP_DEEP_LINK_BASE = "example-app://quiz/result"; 

  const session_id = getOrCreateSessionId();
  
  // 1. 사용자 ID (로그인한 사람)
  const user_id = getParam("user_id"); 
  
  // 2. 추천인 코드
  const recommend_user_id = getParam("recommend_user_id") || getParam("ref");

  const utm = getUTM();

  function setUidNote(){
    const el = $("uidNote");
    if(!el) return;
  }

  window.AppActions = {
    async onAnswer({ questionIndex, choiceIndex }){
      // Empty
    },

    // [중요] 결과 저장 로직
    async onResult({ resultKey, scores }){
      const t = TYPES[resultKey];
      
      // 저장 조건: user_id가 있거나 OR 추천인(recommend_user_id)이 있을 때만 저장
      if (!user_id && !recommend_user_id) {
        console.log("식별 정보(user_id, recommend_user_id)가 없어 저장하지 않습니다.");
        return; 
      }

      if(window.Analytics?.enabled()){
        await window.Analytics.saveResult({
          session_id,
          user_id: user_id || null, 
          result_key: resultKey,
          result_name: t?.name || null,
          scores,
          weights: t?.weights || null,
          utm,
          referrer: document.referrer || null
        });
        console.log("조건 충족: 결과 데이터 저장 완료");
      }
    },

    async onSharedResult({ resultKey }){
      // Empty
    }
  };

  function getDeepLink() {
    let baseUrl = APP_DEEP_LINK_BASE;
    const params = new URLSearchParams();

    if (user_id) params.set("recommend_user_id", user_id);
    if (window.Quiz.state.resultKey) params.set("t", window.Quiz.state.resultKey);

    const queryString = params.toString();
    if (!queryString) return baseUrl;
    
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}${queryString}`;
  }

  async function copyLink(){
    const deepLink = getDeepLink();
    try {
      await navigator.clipboard.writeText(deepLink);
      toast("앱 공유 링크가 복사되었어요!");
    } catch {
      prompt("아래 링크를 복사해서 공유하세요!", deepLink);
    }
  }

  async function shareNative() {
    const deepLink = getDeepLink();
    if (navigator.share) {
      try {
        await navigator.share({
          title: '장보기 MBTI 테스트',
          text: '나의 장보기 성향을 앱에서 확인해보세요!',
          url: deepLink,
        });
      } catch (err) {}
    } else {
      copyLink();
    }
  }

  // [삭제됨] saveResultImage 함수 제거

  function restartToIntro(){
    const url = new URL(location.href);
    url.hash = "";
    history.replaceState(null, "", url.toString());
    window.Quiz.showIntro();
    setActiveView("viewIntro");
  }

  $("btnStart")?.addEventListener("click", () => window.Quiz.startQuiz());
  $("btnDemo")?.addEventListener("click", () => {
    window.Quiz.renderResult("PVE");
    setActiveView("viewResult");
  });
  $("btnPrev")?.addEventListener("click", () => window.Quiz.prev());
  
  $("btnCopy")?.addEventListener("click", () => copyLink());
  $("btnShare")?.addEventListener("click", () => shareNative());
  
  // [삭제됨] 이미지 저장 버튼 이벤트 제거
  
  $("btnRestart")?.addEventListener("click", () => restartToIntro());

  setUidNote();
  window.Quiz.loadFromHash();
})();
