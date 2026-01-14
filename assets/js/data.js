// assets/js/data.js
window.QUIZ_DATA = (() => {
  // 9문항 고정 + 0패딩 파일명(q01~q09)
  const QUESTIONS = [
    {
      title: "마트 들어가자마자 나는",
      hint: "첫 동선이 추천 성향을 가른다",
      image: "./assets/img/questions/q01.png",
      choices: [
        { main: "필요한 것부터 찾는다", sub: "(오늘은 이것만)", score: { A: "P" } },
        { main: "행사부터 본다", sub: "(좋은 건 놓치면 손해)", score: { A: "I" } }
      ]
    },
    {
      title: "고르는 기준은?",
      hint: "실속 vs 만족도",
      image: "./assets/img/questions/q02.png",
      choices: [
        { main: "가격/할인/단가", sub: "(가성비가 중요)", score: { B: "V" } },
        { main: "맛/품질/재구매", sub: "(실패하면 더 손해)", score: { B: "Q" } }
      ]
    },
    {
      title: "장바구니 양은?",
      hint: "대용량 적성",
      image: "./assets/img/questions/q03.png",
      choices: [
        { main: "대용량도 OK", sub: "(소분/보관 가능)", score: { C: "B" } },
        { main: "필요한 만큼만", sub: "(적당히가 최고)", score: { C: "E" } }
      ]
    },
    {
      title: "추천이 뜨면 더 끌리는 건",
      hint: "행사 vs 인기",
      image: "./assets/img/questions/q04.png",
      choices: [
        { main: "오늘 특가/행사", sub: "(지금 사야 이득)", score: { A: "I", B: "V" } },
        { main: "인기/재구매 TOP", sub: "(많이 사는 데는 이유)", score: { A: "P", B: "Q" } }
      ]
    },
    {
      title: "늘 사던 것 vs 신상품",
      hint: "신상 선호",
      image: "./assets/img/questions/q05.png",
      choices: [
        { main: "신상품도 한 번", sub: "(새로운 것도 좋아)", score: { A: "I", B: "Q" } },
        { main: "늘 사던 걸로", sub: "(검증된 게 편함)", score: { A: "P", B: "V" } }
      ]
    },
    {
      title: "결제 직전 장바구니는",
      hint: "정돈 vs 즉흥",
      image: "./assets/img/questions/q06.png",
      choices: [
        { main: "정돈돼 있다", sub: "(안정적)", score: { A: "P" } },
        { main: "생각보다 많다", sub: "(다 필요함)", score: { A: "I" } }
      ]
    },
    {
      title: "묶음딜이 나오면?",
      hint: "대용량/실속",
      image: "./assets/img/questions/q07.png",
      choices: [
        { main: "묶음으로 산다", sub: "(이득이면 쟁여둠)", score: { C: "B", B: "V" } },
        { main: "단품으로 산다", sub: "(남기면 아까움)", score: { C: "E", B: "Q" } }
      ]
    },
    {
      title: "‘자주 산 것 기반’ 추천은",
      hint: "구매이력 레버",
      image: "./assets/img/questions/q08.png",
      choices: [
        { main: "편하고 좋다", sub: "(내 취향 잘 알지)", score: { A: "P", B: "Q" } },
        { main: "좀 뻔하다", sub: "(새로운 것도)", score: { A: "I", B: "V" } }
      ]
    },
    {
      title: "오늘 장보기 성공 기준은?",
      hint: "최종",
      image: "./assets/img/questions/q09.png",
      choices: [
        { main: "구성/금액 만족", sub: "(잘 샀다)", score: { B: "V" } },
        { main: "맛/만족도 만족", sub: "(중요)", score: { B: "Q" } }
      ]
    }
  ];

  // 8타입: 결과 이미지(세로) + 고정 퍼센트(rate) 포함
  const TYPES = {
    "PVE": {
      name: "장보기 PM(프로젝트 매니저)",
      one: "필요한 것만 정확히, 빠르게 사는 타입이에요.",
      rate: 20.44,
      image: "./assets/img/results/PVE.png",
      strengths: ["인기/재구매 추천이 잘 맞음", "불필요한 구매가 적음", "정리된 화면을 좋아함"],
      risks: ["행사 노출이 과하면 흔들림", "너무 효율만 보면 재미가 줄어듦"],
      weights: { promo: 1, popular: 3, new: 0, history: 3 },
      sections: ["재구매 TOP", "필수템 요약", "구매이력 기반"],
      basket: ["우유/두부", "계란", "양파/대파", "간편식", "냉동 기본", "생활용품"]
    },
    "PVB": {
      name: "냉정한 단가 헌터",
      one: "특가/대용량에서 이득을 잘 보는 타입이에요.",
      rate: 14.08,
      image: "./assets/img/results/PVB.png",
      strengths: ["특가/행사 반응 큼", "묶음딜 전환 잘 됨", "객단가 상승 기여"],
      risks: ["보관이 힘들 수 있음", "딜이 없으면 흥미↓"],
      weights: { promo: 3, popular: 2, new: 0, history: 1 },
      sections: ["오늘 특가", "묶음/대용량", "가성비 인기"],
      basket: ["대용량 곡물", "냉동 대용량", "오일", "박스 라면", "세제", "대용량 소스"]
    },
    "PQE": {
      name: "맛잘알 성분감별사",
      one: "검증된 인기템 위주로 만족도를 챙기는 타입이에요.",
      rate: 11.52,
      image: "./assets/img/results/PQE.png",
      strengths: ["인기/재구매 신뢰↑", "품질 중심 화면 선호", "재방문 유도"],
      risks: ["신상 과다 노출 피로", "가격 충격 가능"],
      weights: { promo: 1, popular: 3, new: 1, history: 2 },
      sections: ["인기·재구매", "검증 신상", "취향 기반"],
      basket: ["유제품", "정육(소량)", "제철 과일", "요거트/치즈", "소스", "프리미엄 냉동"]
    },
    "PQB": {
      name: "브랜드 충성 VIP",
      one: "내가 좋아하는 걸 ‘확실하게’ 사는 타입이에요.",
      rate: 9.96,
      image: "./assets/img/results/PQB.png",
      strengths: ["구매이력 기반 반응↑", "취향 신상 업셀 유리", "프리미엄 객단가↑"],
      risks: ["취향 밖 노출 반감", "결제 직전 가격 민감"],
      weights: { promo: 1, popular: 2, new: 2, history: 3 },
      sections: ["내 취향", "취향 신상", "인기 프리미엄"],
      basket: ["오일/버터", "정육 대용량", "좋은 소스", "커피/차", "치즈", "프리미엄 냉동"]
    },
    "IVE": {
      name: "행사 코너 자석 인간",
      one: "행사만 보면 마음이 움직이는 타입이에요.",
      rate: 16.33,
      image: "./assets/img/results/IVE.png",
      strengths: ["행사 체류↑", "급상승 반응↑", "탐색 UI 클릭↑"],
      risks: ["후회성 구매 가능", "행사 없으면 흥미↓"],
      weights: { promo: 3, popular: 2, new: 2, history: 0 },
      sections: ["오늘 행사", "급상승", "신상품"],
      basket: ["행사 간식", "행사 소스", "할인 과일", "냉동 간편식", "즉석식", "한 번쯤"]
    },
    "IVB": {
      name: "1+1에 인생 건다",
      one: "묶음딜에 강한 ‘합리적 충동’ 타입이에요.",
      rate: 8.71,
      image: "./assets/img/results/IVB.png",
      strengths: ["묶음딜 전환↑", "담기율↑", "딜 소재 적합"],
      risks: ["과적/과소비", "딜 편향"],
      weights: { promo: 3, popular: 2, new: 1, history: 0 },
      sections: ["1+1/묶음", "인기 행사", "가성비 TOP"],
      basket: ["투팩 딜", "대용량 음료", "박스 간식", "냉동 대용량", "면류", "대용량 생활"]
    },
    "IQE": {
      name: "신상 시식단",
      one: "새로 나온 것부터 보는 타입이에요.",
      rate: 10.27,
      image: "./assets/img/results/IQE.png",
      strengths: ["신상품 CTR↑", "트렌딩+신상 강함", "리뷰 유도 적합"],
      risks: ["신상 실패 누적 이탈", "이력만 보면 답답"],
      weights: { promo: 1, popular: 2, new: 3, history: 1 },
      sections: ["신상품", "신상 인기", "취향 신상"],
      basket: ["신상 간식", "신상 소스", "수입/특이템", "음료", "간편식", "디저트"]
    },
    "IQB": {
      name: "오늘의 미식 대장정",
      one: "요리 생각에 장바구니가 커지는 타입이에요.",
      rate: 8.69,
      image: "./assets/img/results/IQB.png",
      strengths: ["요리 재료 확장", "인기+신상 재료 추천", "대용량 업셀 유리"],
      risks: ["요리도 시작됨", "재료 과구매"],
      weights: { promo: 1, popular: 3, new: 2, history: 1 },
      sections: ["인기 요리재료", "대용량 재료", "신상 소스/재료"],
      basket: ["정육/해산물", "야채 박스", "마늘/양파", "양념", "면/밥류", "디저트(보상)"]
    }
  };

  return { QUESTIONS, TYPES };
})();
