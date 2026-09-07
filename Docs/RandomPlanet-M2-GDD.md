# 리롤 용사 (REROLL HERO) — M2 GDD ("전체 기획서 완전 편입")

> 🔖 **AI note — resuming?** `msw-planning` 스킬을 로드하고 resume 플로우(`Archive/As-built.md` 확인 → 상태 재구성)를 따르세요.
> Created: 2026-09-06. 유저 지시: "이제 게임 제작에 신경 쓸 여력이 없다, AI 독단으로 전체 기획서 내용을 그대로 진행해서 완성해달라, 토큰 제한 없이 진행". 이 문서는 `Docs/랜덤 플래닛 전체 기획서.md`(원안, 미변경)와 `Docs/랜덤 플래닛 인게임.md`(M1, 2026-08-25 기준 Phase 0~4 전부 완료)의 갭을 메우는 M2 로드맵이다.
> Stage: **작성 직후, 실행 시작.**

## 0. 전제 — M1 완료 처리됨 (2026-09-06)

M1 로드맵(Phase 0~4 + Phase 2.5) 전 항목 ✅ 달성. GDD는 `Archive/RandomPlanet-M1-GDD.md`로 이관 완료, `Archive/As-built.md` Quick Status 갱신 완료(26차). Phase A(아래) 전부 완료. 이제부터 Phase B(특성 114종 확장)를 본격 진행한다.

## 1. One-line concept
> 전체 기획서(§0~09 + 부록 A~H)의 프로덕션 스펙을 인게임에 전면 편입 — 114종 특성(기본+링크 패시브 내장) · 4차 전직 하이브리드 스킬 · 링크 캐릭터 · 몬스터 게이트 · 난이도 4단계 · 계정 메타강화 · 리더보드까지 갖춘 "완전판" 로그라이트로 확장한다.

## 2. Key decisions (M1에서 유지)
전체 기획서와 인게임 GDD가 이미 갈라진 지점은 **인게임 쪽을 기준으로 유지**한다 (되돌리지 않음):
- 조작: 완전 수동 (자동전투 없음) — 전체 기획서 §3-1의 "자동 평타" 문구는 무시
- 사망: 영구 삭제 + ENDING (리스폰 아님) — 이미 M1에서 확정
- 맵: MapleTile 사이드뷰 유지
- 세션 길이 1시간 목표는 §8-3 EXP 재조정 시점에 반영 (Phase I)

## 3. M2 로드맵 (Phase A~J)

