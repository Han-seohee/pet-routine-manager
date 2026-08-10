# 🐶 Pet Routine Manager

> 가족이 함께 반려동물의 일상을 기록하고 관리하는 공동 양육 서비스

---

## 1. 문제 정의

여러 명이 하나의 반려동물을 함께 키우는 가정에서는 돌봄 정보가 각자의 기억이나 메신저 대화에 흩어지기 쉽다.

특히 식사, 약, 배변처럼 반복적으로 발생하는 돌봄은 다음과 같은 상황을 만들 수 있다.

* "밥 줬어?"
* "약 먹였어?"
* "오늘 산책했어?"
* "누가 마지막으로 돌봤지?"
* "내가 한 건 가족들도 알고 있나?"

Pet Routine Manager는 이러한 문제를 해결하기 위해 **반려동물의 돌봄 정보를 가족이 하나의 공간에서 공유하고 확인할 수 있도록 하는 것**을 목표로 한다.

### 핵심 문제

1. 가족 간 돌봄 여부를 실시간으로 공유하기 어렵다.
2. 반복적인 돌봄이 중복되거나 누락될 수 있다.
3. 돌봄 기록이 개인의 기억이나 메신저에 의존한다.
4. 반려동물마다 필요한 돌봄 항목이 다르다.
5. 다양한 연령대의 가족 구성원이 쉽게 사용할 수 있는 서비스가 필요하다.

---

# 2. 타겟 사용자

## Primary Target

### 가족 공동 양육자

부모, 형제, 배우자 등 여러 명이 하나의 반려동물을 함께 키우는 가정.

예를 들어 하나의 가정에서 여러 구성원이 동일한 반려동물의 식사, 약, 배변, 산책 등을 나누어 관리하는 상황을 주요 사용 사례로 한다.

### 핵심 사용자 특성

* 하나의 반려동물을 여러 명이 함께 돌본다.
* 가족 구성원마다 돌봄 시간이 다르다.
* 돌봄 여부를 서로 확인할 필요가 있다.
* 스마트폰을 주된 사용 기기로 활용한다.
* 부모님 등 디지털 서비스에 익숙하지 않은 사용자도 포함될 수 있다.

---

# 3. MVP에서 꼭 필요한 기능

MVP의 핵심은 **가족이 하나의 반려동물에 대한 돌봄 기록을 함께 관리하는 것**이다.

### Authentication

* Google 로그인
* Kakao 로그인
* 로그아웃

이메일 / 비밀번호 로그인은 MVP에서 제공하지 않는다.

### Family

* 가족 생성
* 가족 초대
* 초대 수락
* 가족 구성원 조회
* 가족 탈퇴
* 가족 삭제

### Family Permission

* OWNER
* MEMBER

하나의 가족에는 OWNER가 1명만 존재한다.

### Pet

* 반려동물 등록
* 반려동물 조회
* 반려동물 수정
* 반려동물 삭제

### Routine

기본 카테고리를 제공하되 사용자가 자신의 반려동물에 맞게 구성할 수 있도록 한다.

예:

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

### Record

* 돌봄 기록 생성
* 돌봄 기록 조회
* 돌봄 기록 수정
* 돌봄 기록 삭제
* 기록 작성자 표시
* 기록 시간 표시
* 메모 작성

건강 기록을 별도의 복잡한 시스템으로 만들지 않고 **돌봄 기록의 메모 기능을 활용**한다.

---

# 4. 스마트폰 중심 UX

서비스의 주요 사용 환경은 스마트폰이다.

따라서 Desktop보다 **Mobile First**를 우선하여 설계한다.

### UX 원칙

#### 크게

버튼, 텍스트, 주요 정보를 충분히 크게 표시한다.

#### 직관적으로

사용자가 별도의 설명을 읽지 않아도 주요 기능을 이해할 수 있도록 한다.

#### 빠르게

돌봄 기록을 최소한의 터치로 완료할 수 있도록 한다.

#### 명확하게

오늘의 돌봄 상태와 최근 기록을 한눈에 파악할 수 있도록 한다.

#### 접근성 있게

부모님을 포함한 다양한 연령대가 사용할 수 있도록 작은 글씨, 작은 버튼, 복잡한 인터랙션을 지양한다.

---

# 5. 디자인 방향

## Cute + Clean + Friendly

반려동물 서비스의 친근함을 살리되 지나치게 유아적인 디자인은 지양한다.

### Visual Direction

* 둥근 UI
* 큼직한 카드
* 큼직한 버튼
* 직관적인 아이콘
* 적절한 이모지
* 부드러운 색상
* 명확한 상태 표현
* 모바일 중심 레이아웃

### Design Principle

> 예쁜 것보다 먼저 쉽게 사용할 수 있어야 한다.

특히 부모님도 쉽게 사용할 수 있도록 **크고 단순하고 명확한 UI**를 우선한다.

