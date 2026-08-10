# 🐶 Pet Routine Manager Requirements

## 1. Document Purpose

이 문서는 Pet Routine Manager의 기능 및 비기능 요구사항을 정의한다.

`kickoff.md`가 서비스의 방향과 설계 원칙을 정의한다면, 이 문서는 실제 개발 과정에서 **구현해야 할 기능과 시스템 동작을 구체적으로 정의하는 것을 목적**으로 한다.

요구사항은 개발 과정에서 변경될 수 있으며, 변경이 발생할 경우 변경 이유와 영향을 함께 검토한다.

---

# 2. Scope

## MVP 목표

가족 구성원이 하나의 반려동물을 공동으로 돌보면서 다음 정보를 쉽게 공유할 수 있어야 한다.

> **누가 / 어떤 반려동물에게 / 무엇을 / 언제 했는가**

### MVP 핵심 영역

1. Authentication
2. Family
3. Family Permission
4. Pet
5. Routine
6. Care Record
7. Mobile UX

---

# 3. User Roles

## OWNER

가족당 1명만 존재한다.

### 주요 권한

* 가족 생성
* 가족 정보 관리
* 가족 구성원 관리
* 가족 초대
* 반려동물 관리
* 가족 삭제

## MEMBER

가족에 초대되어 공동 양육에 참여하는 사용자다.

### 주요 권한

* 가족 조회
* 가족 구성원 조회
* 반려동물 조회
* 루틴 조회
* 돌봄 기록 생성
* 돌봄 기록 조회
* 자신의 기록 수정 / 삭제
* 가족 탈퇴

---

# 4. Functional Requirements

## 4.1 Authentication

### FR-AUTH-001

사용자는 Google OAuth를 통해 로그인할 수 있어야 한다.

### FR-AUTH-002

사용자는 Kakao OAuth를 통해 로그인할 수 있어야 한다.

### FR-AUTH-003

로그인하지 않은 사용자는 인증이 필요한 서비스 기능에 접근할 수 없어야 한다.

### FR-AUTH-004

인증된 사용자의 서비스 내 User 정보를 생성하거나 조회할 수 있어야 한다.

### FR-AUTH-005

사용자는 로그아웃할 수 있어야 한다.

### FR-AUTH-006

인증 상태가 변경되었을 때 서비스의 권한 검증이 올바르게 적용되어야 한다.

### MVP 제외

* 이메일 / 비밀번호 로그인
* 비밀번호 찾기
* 이메일 인증
* 자체 회원가입 폼

---

# 4.2 Family

### FR-FAMILY-001

인증된 사용자는 새로운 가족을 생성할 수 있어야 한다.

### FR-FAMILY-002

가족을 생성한 사용자는 해당 가족의 OWNER가 되어야 한다.

### FR-FAMILY-003

하나의 가족에는 OWNER가 1명만 존재해야 한다.

### FR-FAMILY-004

가족 구성원은 가족 정보를 조회할 수 있어야 한다.

### FR-FAMILY-005

가족 구성원 목록을 조회할 수 있어야 한다.

### FR-FAMILY-006

OWNER는 가족을 삭제할 수 있어야 한다.

### FR-FAMILY-007

MEMBER는 가족에서 탈퇴할 수 있어야 한다.

### FR-FAMILY-008

가족 데이터는 해당 가족의 구성원만 접근할 수 있어야 한다.

---

# 4.3 Family Invitation

### FR-INVITE-001

OWNER는 다른 사용자를 가족에 초대할 수 있어야 한다.

### FR-INVITE-002

초대받은 사용자는 초대를 확인할 수 있어야 한다.

### FR-INVITE-003

초대받은 사용자는 초대를 수락할 수 있어야 한다.

### FR-INVITE-004

초대받은 사용자는 초대를 거절할 수 있어야 한다.

### FR-INVITE-005

유효하지 않은 초대는 수락할 수 없어야 한다.

### FR-INVITE-006

이미 해당 가족의 구성원인 사용자를 중복으로 초대할 수 없어야 한다.

### FR-INVITE-007

가족 초대 권한은 OWNER에게만 허용한다.

---

# 4.4 Pet

### FR-PET-001

가족 구성원은 가족에 반려동물을 등록할 수 있어야 한다.

### FR-PET-002

반려동물은 최소한 다음 정보를 가질 수 있어야 한다.