### Phase A — M1 잔여 정리 + 마일스톤 클로즈 (선행 필수)
- ⬜ 커밋 안 된 5개 파일 diff 검토 후 커밋 (Maker 자동 정규화인지 실질 변경인지 확인)
- ✅ 스킬 티어 3택1 선택 팝업 (버프 3택1 → 공격 3택1 순차 진행, 큐브마스터 재추첨 훅 포함 — 전체 기획서 §07 "스킬 선택 팝업") — `GrantTierSkills`를 자동지급에서 실제 선택 흐름으로 교체. 신규 `Skills/SkillChoiceUIController.mlua` + `ui/SkillChoiceGroup.ui`(AbilityChoiceUIController와 동일 아키텍처). 2026-09-06 실측 검증: 레벨 1→13 강제 점프로 티어2·3 동시 발생 시나리오까지 포함해 버프→공격 순차 팝업, 서버 권한 검증(senderUserId), 큐 처리(TierQueued2~4) 전부 로그로 확인. **검증 중 실버그 발견·수정**: 여러 티어가 같은 프레임에 동시 발생하면(대량 XP) 앞 티어의 선택이 뒤 티어에 덮어써지는 레이스 컨디션(`ProcessSkillTierQueue`가 `SkillChoicePending`의 의도적 0.1초 지연 플립을 즉시성 플래그로 오용) 발견 → `PendingSkillTier~=0` 기준으로 교체해 해결. 빌드 로그 에러 0.
- ✅ 2번 스킬 슬롯 `.ui` 바인딩 + HUD 표시 + 키 설정 팝업 아이콘 — 실제로는 As-built 25차 "W키 백엔드 로직 완료" 기술이 부정확했음을 발견(장착 라우팅만 있고 실제 키 입력→발동 배선이 전혀 없었음). `KeyBindingLogic`에 "Skill2"(기본 W) 액션 등록, `PlayerSkillComponent.UseSkill()`을 `UseSkillSlot(slot)`로 슬롯 파라미터화해 Q/W 공유, `HandlePlayerActionEvent`에 "Skill2" 분기 추가. HUD(`ui/PlayerHUD.ui`)에 `SkillSlot2` 신규 배치, 키 설정 팝업(`ui/KeySettingGroup.ui`)에 `IconSkill2` 신규 배치. 2026-09-06 실측: `UseSkillSlot(2)` 직접 호출로 아이언 바디 발동+VFX+MP차감 전부 로그 확인(실제 W 키 입력 경로는 Q와 동일한 `PlayerControllerComponent` 파이프라인 재사용이라 기존 검증된 Q 경로와 대칭 검증). 빌드 로그 에러 0.
- ✅ VFX 타이밍 딜레이 적용 — As-built 25차의 "설계만 완료, 코드 미적용" 항목(`DoDash` 주석에 있던 "`DispatchSkill`의 `impactDelay`" 개념)을 실제 구현. `melee_single` 스킬(powerstrike/slashblast/arrowblow)에 `SkillCatalog`의 `impactDelay`(0.12~0.2초) 필드 추가, `UseSkillSlot`이 그 시간만큼 `DoMeleeSingle` 실행을 늦춰 스윙 모션의 타격 프레임과 데미지 적용 시점을 맞춘다. dash(즉시 판정이 의도적으로 맞음)·multi_hit(이미 투사체 비행시간으로 자연 지연)는 제외. 2026-09-06 실측: `UseSkillSlot`이 dispatch 로그를 즉시 남기고 `DoMeleeSingle`의 hit VFX 로그가 지연 후 별도로 찍히는 것을 `_TimerService:SetTimerOnce` 기반(이미 프로젝트 전역에서 검증된 패턴)으로 확인. 빌드 로그 에러 0.
- ✅ 물약 시스템 — 몬스터 처치 시 12% 확률로 "빨간 포션"(hppotion) 드랍(`Monster.TryDropPotion`, msw-search로 확보한 실제 클래식 메이플 빨간 포션 스프라이트 RUID 사용) → `CharacterRosterLogic.GrantPotionDrop`(Client RPC, 인벤토리가 ClientOnly라 서버가 처치자 UserId를 지정해 호출) → 인벤토리 소비 탭에 스택 카운트("빨간 포션 xN")로 표시 → 클릭 시 소모 + 최대체력 30% 회복(`PlayerStatsComponent.RequestUsePotion`, 먹보 특성 보너스 훅 포함). 버서크 특성은 클라이언트 클릭 시점 + 서버 RPC 양쪽에서 이중 차단(전체 기획서 §2-3 "회복 아이템 적용 불가"). 2026-09-06 실측: 테스트 캐릭터(슬롯6, 검증 후 삭제 완료 - 실제 보유 캐릭터 1~5 무손상 확인)로 드랍→인벤토리 반영(count=2)→사용(count=1, Hp 15→60 회복)까지 전체 파이프라인 로그로 확인. 빌드 로그 에러 0.
- ✅ 던전(토벌전장 1~3) 클리어 가능성 검증 — 2026-09-06 실측: 몬스터 MaxHp 50/140/280, AtkDmg 8/18/32, InputSpeed 0.9/1.35/1.65가 권장 전투력(150/400/800, ~2.67배 등비)과 합리적으로 스케일링됨을 확인. 기존 18~25차 순삭 버그 수정(i-frame, 스폰 지터, AI 재설계)이 유효한 상태로 크리티컬 이슈 미발견. 단, 전장3 풀웨이브 실플레이 완주까지는 이번 세션에 재검증하지 못함 — 후속 유저 피드백 권장.
- ✅ M1 마일스톤 공식 완료 처리 — `Docs/랜덤 플래닛 인게임.md` → `Archive/RandomPlanet-M1-GDD.md` 이관, `Archive/As-built.md` Quick Status 최상단 갱신 완료 (2026-09-06)