---

# 6. Frontend / Backend Architecture

Frontend와 Backend는 **별도의 Repository**로 관리한다.

```text
GitHub
│
├── pet-routine-manager
│   └── Next.js Frontend
│
└── pet-routine-manager-backend
    └── NestJS Backend
```

### Application Architecture

```text
┌─────────────────────────┐
│        Next.js          │
│        Frontend         │
└────────────┬────────────┘
             │
             │ REST API
             ▼
┌─────────────────────────┐
│         NestJS          │
│         Backend         │
└────────────┬────────────┘
             │
             │ Prisma
             ▼
┌─────────────────────────┐
│       PostgreSQL        │
└─────────────────────────┘
```

Backend는 필요한 경우 Redis와 Queue를 사용할 수 있도록 설계하되, 실제 요구사항이 발생하지 않는다면 억지로 도입하지 않는다.

---

# 7. Database

관계형 데이터베이스인 PostgreSQL을 사용한다.

ORM은 Prisma를 사용한다.

### 핵심 데이터 관계

```text
User
 │
 ├── FamilyMember
 │       │
 │       └── Family
 │              │
 │              └── Pet
 │                    │
 │                    ├── Routine
 │                    │     └── Subcategory
 │                    │
 │                    └── Record
 │
 └── Record
```

### 주요 Entity

* User
* Family
* FamilyMember
* Pet
* RoutineCategory
* RoutineSubcategory
* CareRecord

실제 DB 설계 과정에서 각 Entity의 필드와 관계를 구체화한다.

---

# 8. 인증과 가족 권한

## Authentication

OAuth 기반 인증을 사용한다.

지원 로그인:

* Google
* Kakao

이메일 / 비밀번호 인증은 구현하지 않는다.

### Authentication Flow

```text
Google / Kakao
      ↓
   Auth.js
      ↓
    User
      ↓
 Family Membership
```

---

## Authorization

인증된 사용자가 어떤 가족의 데이터에 접근할 수 있는지를 서버에서 검증한다.

```text
User
 ↓
FamilyMember
 ↓
Family
 ↓
Pet
 ↓
Routine / Record
```

다른 가족의 반려동물이나 기록에는 접근할 수 없어야 한다.

---

## Family Role

### OWNER

가족당 1명.

주요 권한:

* 가족 관리
* 가족 초대
* 가족 구성원 관리
* 반려동물 관리
* 가족 삭제

### MEMBER

공동 양육자로 참여.

주요 권한:

* 가족 정보 조회
* 반려동물 조회
* 루틴 조회
* 돌봄 기록 생성
* 돌봄 기록 조회
* 자신의 기록 수정 / 삭제
* 가족 탈퇴

세부 권한은 API 및 DB 설계 단계에서 구체화한다.

---

# 9. 기술 스택

## Frontend

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui

## Backend

* NestJS
* TypeScript
* REST API

## Authentication

* Auth.js
* Google OAuth
* Kakao OAuth

## Database

* PostgreSQL
* Prisma

## Infrastructure

* Docker
* AWS

## CI/CD

* GitHub Actions

## 필요 시 도입

* Redis
* Queue

### 기술 도입 원칙

> 포트폴리오를 위해 기술을 억지로 사용하는 것이 아니라, 실제 요구사항과 문제를 기준으로 기술을 선택한다.

---

# 10. 수익화 가능성

MVP에서는 수익화를 핵심 목표로 삼지 않는다.

특히 다음 기능은 초기 버전에 포함하지 않는다.

* 결제
* 구독
* 프리미엄 플랜
* 유료 기록 보관
* 가족 확장 상품
* 고급 통계

전체 기록을 장기간 보관하는 기능 역시 초기에는 서비스 운영 비용을 고려하여 최소한으로 설계한다.

### 향후 수익화 방향

가장 현실적인 초기 수익화 방식으로 **작은 광고 배너**를 고려한다.

* 상단 또는 하단의 작은 배너
* 핵심 기능 사용을 방해하지 않는 위치
* 기록 작성과 같은 주요 행동을 방해하지 않도록 구성

광고 시스템 자체는 MVP 개발 범위에 포함하지 않고, 서비스 완성 후 필요성을 검토한다.

---

# 11. 포트폴리오에서 보여줄 기술적 포인트

이 서비스는 실제 사용 가능한 서비스를 구축하면서 다음과 같은 개발 역량을 보여주는 것을 목표로 한다.

### 1. Frontend / Backend 분리

Next.js와 NestJS를 별도 Repository로 구성하고 REST API를 통해 통신한다.

### 2. OAuth Authentication

Google과 Kakao OAuth 기반 인증을 구현한다.

### 3. Authorization

FamilyMember 관계를 기반으로 가족 단위 접근 권한을 구현한다.

### 4. Relational Database

