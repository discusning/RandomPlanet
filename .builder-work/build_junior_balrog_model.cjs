// 주니어 발록 보스 모델을 FieldMiniBoss 템플릿에서 만든다(빌더 사용). 클립 RUID는 mob/9303010.img 팩 기준.
const path = require("path");
const crypto = require("crypto");
const { ModelBuilder, actionSheet } = require(path.resolve(".claude/skills/msw-general/scripts/model/msw_model_builder.cjs"));

const CLIP = {
  stand: "a572cb54ec3b4ab2ba90739e3e309ced",
  move: "9d69405541014ab6be12d6ae9d1f3ae9",
  attack: "9192d81b6999484583c32eca91019ee1",   // attack1
  hit: "b44e7a84470a40bf9ea6cb01a0b402fa",      // hit1
  die: "4f1effd719f74189a862d6782044ed08",      // die1
};

const b = ModelBuilder.read(path.resolve("RootDesk/MyDesk/Models/Monsters/FieldMiniBoss.model"));
b.renameModel("JuniorBalrog", crypto.randomUUID());
b.value("MOD.Core.SpriteRendererComponent", "SpriteRUID", CLIP.stand, "string");
b.value("MOD.Core.StateAnimationComponent", "ActionSheet", actionSheet({
  stand: CLIP.stand,
  move: CLIP.move,
  attack: CLIP.attack,
  hit: CLIP.hit,
  die: CLIP.die,
  jump: CLIP.stand,
}), "action_sheet");
b.write(path.resolve("RootDesk/MyDesk/Models/Monsters/JuniorBalrog.model"));
console.log("wrote JuniorBalrog.model");
