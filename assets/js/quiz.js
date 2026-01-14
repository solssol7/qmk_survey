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
  
    function renderQuestion(){
      const q = QUESTIONS[state.idx];
  
      $("qTitle").textContent = q.title;
      $("qHint").textContent = q.hint;
  
      const total = QUESTIONS.length;
      $("progressLabel").textContent = `질문 ${state.idx+1} / ${total}`;
      $("barFill").style.width = `${((state.idx+1)/total)*100}%`;
  
      const root = $("choices");
      root.innerHTML = "";
  
      q.choices.forEach((choice, i) => {
        const btn = document.createElement("button");
        btn.className = "choice";
        btn.innerHTML = `
          <div class="choice__main">${choice.main}</div>
          <div class="choice__sub">${choice.sub}</div>
        `;
        btn.addEventListener("click", () => choose(i));
        root.appendChild(btn);
      });
  
      $("btnPrev").disabled = (state.idx === 0);
      $("btnPrev").style.opacity = (state.idx === 0) ? .6 : 1;
    }
  
    async function choose(choiceIndex){
      const q = QUESTIONS[state.idx];
      const chosen = q.choices[choiceIndex];
  
      state.answers[state.idx] = choiceIndex;
      applyScore(chosen.score);
  
      await window.AppActions.onAnswer({ questionIndex: state.idx, choiceIndex });
  
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
  
      $("resultBadge").textContent = `결과 · ${key}`;
      $("resultTitle").textContent = t.name;
      $("resultOne").textContent = t.one;
      $("shareUrl").value = location.href;
  
      const strength = $("strengthChips"); strength.innerHTML = "";
      t.strengths.forEach(x => strength.appendChild(chip(x)));
  
      const risk = $("riskChips"); risk.innerHTML = "";
      t.risks.forEach(x => risk.appendChild(chip(x)));
  
      const sec = $("sectionChips"); sec.innerHTML = "";
      t.sections.forEach(x => sec.appendChild(chip(x)));
  
      const basket = $("basketChips"); basket.innerHTML = "";
      t.basket.forEach(x => basket.appendChild(chip(x)));
  
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
      await window.AppActions.onResult({ resultKey: key, scores: state.score });
  
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
        window.AppActions.onSharedResult({ resultKey: key });
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
      loadFromHash,
    };
  })();
  