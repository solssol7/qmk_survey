// assets/js/main.js
(() => {
  const { $, getParam, getUTM, getOrCreateSessionId, toast, setActiveView } = window.Utils;
  const { TYPES } = window.QUIZ_DATA;

  // [설정] 앱 딥링크 주소
  const APP_DEEP_LINK_BASE = "example-app://quiz/result"; 

  const session_id = getOrCreateSessionId();
  // [수정] 다시 user_id로 변경
  const user_id = getParam("user_id"); 
  const utm = getUTM();

  function setUidNote(){
    const el = $("uidNote");
    if(!el) return;
    // if(user_id) el.textContent = `User: ${user_id}`;
  }

  // 퀴즈 동작 훅 (Hooks)
  window.AppActions = {
    async onAnswer({ questionIndex, choiceIndex }){
      // Empty
    },

    // [중요] 결과 산출 시 Supabase에 자동 저장
    async onResult({ resultKey, scores }){
      const t = TYPES[resultKey];
      
      if(window.Analytics?.enabled()){
        await window.Analytics.saveResult({
          session_id,
          user_id: user_id || null, // [수정] user_id 전달
          result_key: resultKey,
          result_name: t?.name || null,
          scores,
          weights: t?.weights || null,
          utm,
          referrer: document.referrer || null
        });
        console.log("결과 데이터가 Supabase에 저장되었습니다.");
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

    // [수정] 추천인 파라미터도 스네이크케이스(recommend_user_id)로 복구
    if (user_id) params.set("recommend_user_id", user_id);
    if (window.Quiz.state.resultKey) params.set("t", window.Quiz.state.resultKey);

    const queryString = params.toString();
    if (!queryString) return baseUrl;
    
    // URL 연결자 처리 (?, &)
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}${queryString}`;
  }

  // 링크 복사 기능
  async function copyLink(){
    const deepLink = getDeepLink();
    try {
      await navigator.clipboard.writeText(deepLink);
      toast("앱 공유 링크가 복사되었어요!");
    } catch {
      prompt("아래 링크를 복사해서 공유하세요!", deepLink);
    }
  }

  // 기본 공유 기능
  async function shareNative() {
    const deepLink = getDeepLink();
    if (navigator.share) {
      try {
        await navigator.share({
          title: '장보기 MBTI 테스트',
          text: '나의 장보기 성향을 앱에서 확인해보세요!',
          url: deepLink,
        });
      } catch (err) {
        // 무시
      }
    } else {
      copyLink();
    }
  }

  // assets/js/main.js 수정 제안

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
      const base64Image = canvas.toDataURL("image/png");

      // 1. 앱 환경인지 체크 (UserAgent 등 활용하거나 브릿지 객체 유무 확인)
      // 예: 리액트 네이티브 웹뷰를 사용하는 경우
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "SAVE_IMAGE",
          payload: base64Image
        }));
        // 앱에서 저장 성공 토스트를 띄우게 하거나, 여기서 일단 띄움
        // toast("앱으로 저장 요청을 보냈어요!");
      } 
      // 2. iOS/Android 네이티브 브릿지가 있는 경우 (예시)
      else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.saveImage) {
         window.webkit.messageHandlers.saveImage.postMessage(base64Image);
      }
      else if (window.android && window.android.saveImage) {
         window.android.saveImage(base64Image);
      }
      // 3. 일반 브라우저(PC/모바일웹)인 경우 기존 방식 사용
      else {
        const link = document.createElement("a");
        const filename = `market_mbti_${window.Quiz.state.resultKey || "result"}.png`;
        link.download = filename;
        link.href = base64Image;
        link.click();
        toast("이미지가 저장되었어요!");
      }
    }).catch(err => {
      console.error(err);
      toast("저장에 실패했어요.");
    });
  }

  function restartToIntro(){
    const url = new URL(location.href);
    url.hash = "";
    history.replaceState(null, "", url.toString());
    window.Quiz.showIntro();
    setActiveView("viewIntro");
  }

  // 버튼 이벤트 연결
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

  // 초기화 실행
  setUidNote();
  window.Quiz.loadFromHash();
})();
