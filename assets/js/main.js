(() => {
  const { $, getParam, getUTM, getOrCreateSessionId, toast, setActiveView } = window.Utils;
  const { TYPES } = window.QUIZ_DATA;

  // =========================================================================
  // [설정] 에어브릿지 및 앱 연결 정보 (수정됨)
  // =========================================================================
  const AIRBRIDGE_APP_NAME = "qmarket"; 
  
  // 1. 웹뷰로 띄울 타겟 도메인 (https:// 포함)
  const WEBVIEW_TARGET_DOMAIN = "https://mbti.event.qmarket.me"; 
  
  // 2. 앱 미설치 시 이동할 스토어 주소 (Fallback)
  const ANDROID_STORE_URL = "https://play.google.com/store/apps/details?id=com.aswemake.qmarket";
  const IOS_STORE_URL = "https://apps.apple.com/kr/app/%ED%81%90%EB%A7%88%EC%BC%93-%EC%9A%B0%EB%A6%AC-%EB%8F%99%EB%84%A4-%EC%8A%88%ED%8D%BC%EB%A7%88%ED%8A%B8-%EC%8B%9D%ED%92%88-%ED%95%A0%EC%9D%B8-%EB%8B%B9%EC%9D%BC-%EB%B0%B0%EB%8B%AC/id1514329713";
  // =========================================================================

  const session_id = getOrCreateSessionId();
  const user_id = getParam("user_id"); 
  const recommend_user_id = getParam("recommend_user_id") || getParam("ref");
  const utm = getUTM();

  function setUidNote(){
    const el = $("uidNote");
    if(!el) return;
  }

  window.AppActions = {
    async onAnswer({ questionIndex, choiceIndex }){ },

    async onResult({ resultKey, scores }){
      const t = TYPES[resultKey];
      
      if (!user_id && !recommend_user_id) {
        console.log("식별 정보가 없어 저장하지 않습니다.");
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
      }
    },

    async onSharedResult({ resultKey }){ }
  };

  // [핵심 기능] 딥링크 생성 함수 (에어브릿지 + 웹뷰 스킴 적용)
  function getDeepLink() {
    // 1. 웹뷰 내부 파라미터 구성 (추천인, 결과 타입)
    const targetParams = new URLSearchParams();
    if (user_id) targetParams.set("recommend_user_id", user_id);
    if (window.Quiz.state.resultKey) targetParams.set("t", window.Quiz.state.resultKey);
    
    const queryString = targetParams.toString();
    
    // 2. 내부 웹 URL: https://mbti.event.qmarket.me?recommend_user_id=...
    const innerUrl = queryString ? `${WEBVIEW_TARGET_DOMAIN}?${queryString}` : WEBVIEW_TARGET_DOMAIN;

    // 3. 앱 스킴 생성: qmarket://webview?link=[URL_ENCODED_INNER_URL]
    const appScheme = `qmarket://webview?link=${encodeURIComponent(innerUrl)}`;

    // 4. 에어브릿지 트래킹 링크 조립
    const channel = "in_app_referral";
    const campaign = "friend_invite_2025";
    
    const airbridgeUrl = `https://${AIRBRIDGE_APP_NAME}.airbridge.io/links` +
      `?channel=${channel}` +
      `&campaign=${campaign}` +
      `&deeplink_url=${encodeURIComponent(appScheme)}` +
      `&android_fallback_url=${encodeURIComponent(ANDROID_STORE_URL)}` +
      `&ios_fallback_url=${encodeURIComponent(IOS_STORE_URL)}` +
      `&fallback_url=${encodeURIComponent(ANDROID_STORE_URL)}`;

    return airbridgeUrl;
  }

  // 링크 복사 버튼 클릭 시
  async function copyLink(){
    const link = getDeepLink();
    try {
      await navigator.clipboard.writeText(link);
      toast("공유 링크가 복사되었어요! (친구에게 붙여넣기)");
    } catch {
      prompt("아래 링크를 복사해서 공유하세요!", link);
    }
  }

  // 공유하기 버튼 클릭 시
  async function shareNative() {
    const link = getDeepLink();
    if (navigator.share) {
      try {
        await navigator.share({
          title: '장보기 MBTI 테스트',
          text: '나의 장보기 성향을 앱에서 확인해보세요!',
          url: link,
        });
      } catch (err) {}
    } else {
      copyLink();
    }
  }

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
  
  $("btnRestart")?.addEventListener("click", () => restartToIntro());

  setUidNote();
  window.Quiz.loadFromHash();
})();