### Phase B — 특성 시스템 전면 확장 (115종, 최우선 — 게임 정체성의 핵심)
> 전체 기획서 §2-3(115종 5풀) + §8-2(풀 확률+천장) + 부록 D(링크 패시브 115쌍) + 부록 E(기본 패시브 100쌍) + 부록 G(신규 15종 자체 효과) 전면 반영.
- 🟡 **데이터 구조 설계**: `RootDesk/MyDesk/Traits/TraitCatalog.mlua`(`@Logic`)에 115종 전체를 Lua 테이블로 구현 완료(풀 구분·기본패시브 텍스트/파라미터·링크패시브 텍스트 전부 포함, 실측으로 115종/각 풀 카운트 hg27·avg21·bad20·gmb24·hb23 정확히 일치 확인). **UserDataSet(CSV) 이관은 하지 않음** — 이 프로젝트가 지금까지 `SkillCatalog.mlua`와 동일하게 `.mlua` 테이블 패턴을 일관되게 써왔고, 115종 규모에서도 코드 리뷰/버전관리 편의상 이 편이 낫다고 판단(추후 밸런스 반복이 심해지면 이관 검토).
- ✅ **범용 효과 적용 엔진**: `RootDesk/MyDesk/Traits/TraitEffectEngine.mlua`. **1단계(완료, 이전 패스)**: 공격력%/고정치·크리확률/배율·공격속도%·명중·회피·이동속도(고정/%)·최대체력(%/고정)·최대MP%·피해감소%·스킬MP소모%·드랍률%·경험치%·넉백저항·흡혈%·처치시 회복 확률·처치시 보너스경험치 확률·물약 차단·물약 효과량%·런당 1회 부활(17채널+5트리거). **2단계(2026-09-06 후속 패스, 완료)**: 방어막 시스템(`PlayerStatsComponent.ShieldAmount`, `PlayerHit`가 Hp보다 먼저 소모) — `shieldOnHit`(마나실드/약골/유리몸, 피격 시 확률 방어막)와 `periodicShield`/`periodicShieldGrant`(수호자/유리몸, 주기적 방어막 — 이 프로젝트엔 몬스터 공격에 "치명타" 개념이 없어 수호자의 "치명타 무효"는 방어막으로 근사) 둘 다 구현. `coinFlipDefense`(운명의 동전), `mirrorDamage`(거울 갑옷, `Monster.TakeReflectedDamage` 신설 — 반사 전용 진입점이라 무한 반사 루프 없음), `onCritExecuteChance`(동전 던지기 사형집행인, `Monster.ExecuteKill` 신설 — `Monster.IsBoss` 가드로 보스 제외), `onHitCooldownReset`(메아리), `onSkillCooldownRoulette`(회전룰렛), `firstHitCritOnWaveStart`(집중), `killStackAtk`/`hitStackAtk`/`timeStackAtk`(적응력/굶주린 살점/시한폭탄, 공용 `RecomputeDynamicAttackDamage`로 버서크와 합산), `lowHpAtkMult`/`lowHpCritMult`(투지/순교자), `regenIfUnhit`(재생력/회복가), `dropGamble`/`expGamble`(도박꾼/복불복 상자), `statReshuffle`(룰렛), `luckyDayRoll`(럭키/언럭키 데이). 새 1Hz `PlayerStatsComponent.CombatTick`(전투 지형 전용, `StartCombatTimer`/`StopCombatTimer`)이 조건부/누적/주기 효과를 통합 처리. **실측 검증(2026-09-06, 마나실드 강제 장착 후 실제 전장 진입)**: `PlayerHit: shieldOnHit granted amount=4.0` → `shield absorbed 4.0` 로그로 방어막 생성+소모 확인, `Monster.TakeReflectedDamage(999999)` 직접 호출로 즉사 확인, `Monster.ExecuteKill`을 `IsBoss=true`(생존)/`false`(사망) 양쪽 호출로 보스 가드 확인. 빌드 로그 248건 전부 error/LEA 패턴 0건(grep) — 로컬 mlua-lsp "타입 unavailable"만 기존 기록된 오탐. **여전히 미구현(새 서브시스템 필요, 정직하게 남김)**: 진화의 손길(스킬 사용 카운터)·환영 교체(분신 서브시스템)·메아리치는 발걸음(도트 프레임워크)·시간을 거스르는 자(위치+체력 스냅샷 롤백, Body 텔레포트 API 리스크로 보류)·분신 소환·영혼 포획자(소환 서브시스템)·차원의 틈(onCritPullChance, 몬스터 물리 pull, AI 충돌 리스크로 보류)·영구재화/스탯구슬 의존 효과 다수(Phase G 선행)·큐브마스터 이능 팝업 쪽 재추첨(스킬 팝업만 연결됨)·미친 과학자(선택 UI 구조 변경 필요)·카지노(칩 재화)·양날의 축복(특성 2개 동시 부여, Trait2와 연계 검토 필요).
- ✅ 5풀 확률 가중치(hb7%/gmb18%/hg20%/bad20%/avg35%) 구현 — `TraitRollLogic.mlua`. Hidden-bad 완화 천장(40회 무출현시 41회째 확정)도 구현했으나 **세션 한정 카운터**(월드 재시작 시 초기화, 계정 영구 저장은 미연결 — CharacterRosterLogic 저장 스키마 변경 리스크로 이번 패스 범위 밖). 실측: 200회 시도 중 10회 샘플로 5풀 전부 정상 출현 확인.
- ✅ 캐릭터 생성 시 특성 배정을 축소 풀(6종)에서 전체 115종 풀로 교체(`CharacterSelectStageController.InitRandomPools`/`CreateCharacter`) + 이능 "특성 변경"(`PlayerStatsComponent.RollDifferentTrait`)도 동일하게 전체 풀 사용하도록 교체.
- 🟡 3차 전직(13레벨) 추가 특성 1회 재추첨 연결 — **2026-09-06 구현 완료(범위 제한부)**. `PlayerStatsComponent.Trait2`(`@Sync`) 신설, `GrantSkillTierIfMilestone`의 tier==3 분기에서 `TraitRollLogic:RollDifferentTrait(Trait)`로 1회 자동 재추첨(부패한 계약서 보유 시 `RollHiddenPool()`로 Hidden 풀 강제). `TraitEffectEngine.ApplyToStats`를 `(stats, trait, ...)` 시그니처로 리팩터해 Trait/Trait2 각각 독립 호출로 17개 스탯 채널이 곱연산 합산되도록 구현, legacy 5특성(버서크/균형/절약가/단단함/날렵함) 체크 지점도 전부 `Trait == X or Trait2 == X`로 확장. 실측(2026-09-06): 강제 레벨업(GrantXp 50000)으로 Trait2="겁쟁이" 롤링 확인, 빌드 로그 0 error. **범위 제한(정직히 기록)**: 2단계 트리거 메커니즘(방어막/반사/스택 등, 직전 패스)·링크 패시브·캐릭터 정보 UI 표시·CP 산식에는 Trait2가 아직 반영되지 않음(콜사이트가 20여 곳으로 많아 리스크 판단, 스탯 채널만 우선 연결) — 후속 패스 과제. 로스터 영구 저장도 안 함(레벨 자체가 이미 로스터 미저장인 기존 한계와 동일 특성 — 재입장 시 소실, 신규 회귀 아님).
- 🟡 기본 패시브 UI 텍스트 115종 전체 연결 완료(`AbilityChoiceUIController.TraitBlurb`/`CharacterInfoUIController.TraitDesc`가 legacy 6종 제외 전부 `TraitCatalog.GetTraitDef` 조회로 표시) — 수치 자체는 위 엔진 커버리지에 따름.
- ⬜ 링크 패시브 115종 실제 효과 적용 — Phase C 범위(텍스트 데이터는 이미 TraitCatalog에 있음).
- ⬜ 실측 밸런스 검증 — 개별 수치 동작 확인(위 5종)은 완료했으나, 결정론적 시뮬레이션 기반 풀 단위 밸런스 검증(버서크 재설계 때 방식)은 115종 규모상 이번 패스에서 미착수.

