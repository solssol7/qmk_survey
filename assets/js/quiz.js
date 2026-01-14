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
    const fallbackEl = $("qImageFallback");
    if(imgEl && fallbackEl){
      if(q.image){
        imgEl.src = q.image;
        imgEl.style.display = "block";
        fallbackEl.style.display = "none";
      }else{
        imgEl.removeAttribute("src");
        imgEl.style.display = "none";
        fallbackEl.style.display = "block";
      }
    }

    // 선택지(소BTI 캡슐)
    const root = $("choices");
    root.innerHTML = "";

    q.choices.forEach((choice, i) => {
      const btn = document.createElement("button");
      btn.className = "choicePill";
      btn.type = "button";

      // 줄바꿈 지원(가독성 좋게)
      const text = `${choice.main}\n${choice.sub || ""}`.trim();
      btn.textContent = text;

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

  function chip(text){
    const s = document.createElement("span");
    s.className = "chip";
    s.textContent = text;
    return s;
  }

  function renderResult(key){
    const t = TYPES[key] || TYPES["PVE"];

    const badge = $("resultBadge");
    if(badge) badge.textContent = `RESULT · ${key}`;

    $("resultTitle").textContent = t.name;
    $("resultOne").textContent = t.one;

    // 코드 표시(있으면)
    const codeEl = $("resultCodeText");
    if(codeEl) codeEl.textContent = key;

    // 고정 퍼센트 표시(있으면)
    const rateEl = document.getElementById("resultRateText");
    if(rateEl){
      const rate = (typeof t.rate === "number") ? t.rate.toFixed(2) : "--";
      rateEl.innerHTML = `전체 참여자 중 <b>${rate}%</b>가 같은 유형입니다.`;
    }

    // 결과 이미지 토글(세로형)
    const rImg = document.getElementById("resultImage");
    const rFallback = document.getElementById("resultImageFallback");
    if(rImg && rFallback){
      if(t.image){
        rImg.src = t.image;
        rImg.style.display = "block";
        rFallback.style.display = "none";
      }else{
        rImg.removeAttribute("src");
        rImg.style.display = "none";
        rFallback.style.display = "block";
      }
    }

    // share URL
    const share = $("shareUrl");
    if(share) share.value = location.href;

    // chips
    const strength = $("strengthChips"); strength.innerHTML = "";
    t.strengths.forEach(x => strength.appendChild(chip(x)));

    const risk = $("riskChips"); risk.innerHTML = "";
    t.risks.forEach(x => risk.appendChild(chip(x)));

    const sec = $("sectionChips"); sec.innerHTML = "";
    t.sections.forEach(x => sec.appendChild(chip(x)));

    const basket = $("basketChips"); basket.innerHTML = "";
    t.basket.forEach(x => basket.appendChild(chip(x)));

    // weights
    const wg = $("weightGrid"); wg.innerHTML = "";
    [["promo","특가/행사"],["popular","인기/재구매"],["new","신상품"],["history","구매이력"]].forEach(([k,l])=>{
      const d = document.createElement("div");
      d.className = "w";
      d.innerHTML = `<span>${l}</span><strong>${t.weights[k]}</strong>`;
      wg.appendChild(d);
    });
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

  function showIntro(){ setActiveView("viewIntro"); }

  function startQuiz(){
    reset();
    setActiveView("viewQuiz");
    renderQuestion();
  }

  function explain(){
    const A = state.score.A, B = state.score.B, C = state.score.C;
    alert(
      `[점수]\n` +
      `계획:${A.P} / 즉흥:${A.I}\n` +
      `실속:${B.V} / 퀄리티:${B.Q}\n` +
      `대용량:${C.B} / 간편:${C.E}\n\n` +
      `동점이면 왼쪽(계획/실속/대용량) 우선\n` +
      `결과 키: ${computeKey()}`
    );
  }

  return {
    state,
    startQuiz,
    showIntro,
    prev,
    explain,
    renderResult,
    loadFromHash
  };
})();
