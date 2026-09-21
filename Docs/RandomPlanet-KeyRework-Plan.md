# 키 설정 개편 (메이플식 자유 배정) — 계획/진행 문서

> Created: 2026-09-22. 유저 요청: "스킬 8개를 강제로 키에 박아두지 말고, 필요한 스킬만 키 설정에 넣고 뺄 수 있게. 기존 메이플스토리 키보드 세팅처럼 다른 UI(스킬창/인벤토리)와 함께 열어서 끌어다 놓는 구조여야 한다."
> 이 문서는 세션이 바뀌어도 이어서 작업하기 위한 단일 진실 소스다. 각 항목 상태: ⬜ 미착수 / 🟡 구현됨(미검증) / ✅ 검증됨.

## 확정된 결정 (유저 답변, 2026-09-22)
1. **자동 배정 없음** — 새로 얻은 스킬은 전부 "미배정"으로 시작한다. 스킬창에서 키 설정 창의 키로 끌어다 놓아야 쓸 수 있다.
2. **범위** — 스킬 자유 배정 + 창 동시 열기 + **인벤토리 물약도 끌어서 배정**. 공격/점프/창 단축키는 지금처럼 "아이콘을 다른 키로 옮기는" 방식 유지(삭제 불가).

## 현재 구조 (개편 전, 문제점)
- 스킬 8슬롯이 `PlayerSkillComponent.RefillEquipSlots`로 **자동 고정 배치**(1차 공격→슬롯1, 1차 버프→슬롯2 …), 슬롯N ↔ 키 액션 `Skill`/`Skill2`~`Skill8`, 키 설정 창엔 8개 아이콘이 항상 박혀 있음.
- 스킬창 "사용/해제" 토글(`AtkEquippedN/BuffEquippedN`)로만 끄고 켤 수 있음.
- 키 설정 창(`ui/KeySettingGroup.ui`)은 전체 화면 딤(dimmer) 모달 + `BottomBarController.CloseOtherWindows`의 상호배타 대상 → 스킬창/인벤토리와 동시에 못 연다.
- (2026-09-22 수정 완료) 스킬2~8·점프 아이콘 RaycastTarget 꺼짐으로 드래그 불가였음 → `506f535`.

## 목표 구조
### 데이터 모델
- **슬롯 = 핫키 위치**. 슬롯N(1~8) = { 키(KeyBindingLogic 액션 `Skill`/`SkillN`), 스킬(`PlayerSkillComponent.EquippedSkillIdN`) }. 둘 다 **유저가 배정**. 미배정 슬롯은 키=None, 스킬="" 이며 아이콘 숨김.
- 서버 실행 파이프라인(`HandlePlayerActionEvent`→`UseSkillSlot`), HUD 쿨타임 바(빈 슬롯 자동 숨김, 키 라벨은 `GetKeyForAction`)는 그대로 재사용.
- **캐릭터별 저장**: 직업(스킬 id)이 캐릭터마다 다르므로 로스터 캐릭터 데이터에 `skillLayout = { ["1"]={key="Q", skill="powerstrike"}, ... }` 로 저장(계정 공통 `KeyBinding` 저장소엔 스킬 슬롯을 넣지 않는다). 공격/점프/창/물약 키는 기존대로 계정 공통.
- 진입/캐릭터 교체 시: 클라이언트가 로스터의 skillLayout을 읽어 ① 슬롯 키를 컨트롤러에 적용 ② 서버에 스킬 배정 RPC(`RequestApplySkillLayout`, 보유 스킬만 통과) — 티어 스킬 복원(`RestoreTierSkills`) 이후에 적용.
- 물약: `UseHpPotion`/`UseMpPotion` 액션에 대응. 인벤토리에서 hp/mp 물약을 키로 끌어다 놓으면 해당 액션 키를 재배정, 키 아이콘을 키보드 밖으로 끌면 해제(None).
- 삭제 가능: 스킬 슬롯, 물약. 삭제 불가(이동만): 공격, 점프, 창 단축키.
- 키가 이미 다른 기능으로 점유돼 있으면: 스킬↔스킬은 교체(기존 스킬 미배정), 스킬→공격/점프/창/물약 키는 거부.

### UI 구조
- 키 설정 창: 딤 제거(비모달), 제목줄 드래그 이동, 스킬창/인벤토리/장비창과 **동시에 열림**(`CloseOtherWindows` 예외 처리, P키 토글/닫기 버튼/ESC는 유지). 
- 드래그 원본: 스킬창의 보유 스킬 슬롯, 인벤토리의 물약 슬롯. 창 사이 드래그이므로 최상단 **DragGhostGroup**(신규 UI 그룹)의 고스트 아이콘이 포인터를 따라다니고, 놓는 위치를 `_UILogic:ScreenToUIPosition`으로 키 설정 창 좌표로 환산해 키 판정.
- 키 설정 창 안: 배정된 슬롯 아이콘만 표시(스킬명/종류색), 키 위로 드래그 이동/키보드 밖으로 끌어 해제.