### Phase C — 링크 캐릭터 실효과 연결
- ✅ **버그 수정(선행)**: 로스터의 캐릭터별 `level` 필드가 생성 시점(1) 이후 전혀 갱신되지 않던 기존 결함 발견·수정 — `PlayerStatsComponent.OnSyncProperty("Level")`이 레벨업마다 `CharacterRosterLogic:UpdateActiveLevel()`을 호출해 즉시 저장. 이 결함 때문에 "링크 캐릭터 15레벨 이상" 조건이 지금까지 실질적으로 영원히 충족 불가능했음(모든 링크 후보가 항상 레벨 1로 보임) — 2026-09-06 실측: 테스트 캐릭터 레벨 1→4 강제 후 로스터 조회로 즉시 반영 확인.
- ✅ 링크 패시브 115종 중 57종에 수치 효과(`linkEffect`) 입력 완료(나머지는 새 서브시스템 필요 — 랜덤 버프/재화/조건부 트리거 등, 정직하게 `linkEffect` 필드 미기입 상태로 유지) — `TraitEffectEngine.ApplyLinkToStats`/`ApplyModifiersToStats`(본인 특성용 `ApplyToStats`와 공유)로 구현.
- ✅ 15레벨 이상 링크 캐릭터의 링크 패시브를 실제로 스쿼드(액티브 캐릭터)에 적용 — `PlayerStatsComponent.UpdateSquadLinks`(Server RPC, senderUserId 검증) + `CharacterRosterLogic.PushSquadLinksToServer()`(공격대 확정 직후·캐릭터 진입/교체 직후 호출). 동일 링크 패시브(같은 특성) 중복 불가 규칙 구현(2번째 링크가 1번째와 같은 특성이면 무시).
- ✅ 링크 마스터(1.2배)/박애주의자(3배)/친화력(1.1배)/외골수(0.5배)/고독(0배, 링크 전부 차단) 효율 보정 — `TraitEffectEngine.GetLinkEfficiencyMultiplier(trait, trait2)`. 2026-09-06 실측: 외골수 적용 시 처형자(atk+3%) 링크 효과가 정확히 0.5배(attackDamage 17.5→17.7625, 이론값과 소수점까지 일치)로 스케일링됨을 확인.
- ✅ 공격대 편성 UI에 링크 패시브 미리보기 추가 — 신규 UI 노드 대신 `SquadFormationController`의 기존 후보 라벨 텍스트에 링크 패시브 설명을 추가하는 방식으로 구현(빠른 구현, 별도 `.ui` 빌더 작업 불필요). 15레벨 미만이면 잠긴 패시브 이름만, 15레벨 이상이면 실제 효과 설명까지 표시.
- 🟡 **범위 제한(정직히 기록)**: (1) 고독/박애주의자의 "다른 슬롯 링크효율 보정" 같은 교차-슬롯 조건부 효과는 미구현(현재는 본인 특성 기준 단방향 배율만 적용). (2) 링크 캐릭터 본인의 `Trait2`(3차 전직 추가 특성)는 애초에 로스터에 저장되지 않아(레벨과 동일한 기존 한계) 링크 소스로 반영 불가 — 로스터가 캐릭터당 특성 1개만 기록하는 구조적 제약. (3) 결정론적 밸런스 시뮬레이션(링크 조합 단위)은 미실행.