PostgreSQL과 Prisma를 사용하여 가족, 사용자, 반려동물, 루틴, 기록의 관계를 설계한다.

### 5. CRUD

가족, 반려동물, 루틴, 소분류, 돌봄 기록에 대한 CRUD를 구현한다.

### 6. Backend Architecture

NestJS의 Module, Controller, Service, Guard, Middleware, DTO Validation 등을 역할에 맞게 사용한다.

### 7. Real User UX

부모님을 포함한 다양한 연령대가 실제로 사용할 수 있는 모바일 중심 UX를 구현한다.

### 8. Infrastructure

Docker와 AWS를 활용하여 개발 및 배포 환경을 구성한다.

### 9. CI/CD

GitHub Actions를 활용하여 테스트 및 배포 자동화를 구성한다.

### 10. Technical Decision Making

필요한 기술과 불필요한 기술을 구분하고, 실제 요구사항을 기준으로 기술 도입 여부를 결정한다.

---

# 12. 개발 일정

총 4주, 20일을 기본 일정으로 한다.

## Week 1 · Foundation

| Day    | 목표                            |
| ------ | ----------------------------- |
| Day 01 | 프로젝트 초기화 / 요구사항 / 킥오프         |
| Day 02 | Frontend / Backend 개발환경 구성    |
| Day 03 | PostgreSQL / Prisma / DB 설계   |
| Day 04 | NestJS 기본 구조 / REST API 기반 구성 |
| Day 05 | Google / Kakao OAuth          |

## Week 2 · Core Backend

| Day    | 목표                             |
| ------ | ------------------------------ |
| Day 06 | Family                         |
| Day 07 | Family Invitation / Permission |
| Day 08 | Pet CRUD                       |
| Day 09 | Routine / Subcategory          |
| Day 10 | Care Record                    |

## Week 3 · Frontend

| Day    | 목표                  |
| ------ | ------------------- |
| Day 11 | 공통 UI / Layout      |
| Day 12 | Home                |
| Day 13 | Routine / Record UI |
| Day 14 | Family UI           |
| Day 15 | Pet / Settings UI   |

## Week 4 · Integration & Deploy

| Day    | 목표                                 |
| ------ | ---------------------------------- |
| Day 16 | Frontend / Backend 통합              |
| Day 17 | Error Handling / Validation / Test |
| Day 18 | Redis / Queue 도입 필요성 검토            |
| Day 19 | Docker / AWS / CI/CD               |
| Day 20 | QA / Documentation / Portfolio 정리  |

일정이 지연될 경우 MVP 핵심 기능을 우선한다.

Redis, Queue, 광고 등의 부가 요소는 핵심 기능 완성 이후 검토한다.

---

# MVP Success Criteria

다음의 핵심 사용자 흐름이 실제 환경에서 정상적으로 동작하는 것을 MVP 완성 기준으로 한다.

```text
Google / Kakao 로그인
        ↓
가족 생성
        ↓
반려동물 등록
        ↓
가족 구성원 초대
        ↓
초대 수락
        ↓
루틴 / 소분류 설정
        ↓
돌봄 기록 작성
        ↓
가족 구성원과 기록 공유
        ↓
권한에 따른 데이터 접근 및 수정
```

---

# Development Principles

### 01. 실제 사용자를 기준으로 개발한다.

실제로 가족이 반려동물을 함께 돌보는 상황을 기준으로 기능을 설계한다.

### 02. MVP를 우선한다.

핵심 기능을 먼저 완성하고 부가 기능은 후순위로 둔다.

### 03. 필요하지 않은 기술을 억지로 사용하지 않는다.

기술 자체보다 문제 해결과 서비스 완성도를 우선한다.

### 04. 모바일 UX를 최우선으로 한다.

스마트폰에서 빠르고 직관적으로 사용할 수 있어야 한다.

### 05. 부모님도 사용할 수 있어야 한다.

작고 복잡한 UI보다 크고 명확한 UI를 우선한다.

### 06. 가족 데이터의 권한을 중요하게 다룬다.

가족 단위 데이터가 다른 사용자에게 노출되지 않도록 서버에서 접근 권한을 검증한다.

### 07. 변경 이유를 기록한다.

개발 과정에서 요구사항이나 기술적 결정이 변경될 경우 변경 이유를 기록한다.

### 08. 실제 서비스처럼 완성한다.

단순한 CRUD 데모가 아니라 인증, 권한, 데이터 관리, 오류 처리, 배포까지 고려하여 실제 사용 가능한 서비스를 만드는 것을 목표로 한다.

---

# Final Goal

> **가족이 실제로 사용할 수 있는 반려동물 공동 양육 서비스를 만들고, Frontend부터 Backend, Database, Authentication, Authorization, Infrastructure, CI/CD까지 하나의 서비스가 완성되는 전체 과정을 구현한다.**
