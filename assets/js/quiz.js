// assets/js/quiz.js
window.Quiz = (() => {
  const { $, setActiveView } = window.Utils;
  const { QUESTIONS, TYPES } = window.QUIZ_DATA;

  const state = {
    idx: 0,
    answers: [],
    score: { A:{P:0,I:0}, B:{V:0,Q:0}, C:{B:0,E:0} },
    resultKey: null,
  };

  function reset(){
    state.idx = 0;
    state.answers = [];
    state.score = { A:{P:0,I:0}, B:{V:0,Q:0}, C:{B:0,E:0} };
    state.resultKey = null;
  }

  function applyScore(obj){
    for(const axis of Object.keys(obj)){
      state.score[axis][obj[axis]] += 1;
    }
  }
  function unapplyScore(obj){
    for(const axis of Object.keys(obj)){
      state.score[axis][obj[axis]] = Math.max(0, state.score[axis][obj[axis]] - 1);
    }
  }

  function computeKey(){
    const A = (state.score.A.P >= state.score.A.I) ? "P" : "I";
    const B = (state.score.B.V >= state.score.B.Q) ? "V" : "Q";
    const C = (state.score.C.B >= state.score.C.E) ? "B" : "E";
    return A+B+C;
  }

  function setProgress(){
    const total = QUESTIONS.length;
    const label = $("progressLabel");
    if(label) label.textContent = `${state.idx+1} / ${total}`;

    const bar = $("barFill");
    if(bar) bar.style.width = `${((state.idx+1)/total)*100}%`;
  }

  function renderQuestion(){
    const q = QUESTIONS[state.idx];

    $("qTitle").textContent = q.title;
    $("qHint").textContent = q.hint || "";

    setProgress();

    // 이미지 토글
    const imgEl = $("qImage");
    if(imgEl){
      if(q.image){
        imgEl.src = q.image;
        imgEl.style.display = "block";
      }else{
        imgEl.style.display = "none";
      }
    }

    // 선택지 렌더링 (스타일 개선)
    const root = $("choices");
    root.innerHTML = "";

    q.choices.forEach((choice, i) => {
      const btn = document.createElement("button");
      btn.className = "choicePill";
      btn.type = "button";

      // [핵심 변경] innerHTML을 사용하여 줄바꿈 및 폰트 크기 조정
      // main: 크게 / sub: 작게, 회색, 줄바꿈
      const mainHtml = `<span style="font-size:17px; font-weight:700; display:block; margin-bottom:4px;">${choice.main}</span>`;
      const subHtml = choice.sub 
        ? `<span style="font-size:13px; font-weight:400; color:#868e96; display:block;">${choice.sub}</span>` 
        : "";

      btn.innerHTML = mainHtml + subHtml;

      btn.addEventListener("click", () => choose(i));
      root.appendChild(btn);
    });

    // prev 버튼 상태
    const prevBtn = $("btnPrev");
    if(prevBtn){
      prevBtn.disabled = (state.idx === 0);
      prevBtn.style.opacity = (state.idx === 0) ? .4 : 1;
    }
  }

  async function choose(choiceIndex){
    const q = QUESTIONS[state.idx];
    const chosen = q.choices[choiceIndex];

    state.answers[state.idx] = choiceIndex;
    applyScore(chosen.score);

    if(window.AppActions?.onAnswer){
      await window.AppActions.onAnswer({ questionIndex: state.idx, choiceIndex });
    }

    if(state.idx < QUESTIONS.length - 1){
      state.idx += 1;
      renderQuestion();
    }else{
      await finish();
    }
  }

  function prev(){
    if(state.idx === 0) return;
    state.idx -= 1;

    const q = QUESTIONS[state.idx];
    const ai = state.answers[state.idx];
    if(ai !== undefined){
      unapplyScore(q.choices[ai].score);
      state.answers[state.idx] = undefined;
    }
    renderQuestion();
  }

  // 칩 생성 헬퍼
  function chip(text){
    const s = document.createElement("span");
    s.className = "chip";
    s.textContent = text;
    return s;
  }

  function renderResult(key){
    const t = TYPES[key] || TYPES["PVE"];

    const badge = $("resultBadge");
    if(badge) badge.textContent = `MY TYPE`;

    $("resultTitle").textContent = t.name;
    $("resultOne").textContent = t.one;

    const codeEl = $("resultCodeText");
    if(codeEl) codeEl.textContent = key;

    const rateEl = document.getElementById("resultRateText");
    if(rateEl){
      const rate = (typeof t.rate === "number") ? t.rate.toFixed(2) : "--";
      rateEl.innerHTML = `전체 참여자 중 <b>${rate}%</b>가 같은 유형입니다.`;
    }

    const rImg = document.getElementById("resultImage");
    if(rImg){
      if(t.image){
        rImg.src = t.image;
        rImg.style.display = "block";
      }else{
        rImg.style.display = "none";
      }
    }

    const share = $("shareUrl");
    if(share) share.value = location.href;

    // Chips
    const strength = $("strengthChips"); if(strength){ strength.innerHTML = ""; t.strengths.forEach(x => strength.appendChild(chip(x))); }
    const risk = $("riskChips"); if(risk){ risk.innerHTML = ""; t.risks.forEach(x => risk.appendChild(chip(x))); }
    const sec = $("sectionChips"); if(sec){ sec.innerHTML = ""; t.sections.forEach(x => sec.appendChild(chip(x))); }
    const basket = $("basketChips"); if(basket){ basket.innerHTML = ""; t.basket.forEach(x => basket.appendChild(chip(x))); }

    // 궁합 렌더링
    if(t.partners) {
      renderPartner("partnerBest", t.partners.best);
      renderPartner("partnerWorst", t.partners.worst);
    }
  }

  function renderPartner(elementId, partnerKey) {
    const el = document.getElementById(elementId);
    if(!el) return;
    
    const pData = TYPES[partnerKey];
    if(!pData) return;

    el.innerHTML = `
      <div style="background:#fff; border-radius:12px; padding:10px; text-align:center; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
        <div style="width:60px; height:60px; border-radius:50%; overflow:hidden; margin-bottom:8px; background:#f1f3f5;">
          <img src="${pData.image}" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'">
        </div>
        <div style="font-size:13px; font-weight:700; color:#333; line-height:1.2; word-break:keep-all;">${pData.name}</div>
        <div style="font-size:11px; color:#adb5bd; margin-top:4px;">${partnerKey}</div>
      </div>
    `;
  }

  async function finish(){
    const key = computeKey();
    state.resultKey = key;

    const url = new URL(location.href);
    url.hash = `t=${encodeURIComponent(key)}`;
    history.replaceState(null, "", url.toString());

    renderResult(key);

    if(window.AppActions?.onResult){
      await window.AppActions.onResult({ resultKey: key, scores: state.score });
    }

    setActiveView("viewResult");
  }

  function loadFromHash(){
    const h = (location.hash || "").replace(/^#/, "");
    if(!h) return false;

    const p = new URLSearchParams(h);
    const key = p.get("t");
    if(key && TYPES[key]){
      reset();
      state.resultKey = key;

      const url = new URL(location.href);
      url.hash = `t=${encodeURIComponent(key)}`;
      history.replaceState(null, "", url.toString());

      renderResult(key);
      setActiveView("viewResult");

      if(window.AppActions?.onSharedResult){
        window.AppActions.onSharedResult({ resultKey: key });
      }
      return true;
    }
    return false;
  }

  function showIntro(){ 
    reset(); 
    const bar = $("barFill"); if(bar) bar.style.width = "0%";
    setActiveView("viewIntro"); 
  }

  function startQuiz(){
    reset();
    setActiveView("viewQuiz");
    renderQuestion();
  }

  return { state, startQuiz, showIntro, prev, renderResult, loadFromHash };
})();
