# 리롤 용사 — Phase 1 상세 계획

> 🔖 **AI note — resuming?** 새 세션에서 이 문서를 이어서 작업한다면, 먼저 `msw-planning` 스킬을 로드하고 resume 플로우(`Archive/As-built.md` + GDD 확인 → 상태 재구성)를 따르세요 — 이 문서에서 바로 구현으로 들어가지 마세요.
> Parent doc: `랜덤 플래닛 인게임.md` (원본 콘테스트 기획서 전체는 별도 `랜덤 플래닛 전체 기획서.md`, 아직 미병합) · 이 Phase의 목표: **"움직이고, 때리고, 죽는다"** — MapleTile 맵 위에서 플레이어가 이동·점프·수동 평타로 몬스터 1종을 처치할 수 있는 최소 재생 가능 상태 확보
> **Skills to reference (이 Phase)**: `msw-general`(platform.md, platform-maple.md, model.md, monster.md, builder-protocol.md, entity.md), `msw-scripting`(verify-checklist.md), `msw-defaultplayer`, `msw-combat-system`, `msw-search`, `msw-sprite-ruid`

## Status checklist
> 상태: ⬜ 미착수 · 🟡 구현됨(미검증) · ✅ 검증완료
> 모든 항목은 ⬜에서 시작. 구현 즉시 🟡로 갱신, 검증 통과 후에만 ✅.

- ⬜ [Task 1] MapleTile 맵 준비  ⚠️ 유저 작업 필요: Maker에서 맵 생성 + TileMapMode 전환 + Foothold 배치 (AI가 직접 전환 불가)
- ✅ [Task 2] 플레이어 이동/점프 (2026-07-31 — 전투 맵이 없어 기존 `Lobby` MapleTile 맵에서 검증. 실제 키보드 입력으로 좌우 이동 + 점프(공중 y 상승 + `IsOnGround=false`) 확인)
- ✅ [Task 3] 수동 평타 (공격키 → 근접 히트 판정) (2026-07-31 — 상세 내용은 Task 3 섹션 참고)
- ✅ [Task 4] 기본 몬스터 1종 배치 및 사망 처리 (2026-07-31 — `Lobby`에 임시 배치해 검증 후 제거. 실제 전투 맵이 생기면 `TestSlime.model`을 그 맵에 재배치만 하면 됨 — Task 1 완료 후 후속 작업으로 남김)
- ✅ [Task 5] 플레이어/몬스터 SpriteRUID 적용 (2026-07-31 — 몬스터: msw-search로 클래식 슬라임 `stand` 애니메이션클립 적용. 플레이어는 기존 아바타 코스튬 시스템으로 이미 충족)

## Task detail

### [Task 1] MapleTile 맵 준비
- **Goal**: 프로젝트에 `TileMapMode = 0`(MapleTile)인 맵이 존재하고, 플레이어가 서고 이동할 수 있는 최소한의 `FootholdComponent` 발판 지형이 배치된 상태.
- **Required systems·components**: `MapComponent.TileMapMode = 0`, `FootholdComponent` 지형.
- **Data**: 없음.
- **UI**: 없음.
- **Done (verification) criteria**: `MapBuilder.read().getTileMapMode()`로 `0` 확인 + Foothold 존재 확인. **AI가 read로 검증 가능**하지만, 맵 생성/타입 전환/Foothold 페인팅 자체는 Maker Hierarchy에서 유저가 직접 수행해야 함(우클릭 → Switch TileMap, 타일 페인팅).
- **Dependencies**: 없음 — 최초 작업.
- **Skills to reference (predicted)**: `msw-general` → `references/platform.md` §4(TileMapMode↔Body), `references/tile.md`(발판/타일 페인팅은 Maker UI 안내).

