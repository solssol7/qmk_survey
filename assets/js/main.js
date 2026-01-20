  // assets/js/main.js
(() => {
  const { $, getParam, getUTM, getOrCreateSessionId, toast, setActiveView } = window.Utils;
  const { TYPES } = window.QUIZ_DATA;

  // =========================================================================
  // [설정] 에어브릿지 토큰 및 URL
  // =========================================================================
  const AIRBRIDGE_APP_NAME = "qmarket"; 
  const AIRBRIDGE_WEB_TOKEN = "b9570777b7534dfc85eb1bf89204f2e7"; 
  const AIRBRIDGE_API_TOKEN = "954c0d057d074ab48f30b0755403dca1"; 

  const WEBVIEW_TARGET_DOMAIN = "https://mbti.event.qmarket.me"; 
  const ANDROID_STORE_URL = "https://play.google.com/store/apps/details?id=com.aswemake.qmarket";
  const IOS_STORE_URL = "https://apps.apple.com/kr/app/%ED%81%90%EB%A7%88%EC%BC%93-%EC%9A%B0%EB%A6%AC-%EB%8F%99%EB%84%A4-%EC%8A%88%ED%8D%BC%EB%A7%88%ED%8A%B8-%EC%8B%9D%ED%92%88-%ED%95%A0%EC%9D%B8-%EB%8B%B9%EC%9D%BC-%EB%B0%B0%EB%8B%AC/id1514329713";
  // =========================================================================

  if (window.airbridge) {
    window.airbridge.init({
      app: AIRBRIDGE_APP_NAME,
      webToken: AIRBRIDGE_WEB_TOKEN,
      useMbox: false
    });
  }

  const session_id = getOrCreateSessionId();
  // 🔑 앱에서 들어오면 URL 뒤에 user_id가 있음 (이걸로 앱인지 구분)
  const user_id = getParam("user_id"); 
  const recommend_user_id = getParam("recommend_user_id") || getParam("ref");
  const utm = getUTM();

  function setUidNote(){ const el = $("uidNote"); if(!el) return; }

  // [기능] 팝업 열기/닫기
  function showCouponPopup() {
    const popup = $("couponPopup");
    if (popup) popup.style.display = "flex";
  }
  function closeCouponPopup() {
    const popup = $("couponPopup");
    if (popup) popup.style.display = "none";
  }

  // [기능] 앱 설치 버튼 클릭
  function installApp() {
    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = ua.indexOf("android") > -1;
    const isIOS = /iphone|ipad|ipod/.test(ua);

    if (isAndroid) {
      location.href = ANDROID_STORE_URL;
    } else if (isIOS) {
      location.href = IOS_STORE_URL;
    } else {
      location.href = ANDROID_STORE_URL;
    }
  }

  window.AppActions = {
    async onAnswer({ questionIndex, choiceIndex }){ },
    async onResult({ resultKey, scores }){
      const t = TYPES[resultKey];
      
      // [수정] user_id가 없을 때만(앱이 아닐 때만) 팝업 띄우기
      if (!user_id) {
        setTimeout(() => {
          showCouponPopup();
        }, 1500);
      }

      if (!user_id && !recommend_user_id) return; 
      if(window.Analytics?.enabled()){
        await window.Analytics.saveResult({
          session_id, user_id, result_key: resultKey, result_name: t?.name, scores, weights: t?.weights, utm, referrer: document.referrer
        });
      }
    },
    async onSharedResult({ resultKey }){ }
  };

  async function generateShortLink() {
    toast("공유 링크를 만들고 있어요...");

    if (!AIRBRIDGE_API_TOKEN) return null;

    // 1. 파라미터가 포함된 타겟 URL 생성
    const targetParams = new URLSearchParams();
    if (user_id) targetParams.set("recommend_user_id", user_id);
    if (window.Quiz.state.resultKey) targetParams.set("t", window.Quiz.state.resultKey);
    
    // [중요] 파라미터가 살아있는 전체 웹 URL
    const innerUrl = `${WEBVIEW_TARGET_DOMAIN}?${targetParams.toString()}`;
    
    // 2. 앱 딥링크 스킴
    const appScheme = `qmarket://webview?link=${encodeURIComponent(innerUrl)}`;

    // 3. API 요청 Payload
    const requestPayload = {
      channel: "in_app_referral",
      campaignParams: {
        campaign: "friend_invite_2025",
        ad_group: "referral",
        ad_creative: "invitation"
      },
      deeplinkUrl: appScheme,
      deeplinkOption: {
        showAlertForInitialDeeplinkingIssue: true
      },
      fallbackPaths: {
        option: {
          android: ANDROID_STORE_URL,
          ios: IOS_STORE_URL,
          desktop: innerUrl 
        }
      },
      ogTag: {
        title: "장보기 MBTI 테스트",
        description: "나의 장보기 성향을 앱에서 확인해보세요!",
        image: "https://mbti.event.qmarket.me/assets/img/intro/intro.webp"
      }
    };

    try {
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

      if (!response.ok) throw new Error(`API 오류: ${response.status}`);

      const resJson = await response.json();
      const shortLink = resJson.data?.trackingLink?.shortUrl;

      if (shortLink) return shortLink; 
      
      throw new Error("링크 생성 실패");

    } catch (e) {
      console.error("링크 생성 실패:", e);
      return `https://${AIRBRIDGE_APP_NAME}.airbridge.io/links?channel=in_app_referral&deeplink_url=${encodeURIComponent(appScheme)}&fallback_url=${encodeURIComponent(innerUrl)}`;
    }
  }

  async function copyLink(existingLink = null){
    const link = existingLink || await generateShortLink(); 
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      toast("링크가 복사되었습니다.");
    } catch {
      prompt("아래 링크를 복사하세요!", link);
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

  // [이벤트 연결] 팝업 버튼
  $("btnInstallApp")?.addEventListener("click", () => installApp());
  $("btnClosePopup")?.addEventListener("click", () => closeCouponPopup());

  const uidNote = $("uidNote"); if(uidNote) {};
  
  // 공유받은 링크로 들어와서 바로 결과페이지인 경우 체크
  window.Quiz.loadFromHash();
  
  // 만약 바로 결과화면(viewResult)이 떴다면 팝업 노출 트리거
  if (window.Quiz.state.view === "viewResult" || location.hash.includes("result")) {
      // [수정] user_id가 없을 때만(앱이 아닐 때만) 팝업 노출
      if (!user_id) {
          setTimeout(() => showCouponPopup(), 1500);
      }
  }
})();
