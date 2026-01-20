// assets/js/main.js
(() => {
  const { $, getParam, getUTM, getOrCreateSessionId, toast, setActiveView } = window.Utils;
  const { TYPES } = window.QUIZ_DATA;

  // =========================================================================
  // [설정] 에어브릿지 토큰 설정
  // =========================================================================
  const AIRBRIDGE_APP_NAME = "qmarket"; 
  
  // 1. Web Token (SDK 초기화용 - 기존 값 유지)
  const AIRBRIDGE_WEB_TOKEN = "b9570777b7534dfc85eb1bf89204f2e7"; 

  // 2. API Token (터미널에서 성공한 그 토큰!)
  const AIRBRIDGE_API_TOKEN = "954c0d057d074ab48f30b0755403dca1"; 

  const WEBVIEW_TARGET_DOMAIN = "https://mbti.event.qmarket.me"; 
  const ANDROID_STORE_URL = "https://play.google.com/store/apps/details?id=com.aswemake.qmarket";
  const IOS_STORE_URL = "https://apps.apple.com/kr/app/%ED%81%90%EB%A7%88%EC%BC%93-%EC%9A%B0%EB%A6%AC-%EB%8F%99%EB%84%A4-%EC%8A%88%ED%8D%BC%EB%A7%88%ED%8A%B8-%EC%8B%9D%ED%92%88-%ED%95%A0%EC%9D%B8-%EB%8B%B9%EC%9D%BC-%EB%B0%B0%EB%8B%AC/id1514329713";
  // =========================================================================

  // [SDK 초기화]
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

  function setUidNote(){ const el = $("uidNote"); if(!el) return; }

  window.AppActions = {
    async onAnswer({ questionIndex, choiceIndex }){ },
    async onResult({ resultKey, scores }){
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

  // [수정 완료] 숏링크 생성 함수
  async function generateShortLink() {
    toast("링크 생성 중...");

    // 1. 토큰 체크
    if (!AIRBRIDGE_API_TOKEN) return null;

    // 2. URL 구성
    const targetParams = new URLSearchParams();
    if (user_id) targetParams.set("recommend_user_id", user_id);
    if (window.Quiz.state.resultKey) targetParams.set("t", window.Quiz.state.resultKey);
    const innerUrl = `${WEBVIEW_TARGET_DOMAIN}?${targetParams.toString()}`;
    const appScheme = `qmarket://webview?link=${encodeURIComponent(innerUrl)}`;

    // 3. 요청 데이터 (터미널 성공값 기준)
    const requestPayload = {
      channel: "in_app_referral",
      campaignParams: {
        campaign: "friend_invite_2025",
        ad_group: "referral",
        ad_creative: "invitation"
      },
      // [수정] 도메인 강제 설정 제거 (기본값 ab.qmk.me 사용)
      deeplinkUrl: appScheme,
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
    };

    try {
      // 로컬/배포 환경 분기
      const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      const apiUrl = isLocal ? 'https://api.airbridge.io/v1/tracking-links' : '/api/airbridge/links';

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${AIRBRIDGE_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      const resJson = await response.json();
      
      // 🔴 [핵심 수정] shortURL -> shortUrl (소문자 'rl'로 수정)
      // 터미널 응답: "shortUrl": "https://ab.qmk.me/rfcr1l"
      const shortLink = resJson.data?.trackingLink?.shortUrl;

      if (shortLink) {
        console.log("✅ 생성된 링크:", shortLink);
        return shortLink;
      } 
      
      throw new Error("링크 필드(shortUrl) 없음");

    } catch (e) {
      console.error("링크 생성 실패:", e);
      // 실패 시 기본 딥링크 반환
      return `https://${AIRBRIDGE_APP_NAME}.airbridge.io/links?channel=in_app_referral&deeplink_url=${encodeURIComponent(appScheme)}`;
    }
  }

  async function copyLink(existingLink = null){
    const link = existingLink || await generateShortLink(); 
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      toast("링크가 복사되었습니다.");
    } catch {
      prompt("링크 복사:", link);
    }
  }

  async function shareNative() {
    const link = await generateShortLink(); 
    if (!link) return;

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