### [Task 2] 플레이어 이동/점프
- **Goal**: 방향키로 좌우 이동, 점프키로 점프. Foothold 위에서 정상적으로 서고, 낙하 시 자연스럽게 착지.
- **Required systems·components**: 플레이어 엔티티에 `RigidbodyComponent` + Foothold 상호작용, 이동/점프 로직(`MovementComponent` 또는 커스텀 `@Component`).
- **Data**: 이동 속도·점프력 초기값(하드코딩, MVP 단계에서는 데이터셋 불필요).
- **UI**: 없음.
- **Done (verification) criteria**: Play 모드 진입 → `keyboard_input`으로 좌우 이동·점프 실행 → 화면/좌표 변화 확인 + `logs(category="runtime")`에 `[LEA-3004]` 등 미싱 컴포넌트 로그 없음. **AI 검증 가능**.
- **Dependencies**: Task 1 완료 필요 (Foothold 없으면 검증 불가).
- **Skills to reference (predicted)**: `msw-general` → `references/platform-maple.md`(Foothold 물리, `WalkSpeed`/`WalkJump`), `msw-defaultplayer`(이동/점프/카메라 커스터마이즈 패턴), `msw-scripting` → `references/verify-checklist.md`.
- **결과 (2026-07-31)**: 별도 구현 불필요 — `DefaultPlayer`가 기본으로 갖춘 `RigidbodyComponent`+`MovementComponent`+`PlayerControllerComponent`로 이미 동작. 전투 맵이 없어 기존 `Lobby`(MapleTile) 맵에서 검증: 우측 이동키로 x좌표 증가(로그로 실측), Space 키로 `IsOnGround() == false` 전환 + y좌표 상승까지 확인.

### [Task 3] 수동 평타
- **Goal**: 공격키 입력 시 전방 근접 범위 내 몬스터에게 데미지 판정이 발생(자동전투 아님 — 반드시 키 입력이 트리거).
- **Required systems·components**: 플레이어 `@Component`(PlayerController)에 공격 입력 바인딩, 히트 판정(콜라이더/트리거 기반), 데미지 적용 로직.
- **Data**: 기본 공격력 수치(하드코딩).
- **UI**: 없음 (데미지 숫자 표시 등은 Phase 2 HUD에서).
- **Done (verification) criteria**: Play 모드에서 공격키 입력 → `logs`로 데미지 적용/몬스터 HP 감소 로그 확인. **AI 검증 가능**.
- **Dependencies**: Task 2(이동), Task 4(몬스터 존재) — 순서상 Task 4와 함께 검증.
- **Skills to reference (predicted)**: `msw-combat-system`(Attack→Hit 파이프라인, 데미지 모델), `msw-scripting`.
- **결과 (2026-07-31)**: `RootDesk/MyDesk/Combat/PlayerAttack.mlua`(공격 판정/데미지)는 이미 템플릿으로 존재 + `DefaultPlayer.model`에 이미 부착되어 있었음. 실제로 빠져있던 것은 **공격키 바인딩** — `PlayerAttack`은 `PlayerActionEvent.ActionName=="Attack"`을 기다리는데 어떤 키도 "Attack" 액션에 연결돼 있지 않아 키를 눌러도 아무 반응이 없었음. `RootDesk/MyDesk/Combat/PlayerInputBinding.mlua`(신규, `PlayerControllerComponent:SetActionKey(KeyboardKey.LeftControl, "Attack")`) 추가 후 `DefaultPlayer.model`에 부착해 해결. 실제 Ctrl 키 입력(`maker_keyboard_input`)으로 몬스터 HP 100→50(50뎀, 크리티컬 없음) 감소를 로그로 검증 완료.

