# 세션 기록 — 1차 스킬 시스템 구축 (2026-08-09)

> `Archive/As-built.md`(전체 프로젝트 진행 기록)의 최신 항목(2026-08-06, 8차 — 스탯 시스템 기획서 정합화) 이후, 이번 세션에서 진행한 작업만 정리한 기록. As-built.md 자체 갱신은 별도 Task(#43)로 남아있음 — 이 파일은 그 갱신 전 원본 세션 로그 역할.

## 한 줄 요약

기획서의 "각 전직마다 메이플스토리 5차 이전 직업 스킬 3개 제시 → 1개 선택" 1차 스킬 시스템을 처음부터 끝까지 구현: 스킬 카탈로그(10종) → 투사체 시스템 → PlayerSkillComponent → 생성 플로우 통합 UI → 키바인딩/HUD → 실플레이 QA(버그 2건 발견·수정) → 스킬별 VFX 차별화 → 스킬 사용 시 캐릭터 모션까지, 전 과정 실제 Play 세션 로그 증거로 검증.

## 작업 목록 (진행 순서)

1. **1차 스킬 카탈로그 데이터 작성** — `RootDesk/MyDesk/Skills/SkillCatalog.mlua` (`@Logic`). 5직업(검사/마법사/궁수/도적/해적) × 액티브 1 + 버프 1 = 10종. kind별 필드 스키마: `melee_single`(coef), `ranged_single`/`ranged_pierce`(coef, magic), `multi_hit`(coef, hits), `dash`(force), `buff`(duration, testableEffect, inertNote — 버프는 실제 적용 가능한 효과 1개만 살아있고 나머지는 파이프라인 부재로 로그만 남기는 비활성 설계, 기획서 그대로).
2. **투사체 모델+스크립트 구축** — `ProjectileComponent.mlua`(Body 없는 Sprite+Transform 엔티티, `OnUpdate`에서 `Translate` 이동 + 매 프레임 `script.Monster` 전수 스캔 거리 판정) + `ProjectileAttackComponent.mlua`(`AttackComponent` 확장, `CalcDamage`/`CalcCritical` 오버라이드) + `RootDesk/MyDesk/Models/Skills/Projectile.model`.
3. **PlayerSkillComponent 구현** — `RootDesk/MyDesk/Skills/PlayerSkillComponent.mlua`. `UseSkill()`이 쿨다운/MP 체크 후 kind별로 `DoMeleeSingle`/`DoRanged`/`DoMultiHit`/`DoDash`/`DoBuff`에 디스패치. 버프는 `OnUpdate`에서 만료 체크 후 `RevertBuff()`.
4. **스킬 선택 UI + 생성 플로우 연동** — `SkillCatalog:RollThreeSkills()`(Fisher-Yates 셔플 후 3개)를 캐릭터 생성 시점(`CharacterSelectStageController.CreateCharacter`)에 호출해 roster에 `skillCandidates`+`skillId` 저장. `ui/CharacterCardGroup.ui`에 `SkillButton` 추가(탭할 때마다 3후보 순환), `RequestEnterGame`/`SwapActiveCharacter`(`CharacterRosterLogic`) 양쪽 경로 모두 `skillId`를 `PlayerSkillComponent:SetSkillId()`까지 관통.
5. **스킬키 바인딩 + HUD 쿨다운 표시** — `PlayerInputBinding.mlua`에 `SetActionKey(KeyboardKey.Q, "Skill")` 추가, `PlayerSkillComponent`가 `PlayerActionEvent.ActionName=="Skill"`을 받아 `UseSkill()` 호출. `ui/PlayerHUD.ui`에 `SkillSlot` 패널(스킬명+쿨다운 초읽기/READY) 추가, `PlayerHUDController.Tick()`에서 매 프레임 갱신.
6. **실제 Play 세션으로 10개 스킬 전부 검증** — 학습용 더미(`SkillTestDummy`)를 세워 10개 스킬을 전부 실사용, HP 델타로 데미지 확인. **버그 2건 발견·수정**:
   - `DoRanged`가 투사체를 캐스터 Y+0.5(가슴 높이 연출)에 스폰했는데, 몬스터 피격판정은 몬스터 자신의 `WorldPosition`(발 기준) 기준 원형(`HitRadius=0.4`) 판정이라 같은 지면 높이의 몬스터를 항상 머리 위로 그냥 지나침 — `magicclaw`/`arrowblow` 둘 다 데미지 0. Y오프셋 제거로 수정, 재검증(60/18 데미지 확인).
   - QA 스크립트 자체의 함정: `RigidbodyComponent`가 붙은 엔티티(몬스터/플레이어 등, MapleTile 맵 전부)는 `TransformComponent.WorldPosition` 직접 대입이 물리 틱에 의해 조용히 원복됨(에러 없음) — 테스트용 더미를 옮길 때 `RigidbodyComponent:SetWorldPosition(Vector2)`(공식 원샷 텔레포트 API)를 써야 실제로 이동함. 이 때문에 재검증 1~2회차가 계속 "고쳤는데도 데미지 0"으로 보였던 원인.
   - 8개 스킬(근접/다단히트/대시/버프 5종)은 회귀 없이 정상 확인.
7. **스킬별 이펙트 차별화** — 기존엔 두 투사체 스킬(`magicclaw`/`arrowblow`)이 `Projectile.model`의 공용 placeholder "불릿" 스프라이트를 그대로 공유하고 있었음(유저 리포트: "매직 클로가 그냥 불릿처럼 보임"). `msw-search`로 실제 메이플스토리 해당 스킬의 진짜 스킬팩 RUID를 찾아 적용:
   - `magicclaw` → 투사체 스프라이트를 실제 매직 클로 이펙트 애니메이션클립으로 교체
   - `arrowblow` → 실제 애로우 블로우 화살(`ball`) 애니메이션클립으로 교체
   - `powerstrike`/`luckyseven`(근접·다단히트) → 각 스킬의 실제 히트 이펙트를 `_EffectService:PlayEffect`로 타격 위치에 재생
   - `dash` → 실제 대쉬 스킬 이펙트를 캐스터 위치에 1회 재생
   - 5개 버프(`ironbody`/`magicguard`/`focus`/`nimblebody`/`knucklebooster`) → `_ParticleService:PlayBasicParticleAttached`로 버프별 다른 `BasicParticleType`+색상 오라를 지속시간 동안 부착, 만료 시 `RemoveParticle`로 정리
   - `SkillCatalog`에 `projectileVfxRuid`/`hitVfxRuid`/`dashVfxRuid`/`auraType`+`auraColor` 필드 추가. 실 Play 세션에서 10개 전부 `PlayEffect`/`PlayBasicParticleAttached`가 0이 아닌 serial을 반환함을 로그로 확인(0 = 생성 실패).
8. **스킬 사용 시 캐릭터 모션** — 이펙트만 재생되고 캐릭터는 가만히 서 있던 문제(유저 리포트: "기존 메이플처럼 스킬 모션이 있으면 좋겠다"). Q(스킬) 액션은 `PlayerControllerComponent`의 자동 상태 전이 목록(Ctrl="Attack"만 해당)에 없어서, `StateComponent:ChangeState("ATTACK")`로는 컨트롤러가 매 틱 재평가하며 즉시 되돌려버림 — 대신 `BodyActionStateChangeEvent`(`ActionState`+`needResetAction=true`)를 직접 보내는 방식으로 우회. 공격형 4종(근접/다단히트/투사체 2종)은 `Attack` 포즈, 버프 5종은 `Heal`(자가시전 제스처) 포즈. 실 Play 세션에서 `AvatarBodyActionSelectorComponent.ActionState`를 직접 읽어 `Attack`/`Heal`로 정확히 바뀜을 확인. (현재 무기 미착용 상태라 `Attack`은 실제로는 범용 "alert" 제스처로 해석됨 — 기존 평타와 동일한 모습, 무기별 차별화된 포즈를 원하면 별도 작업 필요.)

## 새로 만들어지거나 크게 바뀐 파일

| 파일 | 역할 |
|---|---|
| `RootDesk/MyDesk/Skills/SkillCatalog.mlua` | 10종 스킬 정의 + VFX 메타데이터 (`@Logic`) |
| `RootDesk/MyDesk/Skills/PlayerSkillComponent.mlua` | 스킬 실행기 — 쿨다운/MP, kind별 디스패치, VFX, 캐릭터 모션, 버프 타이머 |
| `RootDesk/MyDesk/Skills/ProjectileComponent.mlua` / `ProjectileAttackComponent.mlua` | 범용 직선 투사체 (Body 없음, 매 프레임 거리 판정) |
| `RootDesk/MyDesk/Models/Skills/Projectile.model` | 투사체 스폰용 모델 |
| `RootDesk/MyDesk/Combat/PlayerInputBinding.mlua` | Q → "Skill" 액션 바인딩 추가 |
| `ui/CharacterCardGroup.ui` + `CharacterCardController.mlua` | 카드에 스킬 선택 버튼(3후보 순환) |
| `ui/PlayerHUD.ui` + `PlayerHUDController.mlua` | 스킬명 + 쿨다운 HUD |
| `CharacterSelectStageController.mlua` / `CharacterRosterLogic.mlua` | `skillCandidates`/`skillId`를 생성·스왑 양쪽 경로에 관통 |

## 새로 발견한 Gotcha (다음 세션 참고용)

- **인라인 동적 필드 접근 인자가 컴파일러를 혼란시키는 케이스**: 시그니처가 방금 바뀐 메서드 호출에서 `foo(data.someField)`처럼 테이블 필드 접근을 인자로 바로 넘기면, 소스도 인자 개수도 멀쩡한데 진짜 `[LEA-1102]` 빌드 에러가 `refresh`/`play`→`stop`을 여러 번 반복해도 안 사라지는 경우가 있었음. `local tmp = data.someField` 로 로컬 변수로 먼저 뽑아서 넘기면 즉시 해결. (이번 세션 발견, `LobbyStageController.SwapCharacter` → `CharacterRosterLogic.SwapActiveCharacter` 5번째 인자 추가 직후 재현)
- **`RigidbodyComponent`가 붙은 엔티티는 `TransformComponent.WorldPosition` 직접 대입이 조용히 무시된다** — 이미 `msw-combat-system`/`msw-scripting` 문서에 "OnUpdate 안에서 하지 말 것"으로 경고돼 있었지만, "테스트용으로 한 번 옮기는" 상황에서도 똑같이 적용됨을 실측으로 재확인. `RigidbodyComponent:SetWorldPosition(Vector2)`가 올바른 원샷 텔레포트 API.
- **엔진 enum은 데이터 테이블(예: 스킬 카탈로그의 Lua 테이블 리터럴)을 못 통과한다** — `BasicParticleType.Aura` 같은 enum 값을 `SkillCatalog`의 순수 데이터 테이블에 직접 못 넣고, 문자열 키(`"Aura"`)로 저장한 뒤 사용하는 쪽(`PlayerSkillComponent`)에서 `if key == "Aura" then return BasicParticleType.Aura` 식 명시적 매핑으로 되돌려야 함. `msw-scripting` §6이 이미 문서화한 "enum은 RPC 경계를 못 넘는다"는 규칙과 같은 원인(둘 다 "enum이 아닌 문자열로 우회 후 로컬에서 되돌리기" 패턴).
- **Q같은 non-controller 액션에서 스킬 모션을 재생하려면 `StateComponent:ChangeState`가 아니라 `BodyActionStateChangeEvent`를 직접 보내야 한다** — `PlayerControllerComponent`가 실제로 눌려있는 키를 매 틱 재평가해서 `ChangeState`로 억지로 넣은 상태를 즉시 되돌려버림(`msw-avatar` SKILL.md에 이미 이 함정이 문서화돼 있었음, 이번 세션에 실제로 부딪힘). `AvatarBodyActionSelectorComponent.ActionState`(바디 엔티티 위에 존재, 아바타 루트가 아님)를 직접 읽으면 실제로 적용됐는지 검증 가능.

## 남은 일

- Task #43(문서 갱신): 이 세션 기록을 `Archive/As-built.md` Quick Status + Gotchas 섹션과 `Docs/랜덤 플래닛 인게임.md` 로드맵에 정식 반영 — 아직 미완료.
- 무기 미착용 상태라 스킬 모션이 전부 "alert" 제스처로 통일되어 있음 — 직업별 무기 장착(예: 검사=한손검, 마법사=완드, 궁수=활)까지 추가하면 `Attack` 포즈가 무기별로 자동 분기되어 훨씬 메이플스러워짐(유저 확인 대기 중, 별도 작업).
