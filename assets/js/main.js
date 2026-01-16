// assets/js/main.js
(() => {
  const { $, getParam, getUTM, getOrCreateSessionId, toast, setActiveView } = window.Utils;
  const { TYPES } = window.QUIZ_DATA;

  // [설정] 앱 딥링크 주소
  const APP_DEEP_LINK_BASE = "example-app://quiz/result"; 

  const session_id = getOrCreateSessionId();
  // 파라미터 이름을 'userId'로 변경
  const userId = getParam("userId"); 
  const utm = getUTM();

  function setUidNote(){
    const el = $("uidNote");
    if(!el) return;
    // if(userId) el.textContent = `User: ${userId}`;
  }

  // 퀴즈 동작 훅 (Hooks)
  window.AppActions = {
    // 답변 클릭 시 (로그 기능 제거로 인해 비워둠 -> 코드 감소 원인)
    async onAnswer({ questionIndex, choiceIndex }){
      // Empty
    },

    // [중요] 결과 산출 시 Supabase에 자동 저장
    async onResult({ resultKey, scores }){
      const t = TYPES[resultKey];
      
      // Analytics가 활성화(설정)되어 있다면 저장 시도
      if(window.Analytics?.enabled()){
        await window.Analytics.saveResult({
          session_id,
          userId: userId || null, 
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

    // 공유된 링크로 들어왔을 때 (로그 제거로 비워둠)
    async onSharedResult({ resultKey }){
      // Empty
    }
  };

  // 딥링크 생성 함수
  function getDeepLink() {
    let baseUrl = APP_DEEP_LINK_BASE;
    const params = new URLSearchParams();

    // 추천인 ID 및 결과 타입 파라미터 추가
    if (userId) params.set("recommendUserId", userId);
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
      // 클립보드 접근 권한 없을 때 대비
      prompt("아래 링크를 복사해서 공유하세요!", deepLink);
    }
  }

  // 기본 공유 기능 (모바일 네이티브 공유)
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
        // 공유 취소 시 에러 무시
      }
    } else {
      copyLink();
    }
  }

  // 결과 이미지 저장 기능
  function saveResultImage() {
    const target = document.querySelector(".card");
    if (!window.html2canvas) {
      toast("잠시만 기다려주세요 (라이브러리 로딩 중)");
      return;
    }
    toast("이미지를 만들고 있어요...");

    html2canvas(target, {
      scale: 2, // 고화질
      backgroundColor: "#ffffff", // 배경 투명 방지
      useCORS: true // 외부 이미지 로딩 허용
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

  // 버튼 이벤트 연결
  $("btnStart")?.addEventListener("click", () => window.Quiz.startQuiz());
  $("btnDemo")?.addEventListener("click", () => {
    window.Quiz.renderResult("PVE"); // 데모용 (임의 결과)
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