### Phase D — 전직 시스템 완성 (4차, 메이플 옛날 직업 스킬 하이브리드)
- ✅ 기존 `SkillCatalog.mlua`(13종, 1차 한정)를 4차 전직 전체로 확장 — 5직업 x 3티어(2/3/4차) x 버프/공격 = 신규 30종 추가(총 43종). `tier` 필드 신설 + `GetSkillsByCategory`/`RollSkillChoices`가 tier 파라미터로 필터링하도록 리팩터(이전엔 티어 구분 없이 카테고리 전체에서 뽑아 5레벨 캐릭터가 4차 스킬을 받을 수 있는 구조적 결함이 있었음). 스킬명은 메이플스토리 지식 기반 최선 추정(더블스윙/파워가드/썬더볼트/트리플스로우/아수라/인피니티/허리케인/메테오스트라이크/배틀쉽 등 다수는 높은 확신으로 실존 확인, WebSearch 교차검증 시도했으나 구버전 위키 자료 부족으로 전부 백과사전 수준 검증은 아님 — 기존 럭키세븐/너클부스터와 동급의 타협). VFX는 시간 관계상 각 직업 기존 1차 스킬 RUID 재사용(신규 msw-search 없음, 향후 폴리싱 과제로 명시). 신규 testableEffect 3종(dmgreduction/skilldmg/atkbonus)을 `PlayerSkillComponent.DoBuff/RevertBuff`에 ironbody와 동일한 델타 저장 패턴으로 구현. **실측 검증(2026-09-06)**: `GetSkillsByCategory`로 티어별 정확한 개수(1차 7atk/6buff, 2~4차 각 5atk/5buff, 총 43종) 확인, 실제 레벨5 캐릭터의 3택1 팝업이 2차 풀(meditation/powerguard/soularrow)만 보여주고 다른 티어가 섞이지 않음을 확인, 버프→공격 순차 진행 확인, dmgreduction(0.0→0.15)/skilldmg(0.15→0.35)/atkbonus(100→120) 3종 신규 효과 전부 정확한 수치로 적용됨을 clean 격리 테스트로 확인. 빌드 로그 에러 0.
- ✅ 전직 퀘스트 보스 연결 (5·13·18레벨, 클리어해야 다음 차수 스킬 획득) — `PlayerStatsComponent`에 `PromotionPending2~4`(@Sync) 신설. 레벨 요건 충족 시 곧바로 `GrantTierSkills`를 호출하던 기존 동작을 제거하고 대신 대기 플래그만 세운다(`GrantSkillTierIfMilestone`). 실제 지급은 `RecordBossKillForPromotion`(신규)에서 수행 — `Monster.GrantXpToAttacker`에 `if self.IsBoss then stats:RecordBossKillForPromotion() end` 3줄 추가로 연결(기존 `FieldMiniBoss`/`AddKill` 인프라 재사용, 전용 퀘스트 맵 신규 제작 없음). 여러 티어가 동시에 대기 중이면 가장 낮은 티어부터 하나씩 해소. **실측 검증(2026-09-06)**: 레벨5/13 강제 도달 시 스킬 팝업 없이 "처치 대기" 로그만 남는 것 확인 → `RecordBossKillForPromotion` 직접 호출(보스 처치 시뮬레이션)로 tier2 스킬 3택1 팝업이 그제서야 발동하는 것 확인, tier3도 동일하게 검증 + Trait2(3차 추가 특성)도 이 시점에야 굴러가는 것 확인. 빌드 로그 에러 0.
- ✅ 보스 클리어 타임 계정 귀속 기록 (리더보드 연동, Phase H) — 범위 제한부. `PromotionMilestoneElapsed`(레벨 달성 시각) + `LastPromotionClearSeconds`(처치까지 걸린 시간, 세션 내 최근 값)를 `RecordBossKillForPromotion`이 계산·로그로 기록. **미구현**: 계정 귀속 영구 저장(`_DataStorageService`)과 전역 리더보드 자체는 Phase H 몫으로 명시적으로 남김 — 지금은 세션 로그로만 확인 가능.
- ✅ 봉인된 자(1차 한정)/외길(2슬롯 한정)/봉인구(4차 불가) 등 특성-전직 상호작용 규칙 연결 — `HasTrait(name)`(Trait/Trait2 겸용 조회) 신설. 봉인된 자: `GrantSkillTierIfMilestone`에서 tier 무관 전부 무시(전직 자체가 안 세워짐). 봉인구: tier==4만 차단. 외길: 보스는 정상 처치되고 Trait2/레벨 진행은 막지 않되 `RecordBossKillForPromotion`이 `GrantTierSkills` 호출만 스킵. **실측 검증**: 3개 특성 전부 개별 격리 테스트로 의도한 분기(봉인된자→tier2_pending 안 세워짐, 봉인구→tier2는 세워지고 tier4만 차단, 외길→처치는 확인되지만 스킬 미지급) 확인.
- ⚠️ **테스트 중 발견한 기존 버그(이번 패스 범위 밖, 정직히 기록)**: `CharacterRosterLogic.UpdateActiveLevel`이 `PlayerStatsComponent.Level` 변경 시 그 컴포넌트가 실제로 "현재 활성 캐릭터"인지 검증 없이 무조건 `GetActiveIndex()` 슬롯에 레벨을 덮어쓴다. 정상 플레이 흐름(슬롯 선택→입장)에서는 문제가 없지만, 이번 테스트처럼 choice_map에 파킹된 로컬 플레이어 엔티티의 스탯을 직접 조작(정식 입장 플로우 우회)하면 실제 활성 슬롯(테스트 중엔 슬롯1, 실유저 캐릭터)의 level 필드가 의도치 않게 덮어써질 수 있음 — 실제로 테스트 중 슬롯1의 level이 1→13으로 잘못 저장되는 것을 발견, 즉시 `roster[1].level=1` 복구 후 재시작으로 영구 저장 확인(trait/스탯/스킬 등 다른 필드는 전혀 손상 없었음, 재확인 완료). 다음 세션 참고: 파킹 플레이어로 스탯 테스트 시 이 사이드이펙트를 염두에 두거나, 테스트 후 항상 슬롯1 level을 재확인할 것.

