// assets/js/main.js
(() => {
  const { $, getParam, getUTM, getOrCreateSessionId, toast, setActiveView } = window.Utils;
  const { TYPES } = window.QUIZ_DATA;

  // [설정] 앱 딥링크 주소 (개발팀이 설정한 스킴으로 변경 필요)
  const APP_DEEP_LINK_BASE = "example-app://quiz/result"; 

  const session_id = getOrCreateSessionId();
  // URL에서 user_id 파라미터 획득 (예: ?user_id=123)
  const user_id = getParam("user_id"); 
  const utm = getUTM();

  function setUidNote(){
    const el = $("uidNote");
    if(!el) return;
  }

  // 퀴즈 동작 훅 (Hooks)
  window.AppActions = {
    // 답변 클릭 시
    async onAnswer({ questionIndex, choiceIndex }){
      // Empty
    },

    // 결과 산출 시 Supabase에 자동 저장
    async onResult({ resultKey, scores }){
      const t = TYPES[resultKey];
      
      if(window.Analytics?.enabled()){
        await window.Analytics.saveResult({
          session_id,
          user_id: user_id || null, // URL에서 받은 ID 저장
          result_key: resultKey,
          result_name: t?.name || null,
          scores,
          weights: t?.weights || null,
          utm,
          referrer: document.referrer || null
        });
        console.log("결과 데이터 저장 완료");
      }
    },

    async onSharedResult({ resultKey }){
      // Empty
    }
  };

  // 딥링크 생성 함수
  function getDeepLink() {
    let baseUrl = APP_DEEP_LINK_BASE;
    const params = new URLSearchParams();

    // 내 user_id를 추천인 ID(recommend_user_id)로 넘김
    if (user_id) params.set("recommend_user_id", user_id);
    if (window.Quiz.state.resultKey) params.set("t", window.Quiz.state.resultKey);

    const queryString = params.toString();
    if (!queryString) return baseUrl;
    
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}${queryString}`;
  }

  // 링크 복사
  async function copyLink(){
    const deepLink = getDeepLink();
    try {
      await navigator.clipboard.writeText(deepLink);
      toast("앱 공유 링크가 복사되었어요!");
    } catch {
      prompt("아래 링크를 복사해서 공유하세요!", deepLink);
    }
  }

  // 네이티브 공유
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

  // 결과 이미지 저장 (내부 라이브러리 사용)
  function saveResultImage() {
    const target = document.querySelector(".card");
    if (!window.html2canvas) {
      toast("잠시만 기다려주세요 (라이브러리 로딩 중)");
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
  }

  // 이벤트 연결
  $("btnStart")?.addEventListener("click", () => window.Quiz.startQuiz());
  $("btnDemo")?.addEventListener("click", () => {
    window.Quiz.renderResult("PVE"); 
    setActiveView("viewResult");
  });
  $("btnPrev")?.addEventListener("click", () => window.Quiz.prev());
  
  $("btnCopy")?.addEventListener("click", () => copyLink());
  $("btnShare")?.addEventListener("click", () => shareNative());
  $("btnSave")?.addEventListener("click", () => saveResultImage());
  
  $("btnRestart")?.addEventListener("click", () => restartToIntro());

  // 초기화
  setUidNote();
  window.Quiz.loadFromHash();
})();
