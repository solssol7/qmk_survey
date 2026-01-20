
// assets/js/main.js
(() => {
  const { $, getParam, getUTM, getOrCreateSessionId, toast, setActiveView } = window.Utils;
  const { TYPES } = window.QUIZ_DATA;

  // =========================================================================
  // [설정] 에어브릿지 및 토큰
  // =========================================================================
  const AIRBRIDGE_APP_NAME = "qmarket"; 
  const AIRBRIDGE_WEB_TOKEN = "b9570777b7534dfc85eb1bf89204f2e7"; 
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
  // 앱 웹뷰 여부 판단 (URL에 user_id가 있으면 앱으로 간주)
  const user_id = getParam("user_id"); 
  const recommend_user_id = getParam("recommend_user_id") || getParam("ref");
  const utm = getUTM();

  function setUidNote(){ const el = $("uidNote"); if(!el) return; }

  // [기능] 팝업 제어
  function showCouponPopup() {
    const popup = $("couponPopup");
    if (popup) popup.style.display = "flex";
  }
  function closeCouponPopup() {
    const popup = $("couponPopup");
    if (popup) popup.style.display = "none";
  }

  // [기능] 앱 설치 버튼 클릭 (디퍼드 딥링크 + Supabase 저장)
  async function installApp() {
    toast("앱 스토어로 이동합니다...");

    // 1. Supabase에 클릭 로그 저장 (설치 후 유저 매핑용)
    // [!] Supabase에 'app_install_clicks' 테이블이 있어야 합니다.
    if (window.supabase) {
      try {
        await window.supabase.from('app_install_clicks').insert({
          session_id: session_id,
          result_key: window.Quiz.state.resultKey,
          recommend_user_id: recommend_user_id || null,
          clicked_at: new Date().toISOString()
        });
        console.log("✅ Supabase 저장 완료");
      } catch (err) {
        console.warn("⚠️ Supabase 저장 실패:", err);
      }
    }

    // 2. 설치용 트래킹 링크 생성 (Fallback = 스토어)
    // 'store' 모드로 호출하면 앱 미설치 시 스토어로 바로 이동합니다.
    const installLink = await generateShortLink('store'); 
    
    // 3. 이동
    if (installLink) {
      location.href = installLink;
    } else {
      // 링크 생성 실패 시 기본 스토어 URL로 폴백
      const ua = navigator.userAgent.toLowerCase();
      location.href = /iphone|ipad|ipod/.test(ua) ? IOS_STORE_URL : ANDROID_STORE_URL;
    }
  }

  window.AppActions = {
    async onAnswer({ questionIndex, choiceIndex }){ },
    async onResult({ resultKey, scores }){
      const t = TYPES[resultKey];

      // [팝업 노출 조건]
      // 1. 앱 웹뷰가 아니어야 함 (!user_id)
      // 2. 추천인 파라미터가 있든 없든, 웹이면 띄웁니다. (앱 설치 유도 목적)
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

  /**
   * 숏링크 생성 함수
   * @param {string} mode - 'web': 공유용(웹페이지 이동), 'store': 설치버튼용(스토어 이동)
   */
  async function generateShortLink(mode = 'web') {
    if (!AIRBRIDGE_API_TOKEN) return null;

    // 1. 파라미터가 포함된 타겟 웹 URL (Deep Link Data)
    const targetParams = new URLSearchParams();
    if (user_id) targetParams.set("recommend_user_id", user_id); // 내가 공유하면 내 ID가 추천인
    if (window.Quiz.state.resultKey) targetParams.set("t", window.Quiz.state.resultKey);
    
    // 이 URL은 앱이 설치된 후(Deferred Deep Link) 앱이 열어볼 주소이기도 합니다.
    const innerUrl = `${WEBVIEW_TARGET_DOMAIN}?${targetParams.toString()}`;
    const appScheme = `qmarket://webview?link=${encodeURIComponent(innerUrl)}`;

    // 2. Fallback 설정 (모드에 따라 다름)
    // - web: 공유받은 사람은 먼저 웹페이지에서 결과를 봐야 함 -> innerUrl
    // - store: "앱 설치하기" 버튼을 누른 사람은 바로 스토어로 가야 함 -> STORE_URL
    const fallbackUrl = (mode === 'web') ? innerUrl : null; 
    
    // android/ios 설정
    const fallbackPaths = {
      option: {
        // mode가 'web'이면 웹으로, 'store'면 스토어로 이동
        android: (mode === 'web') ? innerUrl : ANDROID_STORE_URL,
        ios: (mode === 'web') ? innerUrl : IOS_STORE_URL,
        desktop: innerUrl 
      }
    };

    // 3. API 요청
    const requestPayload = {
      channel: "in_app_referral",
      campaignParams: {
        campaign: "friend_invite_2025",
        ad_group: "referral",
        ad_creative: (mode === 'store') ? "install_button" : "invitation" // 구분
      },
      deeplinkUrl: appScheme, // 앱이 설치되어 있거나, 설치 후 실행 시 이 스킴이 전달됨
      deeplinkOption: { showAlertForInitialDeeplinkingIssue: true },
      fallbackPaths: fallbackPaths,
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
      
      // JSON 키: shortUrl (소문자 주의)
      const shortLink = resJson.data?.trackingLink?.shortUrl;
      if (shortLink) return shortLink; 
      
      throw new Error("링크 생성 실패");

    } catch (e) {
      console.error("링크 생성 실패:", e);
      // 실패 시 수동 조합
      return `https://${AIRBRIDGE_APP_NAME}.airbridge.io/links?channel=in_app_referral&deeplink_url=${encodeURIComponent(appScheme)}&fallback_url=${encodeURIComponent(innerUrl)}`;
    }
  }

  async function copyLink(){
    const link = await generateShortLink('web'); // 공유용 -> 웹으로 이동
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast("링크가 복사되었습니다.");
    } catch {
      prompt("아래 링크를 복사하세요!", link);
    }
  }

  async function shareNative() {
    const link = await generateShortLink('web'); // 공유용 -> 웹으로 이동
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
      copyLink();
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

  // 팝업 이벤트
  $("btnInstallApp")?.addEventListener("click", () => installApp());
  $("btnClosePopup")?.addEventListener("click", () => closeCouponPopup());

  const uidNote = $("uidNote"); if(uidNote) {};
  
  window.Quiz.loadFromHash();
  
  // 결과 화면 진입 시 팝업 체크
  if (window.Quiz.state.view === "viewResult" || location.hash.includes("result")) {
      // 앱이 아닐 때만(!user_id) 팝업 노출
      if (!user_id) {
          setTimeout(() => showCouponPopup(), 1500);
      }
  }
})();