* 이름
* 종
* 성별
* 생년월일 또는 나이
* 프로필 이미지
* 메모

### FR-PET-003

가족 구성원은 등록된 반려동물 정보를 조회할 수 있어야 한다.

### FR-PET-004

권한이 있는 사용자는 반려동물 정보를 수정할 수 있어야 한다.

### FR-PET-005

권한이 있는 사용자는 반려동물을 삭제할 수 있어야 한다.

### FR-PET-006

반려동물 정보는 해당 가족의 구성원만 접근할 수 있어야 한다.

---

# 4.5 Routine Category

반려동물마다 필요한 돌봄 항목이 다르므로 사용자가 자신의 반려동물에 맞는 루틴을 구성할 수 있어야 한다.

### FR-ROUTINE-001

사용자는 반려동물의 루틴 카테고리를 생성할 수 있어야 한다.

### FR-ROUTINE-002

사용자는 루틴 카테고리를 조회할 수 있어야 한다.

### FR-ROUTINE-003

사용자는 루틴 카테고리를 수정할 수 있어야 한다.

### FR-ROUTINE-004

사용자는 루틴 카테고리를 삭제할 수 있어야 한다.

### FR-ROUTINE-005

루틴 카테고리는 특정 반려동물에 귀속되어야 한다.

### 기본 카테고리 예시

```text
밥
약
배변
산책
목욕
```

단, 사용자가 원하는 카테고리를 추가할 수 있어야 한다.

---

# 4.6 Routine Subcategory

하나의 카테고리 안에서도 사용자의 상황에 따라 여러 종류의 돌봄이 필요할 수 있다.

### FR-SUB-001

사용자는 루틴 카테고리의 소분류를 생성할 수 있어야 한다.

### FR-SUB-002

사용자는 소분류를 조회할 수 있어야 한다.

### FR-SUB-003

사용자는 소분류를 수정할 수 있어야 한다.

### FR-SUB-004

사용자는 소분류를 삭제할 수 있어야 한다.

### FR-SUB-005

소분류는 하나의 루틴 카테고리에 귀속되어야 한다.

### 예시

```text
밥
├── 사료
└── 야채밥

약
├── 알러지약
└── 심장사상충약

배변
├── 똥
└── 오줌
```

### FR-SUB-006

소분류는 선택 사항이어야 한다.

즉, 사용자는 다음과 같이 사용할 수 있어야 한다.

```text
산책
```

또는

```text
약
└── 알러지약
```

---

# 4.7 Care Record

돌봄 기록은 서비스의 핵심 기능이다.

### FR-RECORD-001

가족 구성원은 반려동물의 돌봄 기록을 생성할 수 있어야 한다.

### FR-RECORD-002

돌봄 기록은 특정 반려동물에 귀속되어야 한다.

### FR-RECORD-003

돌봄 기록은 특정 루틴 카테고리에 귀속되어야 한다.

### FR-RECORD-004

돌봄 기록은 선택적으로 소분류를 가질 수 있어야 한다.

### FR-RECORD-005

돌봄 기록에는 작성자가 저장되어야 한다.

### FR-RECORD-006

돌봄 기록에는 기록 시간이 저장되어야 한다.

### FR-RECORD-007

돌봄 기록에는 사용자가 자유롭게 메모를 작성할 수 있어야 한다.

### FR-RECORD-008

가족 구성원은 해당 반려동물의 돌봄 기록을 조회할 수 있어야 한다.

### FR-RECORD-009

사용자는 자신의 돌봄 기록을 수정할 수 있어야 한다.

### FR-RECORD-010

사용자는 자신의 돌봄 기록을 삭제할 수 있어야 한다.

### FR-RECORD-011

OWNER는 가족의 돌봄 기록을 관리할 수 있어야 한다.

### 예시

```text
🐶 반려동물

오늘
────────────────
08:30
🍚 사료
작성자: 가족 구성원 A

12:10
💩 똥
작성자: 가족 구성원 B

20:00
💊 알러지약
메모: 저녁 식사 후 복용
작성자: 가족 구성원 A
────────────────
```

---

# 4.8 Health Note

MVP에서는 별도의 건강 기록 시스템을 구현하지 않는다.

### FR-HEALTH-001

사용자는 돌봄 기록의 메모를 통해 건강 관련 내용을 자유롭게 기록할 수 있어야 한다.