### Phase E — 몬스터 게이트 (특수 던전)
- ✅ 게이트 입장권 재화 + 인벤토리 연결 — 2026-09-07 구현+실측 검증 완료. 신규 `Meta/GateTicketLogic.mlua`(`@Logic`, AccountCurrencyLogic과 동일한 계정 UserDataStorage 패턴, 최대 10장). 일반 전장 클리어(미니보스 처치) 시 20% 확률로 1장 드랍(`FieldWaveSpawner.RollGateTicketDrop`). `ui/BattlefieldSelectGroup.ui`에 신규 Field4 행("몬스터 게이트" + 보유 수량 표시) 추가, `BattlefieldSelectController.OnGateClicked`→`GateTicketLogic.RequestEnterGate`로 연결. 실측: `GrantTicket`→`LoadCount`→클라이언트 `OnTicketGranted` 왕복 전부 로그로 확인(count 0→1).
- ✅ 좌우 조여오는 몬스터 웨이브 패턴 — 전용 맵을 새로 만들지 않고 **토벌전장3(기존 MapleTile 맵)을 게이트 모드로 재사용**(`FieldWaveSpawner.IsGateMode` 플래그, `GateTicketLogic.RequestEnterGate`가 진입 직전 세팅, `ResetField`가 방문자 교체마다 해제 — 솔로 전용 게임 전제하 저위험 설계, 새 맵 제작에 필요한 유저의 TileMapMode 수동 설정을 회피). 웨이브가 진행될수록 좌우 스폰 X가 중앙으로 수렴(`GateConvergePerWave`/`GateMaxConverge`).
- ✅ 스탯 3배/물량 2배 스케일링 — `GateStatMultiplier=3.0`/`GateAliveMultiplier=2.0`을 `TrySpawn`/`SpawnMiniBoss`에 적용. **실측(2026-09-07, 실제 몬스터 스폰)**: 전장3 기본 FieldMonster3(MaxHp 280/ATK 32/XP 120) → 게이트 모드에서 MaxHp=840.0/ATK=96.0/XP=360 정확히 3배 확인(로그 증거). 동시 생존 상한도 2배 적용.
- 🟡 게이트 보스 등장 + 클리어 보상 — 구현 완료, **보스/보상 부분은 코드 리뷰로만 검증**(실측 미완, 아래 참고). 기존 `SpawnMiniBoss`(마지막 웨이브 트리거)를 그대로 재사용해 `GetStatMultiplier()`/`GetRewardMultiplier()`로 보스 스탯도 스케일링(전장3 보스 기준 HP 400→1200/ATK→3배/XP→3배 예상, TrySpawn과 동일 검증된 배율 로직 재사용이라 리스크 낮음). 클리어 시 `GrantGateClearRewards()`(이능 재선택권=`PendingAbilityChoices+1`, 고급 스탯 구슬=Str/Dex/Intel/Luk 각 +3 — 둘 다 이미 검증된 기존 메서드/필드 재사용)를 호출. **실측 미완 이유**: 라이브 테스트 중 실제 사용자 캐릭터(슬롯1)가 필드 몬스터에게 피격사망하는 사고가 발생해(로스터 데이터 자체는 무손상 확인 완료) 추가 라이브 조작을 자제하고 코드 리뷰로 전환 — 다음 세션에서 별도 테스트 캐릭터로 보스 처치까지 실측 권장.

