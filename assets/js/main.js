// assets/js/main.js
(() => {
  const { $, getParam, getUTM, getOrCreateSessionId, toast, setActiveView } = window.Utils;
  const { TYPES } = window.QUIZ_DATA;

  // =========================================================================
  // [설정] 에어브릿지 토큰 설정 (중요: 두 토큰은 서로 다릅니다!)
  // =========================================================================
  const AIRBRIDGE_APP_NAME = "qmarket"; 
  
  // 1. Web Token: SDK 초기화 및 이벤트 수집용 (기존 값 유지)
  const AIRBRIDGE_WEB_TOKEN = "b9570777b7534dfc85eb1bf89204f2e7"; 

  // 2. API Token: 트래킹 링크 생성용 (새로 복사해서 채워주세요!)
  // [!] 대시보드 > Settings > Tokens > API Token 값을 아래 따옴표 안에 넣으세요.
  const AIRBRIDGE_API_TOKEN = "954c0d057d074ab48f30b0755403dca1"; 

  // 타겟 도메인 및 스토어 URL
  const WEBVIEW_TARGET_DOMAIN = "https://mbti.event.qmarket.me"; 
  const ANDROID_STORE_URL = "https://play.google.com/store/apps/details?id=com.aswemake.qmarket";
  const IOS_STORE_URL = "https://apps.apple.com/kr/app/%ED%81%90%EB%A7%88%EC%BC%93-%EC%9A%B0%EB%A6%AC-%EB%8F%99%EB%84%A4-%EC%8A%88%ED%8D%BC%EB%A7%88%ED%8A%B8-%EC%8B%9D%ED%92%88-%ED%95%A0%EC%9D%B8-%EB%8B%B9%EC%9D%BC-%EB%B0%B0%EB%8B%AC/id1514329713";
  // =========================================================================

  // [초기화] 에어브릿지 SDK 실행 (Web Token 사용)
  if (window.airbridge) {
    window.airbridge.init({
      app: AIRBRIDGE_APP_NAME,
      webToken: AIRBRIDGE_WEB_TOKEN, // 여기는 Web Token 사용
      useMbox: false
    });
  } else {
    console.error("에어브릿지 SDK가 로드되지 않았습니다.");
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

  // [핵심] 숏링크 생성 함수 (API Token 사용)
  async function generateShortLink() {
    toast("공유 링크를 만들고 있어요...");

    // 1. 내부 웹 URL 구성
    const targetParams = new URLSearchParams();
    if (user_id) targetParams.set("recommend_user_id", user_id);
    if (window.Quiz.state.resultKey) targetParams.set("t", window.Quiz.state.resultKey);
    const innerUrl = `${WEBVIEW_TARGET_DOMAIN}?${targetParams.toString()}`;

    // 2. 앱 스킴 (딥링크) 구성
    const appScheme = `qmarket://webview?link=${encodeURIComponent(innerUrl)}`;

    try {
      // API 호출 주소 (vercel.json에 설정된 프록시 경로 사용 권장)
      // 로컬 테스트(localhost)인 경우 직접 호출하도록 분기 처리
      const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      const apiUrl = isLocal ? 'https://api.airbridge.io/v1/tracking-links' : '/api/airbridge/links';

      console.log(`[Link] API 호출 시작: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": AIRBRIDGE_API_TOKEN, // [!] 여기는 API Token 사용
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
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
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Link] API 에러(${response.status}):`, errorText);
        throw new Error(`API 오류: ${response.status}`);
      }

      const resJson = await response.json();
      const shortLink = resJson.data?.trackingLink?.shortURL;

      if (!shortLink) throw new Error("숏링크 응답 데이터 없음");

      console.log("[Link] 생성 성공:", shortLink);
      return shortLink; 

    } catch (e) {
      console.error("[Link] 생성 실패, 롱링크로 대체합니다.", e);
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

  // [링크 복사]
  async function copyLink(existingLink = null){
    const link = existingLink || await generateShortLink(); 
    
    try {
      await navigator.clipboard.writeText(link);
      toast("짧은 공유 링크가 복사되었어요!");
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
      } catch (err) {
        // 공유 취소됨
      }
    } else {
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