예:

```text
오늘 평소보다 식사량이 적음
```

```text
산책 중 다리를 조금 절었음
```

```text
약 복용 후 상태 확인 필요
```

향후 실제 요구사항이 발생할 경우 별도의 건강 기록 기능으로 확장할 수 있다.

---

# 4.9 Dashboard / Home

### FR-HOME-001

로그인한 사용자는 자신이 속한 가족의 주요 정보를 확인할 수 있어야 한다.

### FR-HOME-002

현재 가족의 반려동물을 확인할 수 있어야 한다.

### FR-HOME-003

최근 돌봄 기록을 확인할 수 있어야 한다.

### FR-HOME-004

사용자는 주요 돌봄 기록 기능에 빠르게 접근할 수 있어야 한다.

### UX 목표

홈 화면에서 사용자가 다음 질문에 빠르게 답을 얻을 수 있어야 한다.

> "오늘 우리 반려동물에게 무슨 일이 있었지?"

---

# 4.10 Responsive / Mobile UX

### FR-UX-001

서비스는 모바일 화면을 최우선으로 설계한다.

### FR-UX-002

주요 버튼은 충분한 크기로 제공한다.

### FR-UX-003

핵심 정보는 한눈에 파악할 수 있어야 한다.

### FR-UX-004

돌봄 기록 작성 과정은 가능한 적은 단계로 구성한다.

### FR-UX-005

텍스트와 아이콘의 의미가 명확해야 한다.

### FR-UX-006

부모님 등 디지털 서비스에 익숙하지 않은 사용자도 주요 기능을 쉽게 이해할 수 있어야 한다.

---

# 5. Authorization Requirements

모든 데이터 접근은 서버에서 가족 관계를 기준으로 검증한다.

### FR-AUTHZ-001

사용자는 자신이 속하지 않은 가족의 데이터에 접근할 수 없어야 한다.

### FR-AUTHZ-002

사용자는 다른 가족의 반려동물 정보를 조회할 수 없어야 한다.

### FR-AUTHZ-003

사용자는 다른 가족의 돌봄 기록을 조회할 수 없어야 한다.

### FR-AUTHZ-004

OWNER 전용 API는 MEMBER가 호출할 수 없어야 한다.

### FR-AUTHZ-005

인증되지 않은 사용자는 보호된 API를 호출할 수 없어야 한다.

### FR-AUTHZ-006

서버는 클라이언트에서 전달받은 가족 ID만 신뢰하여 권한을 판단해서는 안 된다.

Family Membership을 기준으로 실제 접근 권한을 검증한다.

---

# 6. Data Requirements

## User

사용자 계정 정보를 저장한다.

주요 정보:

* ID
* OAuth provider 정보
* 이름
* 프로필 이미지
* 생성일
* 수정일

---

## Family

가족 정보를 저장한다.

주요 정보:

* ID
* 이름
* 생성일
* 수정일

---

## FamilyMember

사용자와 가족의 관계를 저장한다.

주요 정보:

* ID
* User ID
* Family ID
* Role
* 생성일

Role:

```text
OWNER
MEMBER
```

---

## Pet

반려동물 정보를 저장한다.

주요 정보:

* ID
* Family ID
* 이름
* 종
* 성별
* 생년월일
* 프로필 이미지
* 메모
* 생성일
* 수정일

---

## RoutineCategory

반려동물의 돌봄 카테고리를 저장한다.

주요 정보:

* ID
* Pet ID
* 이름
* 정렬 순서
* 활성 상태
* 생성일
* 수정일

---

## RoutineSubcategory

루틴 카테고리의 소분류를 저장한다.

주요 정보:

* ID
* RoutineCategory ID
* 이름
* 정렬 순서
* 활성 상태
* 생성일
* 수정일

---

## CareRecord

반려동물의 실제 돌봄 기록을 저장한다.

주요 정보:

* ID
* Pet ID
* RoutineCategory ID
* RoutineSubcategory ID
* 작성자 User ID
* 기록 시간
* 메모
* 생성일
* 수정일

---

# 7. API Requirements

Backend는 REST API를 제공한다.

### 기본 원칙

* Resource 중심 URL
* HTTP Method에 따른 CRUD
* JSON 기반 Request / Response
* 적절한 HTTP Status Code
* DTO를 통한 Request Validation
* 인증 및 권한 검증
* 일관된 Error Response

