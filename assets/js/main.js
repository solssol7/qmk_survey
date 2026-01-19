// assets/js/main.js
(() => {
  const { $, getParam, getUTM, getOrCreateSessionId, toast, setActiveView } = window.Utils;
  const { TYPES } = window.QUIZ_DATA;

  // =========================================================================
  // [설정] 에어브릿지 SDK 설정
  // =========================================================================
  const AIRBRIDGE_APP_NAME = "qmarket"; 
  
  // [입력됨] 제공해주신 API 토큰
  const AIRBRIDGE_WEB_TOKEN = "aa31841e91b24c5395aa6569c7e9eced"; 

  // 1. 웹뷰 타겟 도메인 (https:// 필수)
  const WEBVIEW_TARGET_DOMAIN = "https://mbti.event.qmarket.me"; 
  
  // 2. 앱 미설치 시 이동할 스토어 주소 (Fallback)
  const ANDROID_STORE_URL = "https://play.google.com/store/apps/details?id=com.aswemake.qmarket";
  const IOS_STORE_URL = "https://apps.apple.com/kr/app/%ED%81%90%EB%A7%88%EC%BC%93-%EC%9A%B0%EB%A6%AC-%EB%8F%99%EB%84%A4-%EC%8A%88%ED%8D%BC%EB%A7%88%ED%8A%B8-%EC%8B%9D%ED%92%88-%ED%95%A0%EC%9D%B8-%EB%8B%B9%EC%9D%BC-%EB%B0%B0%EB%8B%AC/id1514329713";
  // =========================================================================

  // [초기화] 에어브릿지 SDK 실행
  // index.html의 스니펫 덕분에 window.airbridge가 미리 존재합니다.
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

  // [핵심] 숏링크 생성 함수 (비동기 API 호출)
  async function generateShortLink() {
    toast("공유 링크를 만들고 있어요...");

    // 1. 내부 웹 URL (mbti.event.qmarket.me?...)
    const targetParams = new URLSearchParams();
    if (user_id) targetParams.set("recommend_user_id", user_id);
    if (window.Quiz.state.resultKey) targetParams.set("t", window.Quiz.state.resultKey);
    const innerUrl = `${WEBVIEW_TARGET_DOMAIN}?${targetParams.toString()}`;

    // 2. 앱 스킴 (qmarket://webview?link=...)
    const appScheme = `qmarket://webview?link=${encodeURIComponent(innerUrl)}`;

    try {
      if (!window.airbridge) throw new Error("SDK 미로드");

      const result = await window.airbridge.createTrackingLink({
        channel: "in_app_referral",
        campaign: "friend_invite_2025",
        
        // 딥링크 및 Fallback 설정
        deeplink_url: appScheme,
        android_fallback_url: ANDROID_STORE_URL,
        ios_fallback_url: IOS_STORE_URL,
        fallback_url: ANDROID_STORE_URL,

        // 미리보기 설정 (OG Tag)
        og_tags: {
          title: "장보기 MBTI 테스트",
          description: "나의 장보기 성향을 앱에서 확인해보세요!",
          image: "https://mbti.event.qmarket.me/assets/img/intro/intro.webp"
        }
      });

      // 성공: 숏링크(예: https://abr.ge/abcd) 반환
      return result.shortUrl; 

    } catch (e) {
      console.error("숏링크 생성 실패, 롱링크로 대체합니다.", e);
      // 실패: 긴 링크(롱링크) 반환
      return `https://${AIRBRIDGE_APP_NAME}.airbridge.io/links` +
        `?channel=in_app_referral` +
        `&campaign=friend_invite_2025` +
        `&deeplink_url=${encodeURIComponent(appScheme)}` +
        `&android_fallback_url=${encodeURIComponent(ANDROID_STORE_URL)}` +
        `&ios_fallback_url=${encodeURIComponent(IOS_STORE_URL)}` +
        `&fallback_url=${encodeURIComponent(ANDROID_STORE_URL)}`;
    }
  }

  // [수정] 링크 복사 버튼 (이미 만든 링크가 있다면 재사용)
  async function copyLink(existingLink = null){
    // 인자로 받은 링크가 있으면 쓰고, 없으면 새로 만듦
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
        // 사용자가 공유 창을 닫은 경우 (에러 아님)
      }
    } else {
      // 2. 공유 기능이 없으면 복사 기능으로 연결 (방금 만든 링크 전달)
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
  
  // 비동기 함수 연결
  $("btnCopy")?.addEventListener("click", () => copyLink());
  $("btnShare")?.addEventListener("click", () => shareNative());
  
  $("btnRestart")?.addEventListener("click", () => restartToIntro());

  const uidNote = $("uidNote"); if(uidNote) {};
  window.Quiz.loadFromHash();
})();