## 단계별 체크리스트
### Phase 1 — 데이터 모델 (스킬 자유 배정, 서버+클라 로직) — 2026-09-22 구현·스크립트 검증 완료
- ✅ `PlayerSkillComponent`: 자동 채움(`RefillEquipSlots`)·`AtkEquippedN/BuffEquippedN`·`RequestSetSkillEquipped`·`RequestSetEquippedSkill` 제거 → `ValidateEquippedSlots`(보유 검증), `IsSkillOwned`, `RequestAssignSkillToSlot(slot, skillId)`, `RequestApplySkillLayout(table)`(senderUserId/보유/중복 검증). 실측: 지급 직후 `equipped1=[] equipped2=[]`(자동 배정 없음) → 배정 후 서버 슬롯 반영.
- ✅ `KeyBindingLogic`: 스킬 슬롯 kind=`skillSlot`·기본키 None, `AssignSkillToKey`/`RemoveSkillFromSlot`/`AssignItemActionToKey`/`ClearItemAction`/`IsRemovableAction`/`GetKeyForSkill`/`GetSlotOfSkill`/`GetActionForKey`/`FindFreeSlot`, None 처리(ApplyBindings·ResolveDuplicateKeys·ResetToDefaults), 스킬 슬롯은 계정 `KeyBinding` 저장소에서 제외(예전 저장값 무시). 실측: 빈 키 배정/스킬 교체/이동/교환/공격 키 거부/해제, 네이티브 액션(`nativeAction`) 동기, 물약 해제·재배정, `KeyboardKey.CastFrom("None")==None`.
- ✅ `CharacterRosterLogic`: `GetActiveSkillLayout`/`UpdateActiveSkillLayout`(캐릭터별 `skillLayout`, 비면 필드 제거). 실측: 배정 시 로스터 반영, 해제 후 `skillLayout=nil`로 원복.
- 🟡 진입/교체 연결: `CharacterCardController.OnPlayClicked`, `LobbyStageController.SwapCharacter`에서 `ApplySkillLayoutForActiveCharacter()` 호출. 함수 자체는 재적용으로 검증(서버 `RequestApplySkillLayout applied=/powerstrike//////`), **실제 PLAY 클릭/캐릭터 교체 경로는 미검증**(MCP로 UI 클릭 불가).
- ✅ 스킬창 "사용/해제" 토글 제거 → "배정된 키" 표시(`ApplyKeyInfoLabel`), 슬롯에 `[키]` 표기, 캐릭터 정보창 스킬 요약은 보유 스킬 기준.
- 🟡 키 설정 창 컨트롤러: 미배정 아이콘 숨김·키보드 밖 드롭=해제 코드는 들어갔으나 **화면 동작 미검증**(Phase 2에서 함께 확인).
- ⚠️ **현재 스킬을 키에 배정할 UI가 없다(Phase 3 전까지).** Phase 3 완료 전에는 main에 푸시하지 말 것(로컬 커밋만).
### Phase 2 — 키 설정 창 UI
- ⬜ 딤 제거, 비모달, 제목줄 드래그, 미배정 슬롯 아이콘 숨김, 키보드 밖 드롭=해제.
- ⬜ `BottomBarController.CloseOtherWindows` 예외: 키 설정 창은 스킬창/인벤토리/장비창/캐릭터정보와 공존.
- ⬜ 창 기본 위치 겹침 조정(스킬창/인벤토리와 동시에 보이게).
### Phase 3 — 창 간 드래그 (스킬창/인벤토리 → 키)
- ⬜ `ui/DragGhostGroup.ui` 신규 + `HotkeyDragLogic`(@Logic).
- ⬜ 스킬창 스킬 슬롯 드래그 원본화, 인벤토리 물약 슬롯 드래그 원본화.
- ⬜ 키 설정 창 `DropPayloadAt(touchPoint, payload)`.
### Phase 4 — 마감
- ⬜ 미배정 스킬 안내 토스트("P키 → 스킬을 키에 배정하세요"), HUD 확인, 이 문서·As-built 정리.

## 검증 한계 (정직하게)
- Maker MCP `mouse_input`은 UI 드래그/클릭을 못 낸다 → 실제 마우스 드래그 경로(레이캐스트/UITouch 이벤트)는 **유저 확인 필요**. 로직/좌표 판정/저장/복원은 스크립트로 검증.
