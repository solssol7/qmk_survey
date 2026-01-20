// assets/js/main.js
(() => {
  const { $, getParam, getUTM, getOrCreateSessionId, toast, setActiveView } = window.Utils;
  const { TYPES } = window.QUIZ_DATA;

  // =========================================================================
  // [설정] 에어브릿지 정보
  // =========================================================================
  const AIRBRIDGE_APP_NAME = "qmarket"; 
  const AIRBRIDGE_WEB_TOKEN = "aa31841e91b24c5395aa6569c7e9eced"; // 실제 서비스 시에는 서버 환경변수 사용 권장

  // 타겟 및 Fallback URL
  const WEBVIEW_TARGET_DOMAIN = "https://mbti.event.qmarket.me"; 
  const ANDROID_STORE_URL = "https://play.google.com/store/apps/details?id=com.aswemake.qmarket";
  const IOS_STORE_URL = "https://apps.apple.com/kr/app/%ED%81%90%EB%A7%88%EC%BC%93-%EC%9A%B0%EB%A6%AC-%EB%8F%99%EB%84%A4-%EC%8A%88%ED%8D%BC%EB%A7%88%ED%8A%B8-%EC%8B%9D%ED%92%88-%ED%95%A0%EC%9D%B8-%EB%8B%B9%EC%9D%BC-%EB%B0%B0%EB%8B%AC/id1514329713";
  // =========================================================================

  // [초기화] 에어브릿지 SDK (이벤트 수집용으로 유지)
  if (window.airbridge) {
    window.airbridge.init({
      app: AIRBRIDGE_APP_NAME,
      webToken: AIRBRIDGE_WEB_TOKEN,
      useMbox: false
    });
  }

  const session_id = getOrCreateSessionId();
  const user_id = getParam("user_id"); 
  const recommend_user_id = getParam("recommend_user_id") || getParam("ref");
  const utm = getUTM();

  function setUidNote(){ /* ...기존 코드 유지... */ }

  window.AppActions = {
    // ...기존 AppActions 코드 유지...
    async onAnswer({ questionIndex, choiceIndex }){ },
    async onResult({ resultKey, scores }){
        // ...기존 로직...
        const t = TYPES[resultKey];
        if (!user_id && !recommend_user_id) return;
        if(window.Analytics?.enabled()){
            await window.Analytics.saveResult({
                session_id, user_id, result_key: resultKey, result_name: t?.name, scores, weights: t?.weights, utm, referrer: document.referrer
            });
        }
    },
    async onSharedResult({ resultKey }){ }
  };

  // [핵심 변경] REST API를 사용한 숏링크 생성 함수
  async function generateShortLink() {
    toast("공유 링크를 만들고 있어요...");

    // 1. 내부 웹 URL 구성
    const targetParams = new URLSearchParams();
    if (user_id) targetParams.set("recommend_user_id", user_id);
    if (window.Quiz.state.resultKey) targetParams.set("t", window.Quiz.state.resultKey);
    const innerUrl = `${WEBVIEW_TARGET_DOMAIN}?${targetParams.toString()}`;

    // 2. 딥링크 스킴 구성
    const appScheme = `qmarket://webview?link=${encodeURIComponent(innerUrl)}`;

    try {
      // API 호출 (vercel.json의 rewrites를 통해 우회)
      // 만약 로컬 테스트 등 프록시가 없는 환경이라면 'https://api.airbridge.io/v1/tracking-links' 직접 사용
      const apiUrl = location.hostname === 'localhost' || location.hostname === '127.0.0.1' 
                     ? 'https://api.airbridge.io/v1/tracking-links' 
                     : '/api/airbridge/links';

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": AIRBRIDGE_WEB_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          channel: "in_app_referral",
          campaignParams: {
            campaign: "friend_invite_2025",
            ad_group: "referral",
            ad_creative: "invitation",
            sub_id: user_id // 필요한 경우 유저 ID를 sub_id 등으로 활용
          },
          isReengagement: false,
          deeplinkUrl: appScheme, // SDK(snake_case)와 달리 API는 camelCase 사용
          deeplinkOption: {
            showAlertForInitialDeeplinkingIssue: true
          },
          fallbackPaths: {
            option: {
              android: ANDROID_STORE_URL,
              ios: IOS_STORE_URL
            }
          },
          ogTag: {
            title: "장보기 MBTI 테스트",
            description: "나의 장보기 성향을 앱에서 확인해보세요!",
            image: "https://mbti.event.qmarket.me/assets/img/intro/intro.webp"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      const resJson = await response.json();
      
      // 응답 구조: { data: { trackingLink: { shortURL: "..." } } }
      const shortLink = resJson.data?.trackingLink?.shortURL;

      if (!shortLink) throw new Error("숏링크 응답 없음");

      return shortLink; 

    } catch (e) {
      console.error("숏링크 생성 실패, 롱링크로 대체합니다.", e);
      
      // 실패 시 롱링크 반환 (파라미터 SDK 형식으로 매핑)
      return `https://${AIRBRIDGE_APP_NAME}.airbridge.io/links` +
        `?channel=in_app_referral` +
        `&campaign=friend_invite_2025` +
        `&deeplink_url=${encodeURIComponent(appScheme)}` +
        `&android_fallback_url=${encodeURIComponent(ANDROID_STORE_URL)}` +
        `&ios_fallback_url=${encodeURIComponent(IOS_STORE_URL)}` +
        `&fallback_url=${encodeURIComponent(ANDROID_STORE_URL)}`;
    }
  }

  // [링크 복사]
  async function copyLink(existingLink = null){
    const link = existingLink || await generateShortLink(); 
    try {
      await navigator.clipboard.writeText(link);
      toast("공유 링크가 복사되었어요!");
    } catch {
      prompt("아래 링크를 복사하세요!", link);
    }
  }

  // [공유하기]
  async function shareNative() {
    const link = await generateShortLink(); 
    if (navigator.share) {
      try {
        await navigator.share({
          title: '장보기 MBTI 테스트',
          text: '나의 장보기 성향을 앱에서 확인해보세요!',
          url: link,
        });
      } catch (err) { }
    } else {
      copyLink(link);
    }
  }

  // [이벤트 리스너 연결]
  $("btnStart")?.addEventListener("click", () => window.Quiz.startQuiz());
  $("btnDemo")?.addEventListener("click", () => {
    window.Quiz.renderResult("PVE");
    setActiveView("viewResult");
  });
  $("btnPrev")?.addEventListener("click", () => window.Quiz.prev());
  
  // 버튼에 비동기 함수 연결
  $("btnCopy")?.addEventListener("click", () => copyLink());
  $("btnShare")?.addEventListener("click", () => shareNative());
  
  $("btnRestart")?.addEventListener("click", () => restartToIntro());

  const uidNote = $("uidNote"); if(uidNote) {};
  window.Quiz.loadFromHash();
})();
