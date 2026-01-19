// assets/js/main.js
(() => {
  const { $, getParam, getUTM, getOrCreateSessionId, toast, setActiveView } = window.Utils;
  const { TYPES } = window.QUIZ_DATA;

  // =========================================================================
  // [설정] 에어브릿지 SDK 설정
  // =========================================================================
  const AIRBRIDGE_APP_NAME = "qmarket"; 
  
  // [필수] 에어브릿지 대시보드 > Settings > Tokens > Web SDK Token 값 입력
  const AIRBRIDGE_WEB_TOKEN = "b9570777b7534dfc85eb1bf89204f2e7"; 

  // 1. 웹뷰 타겟 도메인
  const WEBVIEW_TARGET_DOMAIN = "https://mbti.event.qmarket.me"; 
  
  // 2. 앱 미설치 시 이동할 스토어 주소 (Fallback)
  const ANDROID_STORE_URL = "https://play.google.com/store/apps/details?id=com.aswemake.qmarket";
  const IOS_STORE_URL = "https://apps.apple.com/kr/app/%ED%81%90%EB%A7%88%EC%BC%93-%EC%9A%B0%EB%A6%AC-%EB%8F%99%EB%84%A4-%EC%8A%88%ED%8D%BC%EB%A7%88%ED%8A%B8-%EC%8B%9D%ED%92%88-%ED%95%A0%EC%9D%B8-%EB%8B%B9%EC%9D%BC-%EB%B0%B0%EB%8B%AC/id1514329713";
  // =========================================================================

  // [초기화] 에어브릿지 SDK 실행
  if (window.airbridge) {
    window.airbridge.init({
      app: AIRBRIDGE_APP_NAME,
      webToken: AIRBRIDGE_WEB_TOKEN,
      useMbox: false
    });
  } else {
    console.error("에어브릿지 SDK가 로드되지 않았습니다. index.html을 확인하세요.");
  }

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
      if (!user_id && !recommend_user_id) return; 

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

  // [핵심] 숏링크 생성 함수
  async function generateShortLink() {
    toast("공유 링크를 만들고 있어요...");

    // 1. 내부 웹 URL
    const targetParams = new URLSearchParams();
    if (user_id) targetParams.set("recommend_user_id", user_id);
    if (window.Quiz.state.resultKey) targetParams.set("t", window.Quiz.state.resultKey);
    const innerUrl = `${WEBVIEW_TARGET_DOMAIN}?${targetParams.toString()}`;

    // 2. 앱 스킴
    const appScheme = `qmarket://webview?link=${encodeURIComponent(innerUrl)}`;

    try {
      if (!window.airbridge) throw new Error("SDK 미로드");

      const result = await window.airbridge.createTrackingLink({
        channel: "in_app_referral",
        campaign: "friend_invite_2025",
        deeplink_url: appScheme,
        android_fallback_url: ANDROID_STORE_URL,
        ios_fallback_url: IOS_STORE_URL,
        fallback_url: ANDROID_STORE_URL,
        og_tags: {
          title: "장보기 MBTI 테스트",
          description: "나의 장보기 성향을 앱에서 확인해보세요!",
          image: "https://mbti.event.qmarket.me/assets/img/intro/intro.webp"
        }
      });
      return result.shortUrl; // 성공 시 숏링크 반환

    } catch (e) {
      console.error("숏링크 생성 실패, 롱링크로 대체합니다.", e);
      // 실패 시 롱링크 반환
      return `https://${AIRBRIDGE_APP_NAME}.airbridge.io/links` +
        `?channel=in_app_referral` +
        `&campaign=friend_invite_2025` +
        `&deeplink_url=${encodeURIComponent(appScheme)}` +
        `&android_fallback_url=${encodeURIComponent(ANDROID_STORE_URL)}` +
        `&ios_fallback_url=${encodeURIComponent(IOS_STORE_URL)}` +
        `&fallback_url=${encodeURIComponent(ANDROID_STORE_URL)}`;
    }
  }

  // [수정] 링크 복사 버튼 (전달받은 링크가 있으면 그걸 쓰고, 없으면 새로 생성)
  async function copyLink(existingLink = null){
    // 인자로 받은 링크가 있으면 재사용, 없으면 새로 생성 (await 필수)
    const link = existingLink || await generateShortLink(); 
    
    try {
      await navigator.clipboard.writeText(link);
      toast("짧은 공유 링크가 복사되었어요!");
    } catch {
      prompt("아래 링크를 복사하세요!", link);
    }
  }

  // [수정] 공유하기 버튼
  async function shareNative() {
    const link = await generateShortLink(); // 1. 링크 생성
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: '장보기 MBTI 테스트',
          text: '나의 장보기 성향을 앱에서 확인해보세요!',
          url: link,
        });
      } catch (err) {
        // 공유 창 띄웠다가 취소한 경우는 에러로 보지 않음 (조용히 종료)
      }
    } else {
      // 2. 공유 기능이 없는 PC 등에서는 복사 기능으로 연결
      // (이때 방금 만든 'link'를 넘겨줘서 두 번 생성하는 비효율 방지)
      copyLink(link);
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

  const uidNote = $("uidNote"); if(uidNote) {};
  window.Quiz.loadFromHash();
})();
