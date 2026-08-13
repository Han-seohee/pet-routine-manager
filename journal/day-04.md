# Day 04 · PostgreSQL + Prisma DB 환경 구축

**Date:** 2026-08-13

## Context

Day03에서 인증과 가족 권한에 필요한 데이터 모델을 확정했다.

이번 단계에서는 설계한 User, Family, FamilyMember를 실제 데이터베이스에 저장할 수 있도록 PostgreSQL과 Prisma 환경을 구축하고, NestJS Backend와 연결하는 것을 목표로 했다.

작업을 시작했을 때는 PostgreSQL과 Prisma가 모두 설치되어 있지 않았고, 로컬 DB도 존재하지 않는 상태였다.

또한 Prisma 7을 처음 사용하기 때문에 Prisma가 정확히 어떤 역할을 하는지부터 확인하면서 진행했다.

## Decision

### 1. PostgreSQL을 로컬 데이터베이스로 사용

이번 프로젝트에서는 PostgreSQL을 데이터 저장소로 사용하기로 했다.

Homebrew를 이용해 PostgreSQL 17을 설치하고 로컬 서버를 실행했다.

이후 프로젝트 전용 DB인 `pet_routine_manager`를 생성했다.

DB 서버가 정상적으로 실행되고 있는지는 `pg_isready`를 이용해 확인했다.

결과:

```
/tmp:5432 - 접속을 받아들이는 중
```

이를 통해 PostgreSQL이 로컬 5432 포트에서 정상적으로 실행되고 있음을 확인했다.

### 2. Prisma를 ORM으로 사용

Prisma는 애플리케이션에서 데이터베이스를 다루기 쉽게 해주는 ORM이다.

직접 SQL만 작성하는 대신 Prisma Schema를 통해 데이터 모델을 정의하고, Prisma Client를 이용해 TypeScript 코드에서 데이터베이스를 다룰 수 있다.

이번 프로젝트에서는 Prisma를 다음과 같은 역할로 사용한다.

```
Schema (schema.prisma)
    ↓
Migration (Prisma Migration)
    ↓
Database (PostgreSQL)
```

그리고 실제 NestJS 애플리케이션에서는 다음과 같이 사용한다.

```
NestJS
    ↓
Prisma Client
    ↓
PostgreSQL
```

즉, Prisma는 PostgreSQL을 대신하는 데이터베이스가 아니라 NestJS 애플리케이션과 PostgreSQL 사이에서 데이터 모델과 DB 접근을 연결해주는 역할을 한다.

### 3. Day03의 데이터 모델을 실제 Schema로 반영

Day03에서 확정했던 데이터 모델을 그대로 Prisma Schema에 반영했다.

주요 모델은 다음과 같다.

* User
* Family
* FamilyMember

User와 Family를 직접 연결하지 않고 FamilyMember를 중간 엔티티로 사용하는 구조도 그대로 유지했다.

관계는 다음과 같다.

```
User 1 ─── N FamilyMember N ─── 1 Family
```

또한 다음 제약 조건을 적용했다.

* `(provider, providerId)` unique
* `(userId, familyId)` unique
* `OWNER` / `MEMBER` 역할을 FamilyMember에 저장
* 가족당 OWNER는 한 명

특히 가족당 OWNER 한 명이라는 규칙은 Prisma Schema만으로 표현하기 어려워 PostgreSQL의 partial unique index를 별도 migration으로 추가했다.

이를 통해 애플리케이션 코드에 문제가 발생하더라도 데이터베이스에서 하나의 가족에 OWNER가 두 명 생성되는 것을 방지할 수 있다.

### 4. Prisma 7의 설정 방식에 맞춰 환경 구성

Prisma 7에서는 데이터베이스 연결 URL을 `schema.prisma`가 아닌 `prisma.config.ts`에서 관리하는 방식으로 변경되었다.

`.env`에는 실제 로컬 PostgreSQL 연결 정보를 저장하고, `prisma.config.ts`에서 `DATABASE_URL`을 읽도록 구성했다.

또한 Prisma CLI에서 `.env`를 정상적으로 사용할 수 있도록 `dotenv`를 명시적인 devDependency로 추가했다.

로컬 개발 환경에서는 다음 PostgreSQL 데이터베이스를 사용한다.

