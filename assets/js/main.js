// assets/js/main.js
(() => {
  const { $, getParam, getUTM, getOrCreateSessionId, toast, setActiveView } = window.Utils;
  const { TYPES } = window.QUIZ_DATA;

  // =========================================================================
  // [설정] 에어브릿지 토큰 설정
  // =========================================================================
  const AIRBRIDGE_APP_NAME = "qmarket"; 
  
  // 1. Web Token (SDK용 - 그대로 두세요)
  const AIRBRIDGE_WEB_TOKEN = "b9570777b7534dfc85eb1bf89204f2e7"; 

  // 2. API Token (API 호출용)
  // [!] 대시보드에서 복사한 "API Token" 값을 여기에 넣으세요.
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
            session_id, user_id, result_key: resultKey, result_name: t?.name, scores, weights: t?.weights, utm, referrer: document.referrer
          });
        }
      },
      async onSharedResult({ resultKey }){ }
    };
  
// [수정] 디버깅을 위해 응답 전체를 로그로 출력하는 버전
  async function generateShortLink() {
    toast("공유 링크를 만들고 있어요...");

    if (!AIRBRIDGE_API_TOKEN || AIRBRIDGE_API_TOKEN.includes("여기에")) {
      console.error("❌ API Token이 설정되지 않았습니다.");
      return null;
    }

    const targetParams = new URLSearchParams();
    if (user_id) targetParams.set("recommend_user_id", user_id);
    if (window.Quiz.state.resultKey) targetParams.set("t", window.Quiz.state.resultKey);
    const innerUrl = `${WEBVIEW_TARGET_DOMAIN}?${targetParams.toString()}`;

    const appScheme = `qmarket://webview?link=${encodeURIComponent(innerUrl)}`;

    try {
      // 로컬/배포 환경 구분
      const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      const apiUrl = isLocal ? 'https://api.airbridge.io/v1/tracking-links' : '/api/airbridge/links';

      console.log(`[Link] 요청 시작: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${AIRBRIDGE_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          channel: "in_app_referral",
          campaignParams: {
            campaign: "friend_invite_2025",
            ad_group: "referral",
            ad_creative: "invitation"
          },
          // isReengagement 제거됨 (성공)
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
      
      // 🔍 [디버깅] 서버가 보낸 전체 응답을 콘솔에 출력
      console.log("[Link] 응답 전체:", JSON.stringify(resJson, null, 2));

      // 데이터 구조 확인
      const shortLink = resJson.data?.trackingLink?.shortURL;

      if (!shortLink) {
        // 혹시 shortURL 대신 click 링크만 있는지 확인
        if (resJson.data?.trackingLink?.link?.click) {
            console.warn("[Link] 숏링크 대신 롱링크(click)를 사용합니다.");
            return resJson.data.trackingLink.link.click;
        }
        throw new Error("응답에 shortURL이 없습니다.");
      }

      console.log("[Link] 생성 성공:", shortLink);
      return shortLink; 

    } catch (e) {
      console.error("[Link] 실패, 롱링크 대체:", e);
      // 실패 시 폴백 롱링크 반환
      return `https://${AIRBRIDGE_APP_NAME}.airbridge.io/links` +
        `?channel=in_app_referral` +
        `&campaign=friend_invite_2025` +
        `&deeplink_url=${encodeURIComponent(appScheme)}` +
        `&android_fallback_url=${encodeURIComponent(ANDROID_STORE_URL)}` +
        `&ios_fallback_url=${encodeURIComponent(IOS_STORE_URL)}` +
        `&fallback_url=${encodeURIComponent(ANDROID_STORE_URL)}`;
    }
  }
    async function copyLink(existingLink = null){
      const link = existingLink || await generateShortLink(); 
      if (!link) return;
  
      try {
        await navigator.clipboard.writeText(link);
        toast("짧은 공유 링크가 복사되었어요!");
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
  
    const uidNote = $("uidNote"); if(uidNote) {};
    window.Quiz.loadFromHash();
  })();
