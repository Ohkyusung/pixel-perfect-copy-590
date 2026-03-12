
목표: “동시에 여러 손가락 입력 시 게이지 끊김/미시작” 문제를 재발 없이 해결합니다.

1) 원인 정리
- 현재 안정화 로직이 미세 이동을 누적해서 큰 이동으로 판정하는 구조라, 손가락을 가만히 둬도 자주 reset됩니다.
- `TouchArea`가 `progress > 0`일 때만 `stabilizing` 상태로 바뀌어, 시작 타이밍에 따라 게이지가 안 올라가는 것처럼 보일 수 있습니다.
- 링 UI가 `progress > 0`일 때만 렌더되어 “아예 시작 안 함” 체감이 커집니다.

2) 구현 계획 (수정 파일)
- `src/hooks/useStabilization.ts`
  - 이동 판정을 “누적 기준”이 아니라 “프레임 간(직전 위치 대비) 기준”으로 변경.
  - 손가락 수/ID 변경과 이동 reset 사유를 분리 처리.
  - count down 시작 직후 `isCountingDown`을 즉시 true로 두고, 시작 상태가 UI에 바로 반영되게 개선.
  - RAF loop 안전성 보강(`null` 명시 체크, 루프 중복 방지).
- `src/components/TouchArea.tsx`
  - 상태 전환 기준을 `progress > 0` 중심에서 `isCountingDown` 중심으로 변경해 시작 flicker 제거.
  - stabilizing 상태 진입/유지 조건을 단순화해 detecting↔stabilizing 왕복 방지.
- `src/components/FingerCircle.tsx`
  - stabilizing일 때 링을 항상 렌더(0% 포함)해서 “게이지 미시작” 오해 제거.
  - `stroke-dashoffset` 업데이트를 더 일관되게 반영(과도한 transition 의존 축소).

3) 검증 시나리오
- 2~5손가락을 거의 동시에 올렸을 때: 게이지가 즉시 나타나고 끊기지 않고 상승.
- 손가락 미세 떨림/아주 작은 위치 변화: reset 없이 진행.
- 손가락 하나를 확실히 움직이거나 떼기/추가하기: 의도대로 reset.
- 연속 10회 반복 시 “게이지가 아예 안 올라감” 재현 불가 확인.

기술 세부사항
- 안정화 훅을 “입력 구조 변화(터치 수/ID)”와 “이동 변화” 두 단계로 분리해 상태 경쟁(race)을 줄입니다.
- 진행도 렌더링 신호(`isCountingDown`)와 결과 신호(`isStable`)를 분리해 UI 상태머신이 progress 값에 종속되지 않게 만듭니다.
- 다중 터치에서 가장 흔한 문제인 미세 드리프트 누적 reset을 제거해 모바일 실사용 안정성을 높입니다.
