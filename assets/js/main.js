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

  async function generateShortLink() {
  toast("공유 링크를 만들고 있어요...");
  
  // [디버그] 로그 그룹 시작
  console.group("🔗 [Airbridge] 숏링크 생성 디버깅");

  // 1. 내부 웹 URL 구성
  const targetParams = new URLSearchParams();
  if (user_id) targetParams.set("recommend_user_id", user_id);
  if (window.Quiz.state.resultKey) targetParams.set("t", window.Quiz.state.resultKey);
  const innerUrl = `${WEBVIEW_TARGET_DOMAIN}?${targetParams.toString()}`;

  // 2. 앱 스킴 구성
  const appScheme = `qmarket://webview?link=${encodeURIComponent(innerUrl)}`;
  
  console.log("1️⃣ 타겟 URL:", innerUrl);
  console.log("2️⃣ 딥링크 Scheme:", appScheme);

  try {
    // API 주소 결정 (로컬/배포 환경 분기)
    // 주의: 로컬에서 테스트 시 Vercel Proxy가 없으면 CORS 에러가 날 수 있습니다.
    const apiUrl = '/api/airbridge/links'; 
    console.log("3️⃣ 요청 보낼 API 주소:", apiUrl);

    const requestBody = {
      channel: "in_app_referral",
      campaignParams: {
        campaign: "friend_invite_2025",
        ad_group: "referral",
        ad_creative: "invitation"
      },
      isReengagement: false,
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

    console.log("4️⃣ 요청 바디(Payload):", JSON.stringify(requestBody, null, 2));

    // API 호출
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": AIRBRIDGE_WEB_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    console.log("5️⃣ HTTP 상태 코드:", response.status, response.statusText);

    const responseText = await response.text();
    console.log("6️⃣ 응답 본문(Raw):", responseText);

    if (!response.ok) {
      throw new Error(`API 응답 에러: ${response.status} - ${responseText}`);
    }

    const resJson = JSON.parse(responseText);
    const shortLink = resJson.data?.trackingLink?.shortURL;
    
    console.log("7️⃣ 추출된 숏링크:", shortLink);

    if (!shortLink) {
      throw new Error("응답 JSON에 shortURL 필드가 없습니다.");
    }

    console.log("✅ 숏링크 생성 성공!");
    console.groupEnd();
    return shortLink; 

  } catch (e) {
    console.error("❌ 숏링크 생성 실패 원인:", e);
    console.groupEnd();
    
    // 실패 시 롱링크 반환 (기존 로직)
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