* Host: `localhost`
* Port: `5432`
* Database: `pet_routine_manager`

### 5. Migration을 통해 설계를 실제 DB에 반영

Prisma Schema에 모델을 정의하는 것만으로는 PostgreSQL에 실제 테이블이 생성되지 않는다.

따라서 Prisma Migration을 이용해 Schema의 변경사항을 실제 데이터베이스에 반영했다.

첫 번째 migration에서는 다음을 생성했다.

* User
* Family
* FamilyMember
* AuthProvider
* FamilyRole
* Foreign Key
* Unique Constraint

두 번째 migration에서는 가족당 OWNER 한 명을 보장하는 PostgreSQL partial unique index를 추가했다.

실제로 같은 가족에 OWNER를 두 명 생성하는 상황을 테스트했고, PostgreSQL에서 중복 OWNER 생성을 차단하는 것을 확인했다.

이 제약은 애플리케이션 로직이 아닌 데이터베이스 레벨에서 보장된다.

### 6. Prisma Client를 NestJS에 연결

데이터베이스와 Prisma가 연결된 이후에는 실제 NestJS 애플리케이션에서도 Prisma를 사용할 수 있도록 구성했다.

이를 위해 `PrismaService`와 `PrismaModule`을 생성했다.

PrismaService는 다음 역할을 담당한다.

* 환경 변수에서 `DATABASE_URL`을 읽는다.
* PostgreSQL 연결 Pool을 생성한다.
* Prisma Client를 초기화한다.
* 애플리케이션 시작 시 DB 연결을 확인한다.
* 애플리케이션 종료 시 DB 연결을 정리한다.
* DB 연결 상태를 확인할 수 있는 `pingDatabase()`를 제공한다.

PrismaModule은 전역 모듈로 구성하여 다른 NestJS 모듈에서도 PrismaService를 사용할 수 있도록 했다.

Prisma 7에서는 PostgreSQL driver adapter를 사용하는 방식으로 구성했다.

```
pg
    ↓
PrismaPg
    ↓
PrismaClient
    ↓
PostgreSQL
```

또한 `GET /health/db` endpoint를 추가하여 NestJS 애플리케이션에서 실제 데이터베이스 연결 상태를 확인할 수 있도록 했다.

## Outcome

오늘 작업을 통해 Day03에서 설계했던 데이터 모델을 실제 PostgreSQL 데이터베이스로 구현했다.

현재 데이터베이스 구조는 다음과 같다.

```
PostgreSQL
└── pet_routine_manager
    ├── User
    ├── Family
    ├── FamilyMember
    └── _prisma_migrations
```

Prisma Migration을 통해 DB Schema가 정상적으로 반영되었고, 가족당 OWNER가 한 명만 존재하도록 PostgreSQL 레벨의 제약도 적용했다.

또한 Prisma Client를 NestJS에 연결하고 실제 DB 연결을 확인했다.

`GET /health/db` 요청을 통해 PostgreSQL에 `SELECT 1`을 실행하고 정상 응답을 확인했다.

응답 결과:

```json
{
  "status": "ok",
  "database": "connected"
}
```

빌드와 테스트도 정상적으로 통과했다.

* Build: ✅
* Unit Test: ✅
* E2E Test: ✅
* Prisma Validate: ✅
* Migration: ✅
* DB Connection: ✅

Day03에서 문서로만 존재했던 User / Family / FamilyMember 데이터 모델이 실제 PostgreSQL 데이터베이스와 NestJS 애플리케이션에서 사용할 수 있는 구조로 연결되었다.

## Next

다음 단계에서는 지금까지 구축한 DB와 Prisma 위에 실제 인증 기능을 구현한다.

먼저 AuthModule을 구성하고 Google과 Kakao OAuth 로그인 흐름을 구현할 예정이다.

목표 흐름은 다음과 같다.

```
Google / Kakao 로그인
    ↓
Provider 인증
    ↓
User 조회 또는 생성
    ↓
Backend JWT 발급
    ↓
API 요청
    ↓
JWT로 User 식별
    ↓
FamilyMember.role로 권한 확인
```

Day04에서는 DB와 Prisma 연결에 집중했기 때문에 아직 OAuth와 JWT 구현은 진행하지 않았다.

다음 단계부터는 실제 로그인 과정과 인증·인가 로직을 구현한다.