### 예상 Resource

```text
/auth
/families
/families/:familyId/members
/families/:familyId/invitations
/pets
/pets/:petId/routines
/pets/:petId/routines/:routineId/subcategories
/pets/:petId/records
```

실제 API URL과 Request / Response Schema는 API 설계 단계에서 확정한다.

---

# 8. Error Handling Requirements

### NFR-ERROR-001

존재하지 않는 Resource 요청에 대해 적절한 HTTP Status Code를 반환한다.

### NFR-ERROR-002

인증되지 않은 요청은 적절한 인증 오류를 반환한다.

### NFR-ERROR-003

권한이 없는 요청은 접근 거부 응답을 반환한다.

### NFR-ERROR-004

잘못된 Request Body에 대해 Validation 오류를 반환한다.

### NFR-ERROR-005

서버 내부 오류가 발생했을 때 민감한 내부 정보를 클라이언트에 노출하지 않는다.

---

# 9. Security Requirements

### NFR-SEC-001

가족 단위 데이터 접근 권한을 서버에서 검증한다.

### NFR-SEC-002

인증 관련 Secret 및 API Key를 Repository에 직접 저장하지 않는다.

### NFR-SEC-003

환경 변수 및 Secret을 사용하여 민감한 설정을 관리한다.

### NFR-SEC-004

클라이언트가 전달한 User ID나 Family ID만으로 권한을 판단하지 않는다.

### NFR-SEC-005

인증 및 권한이 필요한 API를 보호한다.

---

# 10. Performance Requirements

MVP 단계에서는 과도한 성능 최적화보다 **안정적인 구조와 적절한 응답 속도**를 우선한다.

### NFR-PERF-001

일반적인 CRUD 요청은 불필요한 DB Query를 최소화한다.

### NFR-PERF-002

목록 조회 시 필요한 데이터만 조회한다.

### NFR-PERF-003

필요한 관계 데이터에 적절한 DB Index를 적용한다.

### NFR-PERF-004

성능 문제가 실제로 확인될 경우 Redis Cache 도입을 검토한다.

---

# 11. Infrastructure Requirements

### NFR-INFRA-001

개발 환경은 Docker를 활용할 수 있도록 구성한다.

### NFR-INFRA-002

PostgreSQL 개발 환경을 일관되게 구성할 수 있어야 한다.

### NFR-INFRA-003

Backend는 AWS 환경에 배포할 수 있도록 구성한다.

### NFR-INFRA-004

Frontend와 Backend의 배포 환경을 독립적으로 관리할 수 있어야 한다.

---

# 12. CI/CD Requirements

### NFR-CICD-001

GitHub Actions를 사용하여 CI/CD 환경을 구성한다.

### NFR-CICD-002

Pull Request 또는 Push 시 기본적인 검사 작업을 수행할 수 있어야 한다.

예:

```text
Lint
Type Check
Test
Build
```

### NFR-CICD-003

배포 환경의 Secret은 GitHub Repository에 직접 노출하지 않는다.

---

# 13. MVP Exclusions

MVP에서는 다음 기능을 구현하지 않는다.

### Authentication

* 이메일 / 비밀번호 로그인
* 비밀번호 찾기
* 이메일 인증

### Pet / Health

* 전문적인 건강 기록 시스템
* 병원 진료 기록
* 예방접종 관리
* 체중 변화 통계
* 의료 데이터 분석

### Record

* 장기간의 고급 통계
* 복잡한 검색 시스템
* 유료 기록 보관
* 기록 데이터 Export

### Family

* 다중 OWNER
* 복잡한 역할 체계
* 대규모 가족 관리
* 가족 단위 유료 플랜

### Monetization

* 결제
* 구독
* 프리미엄 기능
* 광고 관리 시스템

### Infrastructure

* Redis
* Queue

Redis와 Queue는 실제 필요성이 확인된 경우에만 추가한다.

---

# 14. Priority

## P0 · Must Have

서비스가 동작하기 위해 반드시 필요한 기능.

* Google / Kakao 로그인
* User
* Family
* Family Membership
* OWNER / MEMBER
* Family Invitation
* Pet CRUD
* Routine Category CRUD
* Routine Subcategory CRUD
* Care Record CRUD
* Authorization
* Mobile UX

