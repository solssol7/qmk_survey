// assets/js/utils.js
window.Utils = (() => {
    const $ = (id) => document.getElementById(id);
  
    function getParam(name){
      const p = new URLSearchParams(location.search);
      return p.get(name);
    }
  
    function getUTM(){
      const p = new URLSearchParams(location.search);
      const keys = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content"];
      const out = {};
      keys.forEach(k => { const v = p.get(k); if(v) out[k] = v; });
      return out;
    }
  
    function getOrCreateSessionId(){
      const k = "grocery_quiz_session_id";
      let v = localStorage.getItem(k);
      if(!v){
        v = (crypto.randomUUID ? crypto.randomUUID() : `sid_${Date.now()}_${Math.random().toString(16).slice(2)}`);
        localStorage.setItem(k, v);
      }
      return v;
    }
  
    function toast(msg){
      const el = $("toast");
      if(!el) return;
      el.textContent = msg;
      el.classList.add("is-show");
      setTimeout(()=> el.classList.remove("is-show"), 1000);
    }
  
    function setActiveView(viewId){
      const views = document.querySelectorAll(".view");
      views.forEach(v => v.classList.remove("is-active"));
      const target = document.getElementById(viewId);
      if(target) target.classList.add("is-active");
    }
  
    return { $, getParam, getUTM, getOrCreateSessionId, toast, setActiveView };
  })();
  