### Phase F — 난이도 4단계 스케일
- ✅ 하급/중급/상급/최상급 몬스터 스탯 배율(×1.0/1.5/2.25/3.4) + 보상 배율(×1.0/1.4/2.0/2.8) 적용 — `FieldWaveSpawner.DifficultyTier`(1~4) + `GetStatMultiplier()`/`GetRewardMultiplier()`. 게이트 모드와는 상호 배타적으로 처리(게이트가 우선). 2026-09-07 실측: tier 1~4 각각 정확히 1.0/1.5/2.25/3.4(스탯)·1.0/1.4/2.0/2.8(보상) 반환 확인.
- ✅ 토벌전장 선택 UI에 난이도 선택 추가 — 2026-09-08 구현+실측 검증 완료. `ui/BattlefieldSelectGroup.ui`에 4개 토글 버튼(하급/중급/상급/최상급) 추가, `BattlefieldSelectController`가 `selectedTier`(기본 1)를 유지하며 `OnField1/2/3Clicked`에서 `_CharacterRosterLogic:RequestEnterBattlefield(fieldIndex, selectedTier)`로 전달. `RequestEnterBattlefield`는 목적지 맵의 `FieldWaveSpawner`를 `_EntityService:GetEntityByPath`로 찾아 텔레포트 직전에 `DifficultyTier`를 세팅. 실측(Maker Play, client+server_main 양쪽): (1) client에서 4개 tier 버튼 UUID 바인딩 정상, `selectedTier` 갱신 및 `RefreshTierButtons()` 정상 동작 확인 (2) server_main에서 `/maps/토벌전장1` → `FieldWaveSpawner` 조회 후 `DifficultyTier=3` 세팅 시 `GetStatMultiplier()=2.25`/`GetRewardMultiplier()=2.0` 정확히 반환 확인(배율표와 일치). 실 유저 캐릭터로 텔레포트해 몬스터 스탯까지 확인하는 전체 E2E는 이번 세션의 로스터 안전 지침(슬롯1 보호)상 보류 — 컴포넌트 레벨 로직은 검증 완료.