## P1 · Should Have

MVP의 완성도를 높이는 기능.

* 메모
* 최근 기록
* 정렬
* 적절한 Error Handling
* Validation
* 테스트
* Docker
* CI/CD
* AWS 배포

## P2 · Later

MVP 이후 검토.

* Redis
* Queue
* 광고
* 고급 통계
* 건강 기록 확장
* 기록 검색
* 데이터 Export

---

# 15. Acceptance Criteria

MVP는 다음 시나리오를 모두 통과해야 한다.

## Scenario 01 · 회원가입 / 로그인

```text
사용자
 ↓
Google 또는 Kakao 로그인
 ↓
서비스 User 생성 / 조회
 ↓
로그인 완료
```

---

## Scenario 02 · 가족 생성

```text
로그인
 ↓
가족 생성
 ↓
생성자는 OWNER
 ↓
가족 생성 완료
```

---

## Scenario 03 · 가족 초대

```text
OWNER
 ↓
가족 초대
 ↓
초대 대상 사용자
 ↓
초대 수락
 ↓
MEMBER 등록
```

---

## Scenario 04 · 반려동물 등록

```text
가족 구성원
 ↓
반려동물 등록
 ↓
Pet 생성
 ↓
가족 구성원에게 표시
```

---

## Scenario 05 · 루틴 설정

```text
반려동물
 ↓
밥
 ├── 사료
 └── 야채밥

약
 ├── 알러지약
 └── 심장사상충약
```

사용자는 자신의 반려동물에 맞게 카테고리와 소분류를 추가 / 수정 / 삭제할 수 있어야 한다.

---

## Scenario 06 · 돌봄 기록

```text
가족 구성원
 ↓
반려동물 선택
 ↓
루틴 선택
 ↓
소분류 선택
 ↓
메모 입력
 ↓
기록 저장
 ↓
작성자 + 기록 시간 저장
```

소분류가 없는 루틴도 기록할 수 있어야 한다.

---

## Scenario 07 · 권한

```text
Family A

OWNER ─────┐
           ├── Pet A ── Records
MEMBER ────┘
```

Family B의 사용자는 Family A의 Pet이나 Record에 접근할 수 없어야 한다.

---

# 16. Definition of Done

기능은 단순히 코드가 작성된 상태가 아니라 다음 조건을 만족해야 완료로 판단한다.

### 기능

* 정상적인 사용자 흐름이 동작한다.
* 정상적인 CRUD가 동작한다.
* 권한 검증이 적용되어 있다.
* Validation이 적용되어 있다.
* Error Handling이 되어 있다.

### Code

* TypeScript 타입 오류가 없다.
* Lint 오류가 없다.
* 불필요한 중복 코드가 최소화되어 있다.
* 적절한 책임으로 Module / Controller / Service가 분리되어 있다.

### UX

* 모바일 화면에서 정상적으로 사용할 수 있다.
* 주요 버튼과 텍스트가 충분히 크다.
* 사용자가 현재 상태를 쉽게 이해할 수 있다.
* 핵심 기능까지 불필요한 단계가 많지 않다.

### Documentation

* 중요한 기술적 결정이 기록되어 있다.
* API 변경사항이 필요한 경우 문서에 반영한다.
* 개발 과정의 주요 판단은 Journal에 기록한다.

---

# 17. Requirement Change Policy

개발 중 요구사항 변경이 필요한 경우 다음 순서로 판단한다.

```text
변경 필요성 확인
      ↓
MVP에 필요한가?
      ↓
Yes ──→ 기존 기능에 미치는 영향 확인
      │
      ↓
설계 변경
      │
      ↓
requirements.md 업데이트
      │
      ↓
journal에 변경 이유 기록
```

단순히 기술적으로 구현할 수 있다는 이유만으로 기능을 추가하지 않는다.

**실제 사용자에게 필요한 기능인지 먼저 판단한다.**

---

# Final Requirement

Pet Routine Manager의 MVP는 다음 질문에 답할 수 있어야 한다.

> **"우리 가족이 이 반려동물에게 마지막으로 무엇을 했는지, 누가 했는지 쉽게 알 수 있는가?"**

이 질문에 명확하게 답할 수 있는 서비스를 만드는 것을 MVP의 가장 중요한 요구사항으로 한다.
