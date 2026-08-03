const { UIBuilder } = require("../scripts/msw_ui_builder.cjs");

const BORDER = { r: 0.29, g: 0.18, b: 0.09, a: 1 };
const PARCHMENT = { r: 0.94, g: 0.85, b: 0.63, a: 0.99 };
const GOLD = { r: 0.75, g: 0.55, b: 0.13, a: 1 };
const TITLE_TEXT = "#3b2410";
const BODY_TEXT = "#3b2410";
const NEUTRAL_ROW = { r: 0.86, g: 0.75, b: 0.52, a: 1 };
const CLOSE_BG = { r: 0.45, g: 0.12, b: 0.1, a: 1 };
const CLOSE_TEXT = "#f0dfb4";
const ENTER_BG = { r: 0.85, g: 0.65, b: 0.18, a: 1 };

const b = new UIBuilder("SquadFormationGroup");

b.addComponent("/", "script.SquadFormationController");

b.sprite("Card", { anchor: "middle-center", pos: [0, 0], rect_size: [640, 760], color: BORDER, sprite_type: 1, raycast: true });
b.sprite("Card/Inner", { anchor: "middle-center", pos: [0, 0], rect_size: [612, 732], color: PARCHMENT, sprite_type: 1 });

// Corner accents (match CharacterCardGroup.ui's technique)
b.sprite("Card/CornerTL", { anchor: "top-left", pos: [6, -6], rect_size: [16, 16], color: GOLD, pivot: [0, 1] });
b.sprite("Card/CornerTR", { anchor: "top-right", pos: [-6, -6], rect_size: [16, 16], color: GOLD, pivot: [1, 1] });
b.sprite("Card/CornerBL", { anchor: "bottom-left", pos: [6, 6], rect_size: [16, 16], color: GOLD, pivot: [0, 0] });
b.sprite("Card/CornerBR", { anchor: "bottom-right", pos: [-6, 6], rect_size: [16, 16], color: GOLD, pivot: [1, 0] });

b.text("Card/Inner/Title", "공격대 편성", {
  anchor: "top-center", pos: [0, -30], rect_size: [400, 44], size: 28, color: TITLE_TEXT, bold: true,
});
b.sprite("Card/Inner/TitleRule", { anchor: "top-center", pos: [0, -78], rect_size: [340, 3], color: GOLD });

b.text("Card/Inner/PlayableText", "플레이어블: -", {
  anchor: "top-center", pos: [0, -110], rect_size: [560, 34], size: 22, color: BODY_TEXT,
});

b.text("Card/Inner/LinkSectionLabel", "링크 캐릭터 선택 (최대 2명, 15레벨 이상만 패시브 적용)", {
  anchor: "top-center", pos: [0, -150], rect_size: [560, 28], size: 16, color: BODY_TEXT,
});

b.text("Card/Inner/Link1Text", "링크 1: 비어있음", {
  anchor: "top-center", pos: [0, -182], rect_size: [560, 30], size: 19, color: "#5c3a12",
});
b.text("Card/Inner/Link2Text", "링크 2: 비어있음", {
  anchor: "top-center", pos: [0, -212], rect_size: [560, 30], size: 19, color: "#5c3a12",
});

const rowStartY = -252;
const rowHeight = 56;
const rowGap = 8;
for (let i = 1; i <= 5; i++) {
  const y = rowStartY - (i - 1) * (rowHeight + rowGap);
  b.button(`Card/Inner/Candidate${i}`, "-", {
    anchor: "top-center", pos: [0, y], rect_size: [560, rowHeight], font_size: 20,
    color: BODY_TEXT, bg_color: NEUTRAL_ROW,
  });
}

b.button("Card/BtnEnter", "입장", {
  anchor: "bottom-center", pos: [0, 40], rect_size: [280, 80], font_size: 32,
  color: TITLE_TEXT, bg_color: ENTER_BG,
});
b.button("Card/BtnClose", "X", {
  anchor: "top-right", pos: [-24, -24], rect_size: [56, 56], font_size: 24,
  color: CLOSE_TEXT, bg_color: CLOSE_BG,
});

b.write("ui/SquadFormationGroup.ui", {
  bind: {
    mlua: "RootDesk/MyDesk/CharacterSelect/SquadFormationController.mlua",
    props: {
      playableText: "Card/Inner/PlayableText",
      link1Text: "Card/Inner/Link1Text",
      link2Text: "Card/Inner/Link2Text",
      candidate1: "Card/Inner/Candidate1",
      candidate2: "Card/Inner/Candidate2",
      candidate3: "Card/Inner/Candidate3",
      candidate4: "Card/Inner/Candidate4",
      candidate5: "Card/Inner/Candidate5",
      btnEnter: "Card/BtnEnter",
      btnBack: "Card/BtnClose",
    },
  },
});

console.log("root id:", b.getId("/"));
console.log("OK");
