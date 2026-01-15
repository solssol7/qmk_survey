// assets/js/data.js
window.QUIZ_DATA = (() => {
  const QUESTIONS = [
    {
      title: "마트에 들어서는 순간 나는?",
      hint: "쇼핑의 시작",
      image: "./assets/img/questions/q01.png",
      choices: [
        { main: "구매 목록부터 확인한다", sub: "(살 것만 딱 정해서 옴)", score: { A: "P" } },
        { main: "일단 한 바퀴 둘러본다", sub: "(뭐가 있나 구경부터)", score: { A: "I" } }
      ]
    },
    {
      title: "물건을 고를 때 내 눈이 먼저 가는 곳은?",
      hint: "선택의 기준",
      image: "./assets/img/questions/q02.png",
      choices: [
        { main: "노란색 가격표/할인율", sub: "(저렴한 게 최고)", score: { B: "V" } },
        { main: "성분표/원산지/브랜드", sub: "(품질이 중요해)", score: { B: "Q" } }
      ]
    },
    {
      title: "집에 샴푸가 떨어져 간다. 나는?",
      hint: "구매 규모",
      image: "./assets/img/questions/q03.png",
      choices: [
        { main: "초대용량 리필을 산다", sub: "(쟁여두면 든든하니까)", score: { C: "B" } },
        { main: "딱 필요한 본품만 산다", sub: "(보관할 곳도 없어)", score: { C: "E" } }
      ]
    },
    {
      title: "계산하려는데 '지금만 반값' 방송이 나온다면?",
      hint: "특가 vs 계획",
      image: "./assets/img/questions/q04.png",
      choices: [
        { main: "일단 카트에 담고 본다", sub: "(이 가격은 못 참지)", score: { A: "I", B: "V" } },
        { main: "내 목록에 없으면 안 산다", sub: "(충동구매 사절)", score: { A: "P", B: "Q" } }
      ]
    },
    {
      title: "새로 나온 신상 과자가 보인다!",
      hint: "호기심 vs 안정",
      image: "./assets/img/questions/q05.png",
      choices: [
        { main: "맛이 궁금하니 사본다", sub: "(새로운 건 못 참아)", score: { A: "I", B: "Q" } },
        { main: "먹던 걸로 산다", sub: "(아는 맛이 무서운 법)", score: { A: "P", B: "V" } }
      ]
    },
    {
      title: "계산대 앞, 내 카트 속 물건들은?",
      hint: "장바구니 상태",
      image: "./assets/img/questions/q06.png",
      choices: [
        { main: "딱 살려던 것만 들어있다", sub: "(계획대로 완벽)", score: { A: "P" } },
        { main: "어느새 이것저것 담겨있다", sub: "(어? 이게 언제 들어갔지)", score: { A: "I" } }
      ]
    },
    {
      title: "라면을 사려는데 묶음 할인을 한다면?",
      hint: "대용량 vs 실속",
      image: "./assets/img/questions/q07.png",
      choices: [
        { main: "당연히 묶음(멀티팩) 구매", sub: "(개당 가격이 싸니까)", score: { C: "B", B: "V" } },
        { main: "그냥 낱개로 몇 개만", sub: "(다 먹지도 못해)", score: { C: "E", B: "Q" } }
      ]
    },
    {
      title: "자주 가는 단골 마트, 나는?",
      hint: "쇼핑 스타일",
      image: "./assets/img/questions/q08.png",
      choices: [
        { main: "늘 사던 것 위주로 빨리 산다", sub: "(루틴이 정해져 있음)", score: { A: "P", B: "Q" } },
        { main: "오늘은 뭐가 좋은지 탐색한다", sub: "(보물찾기 하듯이)", score: { A: "I", B: "V" } }
      ]
    },
    {
      title: "쇼핑을 마치고 뿌듯한 순간은?",
      hint: "만족의 기준",
      image: "./assets/img/questions/q09.png",
      choices: [
        { main: "할인 잔뜩 받아서 싸게 샀을 때", sub: "(돈 벌었다!)", score: { B: "V" } },
        { main: "정말 맛있는 걸 건졌을 때", sub: "(행복해!)", score: { B: "Q" } }
      ]
    }
  ];

  const TYPES = {
    "PVE": {
      name: "장보기 PM(프로젝트 매니저)",
      one: "필요한 것만 정확히, 빠르게 사는 타입이에요.",
      rate: 20.44,
      image: "./assets/img/results/PVE.png",
      strengths: ["살 것만 딱 사는 칼같은 결단력", "낭비 없는 알뜰한 소비", "정리정돈의 달인"],
      risks: ["가끔은 충동구매의 재미도 필요해요", "너무 효율만 따지면 피곤할 수도?"],
      weights: { promo: 1, popular: 3, new: 0, history: 3 },
      sections: ["재구매 TOP", "필수템 요약", "구매이력 기반"],
      basket: ["우유/두부", "계란", "양파/대파", "간편식", "냉동 기본", "생활용품"],
      partners: { best: "PVB", worst: "IQE" } // [추가] 궁합 데이터
    },
    "PVB": {
      name: "냉정한 단가 헌터",
      one: "대용량 특가를 보면 가슴이 뛰는 타입이에요.",
      rate: 14.08,
      image: "./assets/img/results/PVB.png",
      strengths: ["누구보다 싸게 사는 능력", "쟁여두기 스킬 만렙", "살림꾼 면모"],
      risks: ["집이 창고가 될 수 있어요", "너무 많이 사서 유통기한 주의!"],
      weights: { promo: 3, popular: 2, new: 0, history: 1 },
      sections: ["오늘 특가", "묶음/대용량", "가성비 인기"],
      basket: ["대용량 곡물", "냉동 대용량", "오일", "박스 라면", "세제", "대용량 소스"],
      partners: { best: "PVE", worst: "IQB" }
    },
    "PQE": {
      name: "깐깐한 미식가",
      one: "양보다는 질! 검증된 것만 사는 타입이에요.",
      rate: 11.52,
      image: "./assets/img/results/PQE.png",
      strengths: ["실패 없는 장보기", "높은 삶의 질 추구", "건강한 식단"],
      risks: ["장바구니 물가는 좀 비쌀지도?", "새로운 도전은 꺼리는 편"],
      weights: { promo: 1, popular: 3, new: 1, history: 2 },
      sections: ["인기·재구매", "검증 신상", "취향 기반"],
      basket: ["유제품", "정육(소량)", "제철 과일", "요거트/치즈", "소스", "프리미엄 냉동"],
      partners: { best: "PQB", worst: "IVB" }
    },
    "PQB": {
      name: "브랜드 충성 VIP",
      one: "내가 좋아하는 브랜드는 대용량으로 쟁여요.",
      rate: 9.96,
      image: "./assets/img/results/PQB.png",
      strengths: ["확고한 취향", "좋은 물건을 알아보는 안목", "손님 대접의 달인"],
      risks: ["통장이 텅장 될 수 있음", "취향이 아니면 절대 안 삼"],
      weights: { promo: 1, popular: 2, new: 2, history: 3 },
      sections: ["내 취향", "취향 신상", "인기 프리미엄"],
      basket: ["오일/버터", "정육 대용량", "좋은 소스", "커피/차", "치즈", "프리미엄 냉동"],
      partners: { best: "PQE", worst: "IVE" }
    },
    "IVE": {
      name: "세일코너 참새",
      one: "방앗간(세일코너)은 절대 그냥 못 지나쳐요.",
      rate: 16.33,
      image: "./assets/img/results/IVE.png",
      strengths: ["득템의 기쁨을 즐김", "새로운 행사 상품 발굴", "장보기가 즐거움"],
      risks: ["안 사도 될 걸 살 때가 많음", "냉장고가 꽉 찰 수 있음"],
      weights: { promo: 3, popular: 2, new: 2, history: 0 },
      sections: ["오늘 행사", "급상승", "신상품"],
      basket: ["행사 간식", "행사 소스", "할인 과일", "냉동 간편식", "즉석식", "한 번쯤"],
      partners: { best: "IVB", worst: "PQB" }
    },
    "IVB": {
      name: "1+1에 인생 건다",
      one: "묶음 할인만 보면 눈이 돌아가는 타입이에요.",
      rate: 8.71,
      image: "./assets/img/results/IVB.png",
      strengths: ["가성비 끝판왕", "주변에 나눠주는 넉넉함", "행사 정보통"],
      risks: ["다 먹느라 고생할 수 있음", "지출 관리가 필요해요"],
      weights: { promo: 3, popular: 2, new: 1, history: 0 },
      sections: ["1+1/묶음", "인기 행사", "가성비 TOP"],
      basket: ["투팩 딜", "대용량 음료", "박스 간식", "냉동 대용량", "면류", "대용량 생활"],
      partners: { best: "IVE", worst: "PQE" }
    },
    "IQE": {
      name: "신상 탐험가",
      one: "새로 나온 건 일단 먹어봐야 직성이 풀려요.",
      rate: 10.27,
      image: "./assets/img/results/IQE.png",
      strengths: ["얼리어답터", "트렌드에 민감함", "도전적인 식생활"],
      risks: ["맛없으면 돈 아까움", "기본템 사는 걸 까먹음"],
      weights: { promo: 1, popular: 2, new: 3, history: 1 },
      sections: ["신상품", "신상 인기", "취향 신상"],
      basket: ["신상 간식", "신상 소스", "수입/특이템", "음료", "간편식", "디저트"],
      partners: { best: "IQB", worst: "PVE" }
    },
    "IQB": {
      name: "우리집 요리사",
      one: "좋은 재료 욕심에 장바구니가 터져나가요.",
      rate: 8.69,
      image: "./assets/img/results/IQB.png",
      strengths: ["요리 실력이 좋음", "다양한 식재료 활용", "풍성한 식탁"],
      risks: ["재료비가 많이 듦", "요리하느라 지칠 수 있음"],
      weights: { promo: 1, popular: 3, new: 2, history: 1 },
      sections: ["인기 요리재료", "대용량 재료", "신상 소스/재료"],
      basket: ["정육/해산물", "야채 박스", "마늘/양파", "양념", "면/밥류", "디저트(보상)"],
      partners: { best: "IQE", worst: "PVB" }
    }
  };

  return { QUESTIONS, TYPES };
})();