### [Task 4] 기본 몬스터 1종 배치 및 사망 처리
- **Goal**: 몬스터 `.model` 1종이 맵에 배치되어 존재하고, 평타에 맞아 HP가 0이 되면 엔티티가 제거(사망 처리)됨.
- **Required systems·components**: 몬스터 `.model`(`msw-general/references/monster.md` 캐노니컬 컴포넌트 구성), `MapBuilder`로 맵에 배치, 사망 시 엔티티 제거 로직.
- **Data**: 몬스터 HP 값(하드코딩).
- **UI**: 없음.
- **Done (verification) criteria**: Play 모드에서 몬스터가 화면에 존재 확인 → 공격 시 HP 0 도달하면 사라짐을 `logs` + 화면 상태로 확인. **AI 검증 가능**.
- **Dependencies**: Task 1(맵 준비).
- **Skills to reference (predicted)**: `msw-general` → `references/model.md`(모델 작성 워크플로우, 3-identifier 교체), `references/monster.md`(몬스터 캐노니컬 컴포넌트), `references/builder-protocol.md`(ModelBuilder/MapBuilder 호출 프로토콜) — **`.model` 작업이므로 반드시 병행 Read**.
- **결과 (2026-07-31)**: `RootDesk/MyDesk/Models/Monsters/TestSlime.model` 신규 작성 (TransformComponent/SpriteRendererComponent/RigidbodyComponent/MovementComponent/StateComponent/HitComponent/DamageSkinSpawnerComponent/HitEffectSpawnerComponent/기존 `script.Monster`, AI 없는 정지형 — MVP는 "때리면 죽는다"만 필요). **전투 맵(Task 1)이 아직 없어서 이미 존재하는 `Lobby`(MapleTile) 맵에 임시 배치해 검증 후 제거** — `.model` 파일은 남아있으므로 Task 1 완료 후 실제 전투 맵에 `MapBuilder.placeModel()`로 재배치만 하면 됨. **발견한 버그**: 이 프로젝트는 커스텀 "Monster" 콜리전 그룹(`Global/CollisionGroupSet.collisiongroupset`, UUID `04e4f4d363d1401881cccf4083815fff`)이 이미 정의돼 있고 `PlayerAttack.mlua`가 `CollisionGroups.Monster`로 공격 대상을 필터링하는데, msw-general 문서의 범용 예시(HitBox UUID)를 그대로 썼다가 공격이 전혀 먹히지 않는 문제를 겪음 — `HitComponent.CollisionGroup`을 프로젝트의 실제 Monster 그룹 UUID로 수정 후 해결(자세한 내용은 Archive/As-built.md Gotchas 참고). `maker_execute_script`로 HP 100→50→사망(엔티티 제거)까지 로그로 검증.

### [Task 5] 플레이어/몬스터 SpriteRUID 적용
- **Goal**: 플레이어와 몬스터가 기본 도형이 아니라 실제 캐릭터/몬스터 스프라이트로 화면에 보임.
- **Required systems·components**: `SpriteRendererComponent.SpriteRUID` 설정 (빈 문자열이면 투명 — 8 Core Rules #3).
- **Data**: 없음.
- **UI**: 없음.
- **Done (verification) criteria**: `SpriteRUID` 값이 빈 문자열이 아님을 확인. 실제 렌더링 결과는 유저가 명시적으로 `screenshot`을 요청할 때만 시각 확인. **일부는 유저 확인 필요**(비주얼 적합성 — "이 스프라이트가 맞는 느낌인지"는 AI가 판단 못함).
- **Dependencies**: Task 2(플레이어 엔티티), Task 4(몬스터 엔티티) 존재 필요.
- **Skills to reference (predicted)**: `msw-search`(RUID 검색), `msw-sprite-ruid`(렌더러에 RUID 적용).
- **결과 (2026-07-31)**: 몬스터 — msw-search로 클래식 슬라임 리소스팩(`mob/0210100.img`) 검색, `stand` animationclip(`50faf654ee5d479cb2958edce9feaef0`)을 `SpriteRUID`에 직접 적용(애니메이션 자동 재생). 스크린샷으로 렌더링 확인(유저가 최종적으로 "이 느낌이 맞는지"는 검토 필요 — 자세한 건 Archive/As-built.md 참고). 플레이어 — 기존 아바타 코스튬 시스템으로 이미 시각 렌더링됨(Task 5 범위 밖, Phase 0에서 이미 완료).

## Risks / cautions
- **TileMapMode ↔ Body 불일치**: MapleTile인데 `RigidbodyComponent`가 없으면 `[LEA-3004]` 또는 무반응(에러 없음). Task 2 검증 시 최우선 확인 대상.
- **`SpriteRUID` 빈 값**: 에러 없이 그냥 안 보임 — Task 5에서 반드시 값 확인.
- **좌표 단위**: 1유닛 = 100px. Foothold/스폰 좌표 입력 시 픽셀값 그대로 넣지 않도록 주의.
- **`.mlua` + `.codeblock` 페어**: 스크립트 작성 후 `refresh` 없이는 Maker가 인식하지 못함(Play 모드 중엔 refresh 불가 — `stop` 먼저).
- **`.model` 직접 JSON 편집 금지**: Task 4는 반드시 `ModelBuilder`를 통해서만 작성 (builder-protocol.md 미독 시 값 메타데이터 누락으로 조용히 깨짐).