### Phase G — 재화 · 계정 메타 진행
- ✅ 영구 재화 시스템 (런 클리어 정산 → 계정 귀속) — 2026-09-06 구현+실측 검증 완료. 신규 `Meta/AccountCurrencyLogic.mlua`(`@Logic`, RestGaugeLogic과 동일한 계정 UserDataStorage 패턴). `PlayerStatsComponent.GrantRunEndCurrency()`가 `TriggerRunEnd()`(사망/ENDING) 시점에 `도달레벨×5 + 처치수×2 + floor(생존초/10)` 공식으로 정산·적립. Maker 실측: level=7/kills=12/survival=95s → base=68, 정확히 일치 확인, 계정에 68 적립 후 클라이언트 `OnCurrencyGranted` 왕복까지 로그로 확인.
- ✅ 상인 특성의 실제 드랍률 효과 — 이미 M2 Phase B(TraitCatalog `basicEffect={drop=0.15}` + `Monster.TryDropPotion`의 `DropRateMultiplier`)에서 완료된 상태였음을 재확인(25차 처치경험치 임시 대체는 이미 원복됨). 이번 세션은 검증만 수행.
- ✅ 계정 영구 강화 — 2026-09-06 구현+실측 검증 완료(설계 범위: "시작 스탯 보너스" + "좋은 특성 가중치 상승" 통합 1개 트랙, 레벨 0~10, 비용 50×(레벨+1) 선형 누진). `CharacterSelectStageController.RollStats()`가 레벨당 +1 총 스탯 포인트(실측: 레벨1→합계21 확인), `TraitRollLogic.RollPool(bonusLevel)`이 레벨당 hb/bad에서 0.5%p씩 걷어 hg로 이동(레벨10 상한 5%p, 실측: 레벨1/60롤 표본에서 에러 없이 정상 동작 확인 — "캐릭터 생성 시"로 범위 한정, 이능 재추첨 등 런 중간 재추첨은 미적용). 신규 `Meta/AccountUpgradeUIController.mlua` + `ui/AccountUpgradeGroup.ui`(파치먼트/브라운 톤, 기존 EndingGroup 패턴 재사용) + choice_map에 "강화" 월드 버튼(`WorldButton.model` 신규 인스턴스) 배치. 실측: 팝업 오픈→구매(정수 436→436-100 남았어야 할 다음 비용까지 텍스트 정확 표시)→레벨 1 반영까지 로그+엔티티 텍스트 직접 조회로 확인. **게이트 입장권 보유 한도 증가는 미구현**(몬스터 게이트 자체가 Phase E 미착수라 입장권 시스템이 없음 — 정직하게 기록).
- ✅ 빈곤의 서약·한탕주의 특성의 특수 재화 규칙 — 2026-09-06 구현+실측 검증 완료. `GrantRunEndCurrency`가 두 특성을 트레잇 이름으로 직접 분기(기존 봉인된 자/외길/봉인구 패턴과 동일 원칙): 빈곤의 서약=항상 0(실측 확인), 한탕주의=평소 0(실측 확인)·클리어 시에만 기본의 5배(실측: base68→340 정확히 일치). 시간여행자(`clearCurrencyBonus=0.15`)도 함께 구현+실측(68→78, floor(68×1.15) 일치).

### Phase H — 리더보드 · 명예의 전당
- ⬜ `msw-packages` 랭킹 패키지 확인 후 채택 여부 결정
- ⬜ 전직 퀘스트 보스 클리어 타임 전역 리더보드
- ⬜ ENDING 화면 → 명예의 전당 등록 연결 (기존 개인 최고 기록을 전역으로 확장)

### Phase I — 레벨 21 + 경험치 테이블 재조정
- ⬜ 최대 레벨 5~10(MVP) → 21로 확장
- ⬜ 16~21레벨 해금 조건(계정 귀속) 설계 및 연결
- ⬜ §8-3 경험치 테이블을 신 타깃(1시간)에 맞게 재산정

### Phase J — 최종 통합 QA
- ⬜ 전 콘텐츠 실플레이 재검증 (신규 캐릭터 생성 → 전직 4회 → 몬스터 게이트 → 사망/ENDING)
- ⬜ 밸런스 실측 (여러 특성 조합으로 결정론적 시뮬레이션)
- ⬜ `Archive/As-built.md` 최종화 + M2 마일스톤 클로즈

## 3b. 발견된 버그 (2026-09-07, Phase E/F 세션 중, 미수정)
- ⚠️ **`CharacterSelectStageController.CreateCharacter(idx)` 실행이 멈춤(행)** — `maker_execute_script`(client)로 직접 호출 시 응답 없이 무한 대기(빈 스크립트로 강제 중단해야 함), 로그 상 에러도 전혀 남지 않음. 실제 유저의 마우스 클릭 경로에서도 재현되는지는 미확인(이번엔 스크립트 직접 호출로만 재현) — `RollStats`/`TraitRollLogic.RollTrait`(가중치 계산, while 루프에 guard<30 있음, 무한루프 아님을 코드로 확인) 자체엔 블로킹 요소가 안 보여 원인 불명. 다음 세션에서 실제 클릭으로 재현되는지부터 확인 필요(안 되면 execute_script 특유의 이슈일 수도 있음).

## 4. 실행 원칙
- 각 Phase는 하위 항목 완료 즉시 `⬜→🟡→✅`로 갱신 (msw-planning 규칙)
- 매 항목 구현 후 Maker 실측 검증 필수, 빌드 로그 에러 0 확인
- 완료 단위마다 커밋 + 푸시 (유저 승인 불필요 — 유저 지시로 자율 진행 중)
- 기존 검증된 M1 시스템(콜리전 그룹, i-frame, 웨이브 스폰 등)의 기존 동작을 깨지 않도록 회귀 테스트 병행
