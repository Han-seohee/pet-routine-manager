# Day 02

**Date:** 2026-08-11

## Context

Frontend와 Backend를 분리한 현재 프로젝트에서 실제 기능 개발을 시작하기 전에 두 애플리케이션이 독립적으로 실행되고 통신할 수 있는 기본 개발 환경을 구성했다.

Frontend는 Next.js 기반으로 Backend API를 호출할 수 있는 구조를 준비하고, Backend는 NestJS 기반으로 환경 변수, CORS, Health Check를 구성했다.

또한 앞으로 User, Family, Pet, Routine 등의 기능이 추가될 것을 고려해 NestJS의 Feature Module 구조를 적용했다.

## Decision

### 1. Frontend / Backend 환경변수 분리

Frontend와 Backend의 실행 환경을 각각 관리할 수 있도록 `.env.example`과 로컬 환경변수를 분리했다.

실제 환경변수 파일은 Git에 포함하지 않고, `.env.example`을 통해 필요한 환경변수의 형태만 공유하도록 구성했다.

Frontend:

* `NEXT_PUBLIC_API_BASE_URL`

Backend:

* `PORT`

### 2. Backend 기본 설정

NestJS의 `ConfigModule`을 전역으로 등록해 환경변수를 관리하도록 했다.

Frontend와 Backend가 서로 다른 포트에서 실행되므로 Backend에 CORS를 설정하고, 개발 환경에서 Frontend의 요청을 허용하도록 했다.

### 3. Health Check

Backend의 정상 실행 여부를 확인할 수 있도록 `GET /health` 엔드포인트를 추가했다.

Health Check는 별도의 Service가 필요할 정도로 복잡한 기능이 아니므로 Controller만 사용하는 구조로 구성했다.

### 4. Feature Module 구조

NestJS의 `AppModule`은 전체 애플리케이션의 Feature Module을 조립하는 역할로 유지하고, 실제 기능은 각각 독립적인 Module로 분리하기로 했다.

앞으로 다음과 같은 구조로 확장할 수 있도록 기반을 잡았다.

* HealthModule
* FamilyModule
* PetModule
* RoutineModule

각 기능은 필요에 따라 Controller와 Service를 함께 구성한다.

### 5. Frontend API Client

Frontend에서 Backend API를 호출할 때마다 직접 URL과 요청 처리를 작성하지 않도록 공통 `apiClient`를 구성했다.

Backend URL은 환경변수에서 가져오며, GET, POST, PUT, PATCH, DELETE 요청을 지원하도록 기본 구조를 마련했다.

## Outcome

Frontend와 Backend가 각각 독립적으로 실행되고 정상적으로 통신하는 것을 확인했다.

Frontend:

* Next.js 16
* `NEXT_PUBLIC_API_BASE_URL` 기반 API 설정
* 공통 API Client 구성

Backend:

* NestJS 11
* ConfigModule 적용
* CORS 설정
* `GET /health` 구현
* HealthModule 분리
* 환경변수 기반 PORT 설정

Frontend에서 Backend의 Health Check API를 호출해 다음 응답을 정상적으로 확인했다.

```json
{
  "status": "ok"
}
```

TypeScript 컴파일과 테스트도 정상적으로 통과했다.

Frontend와 Backend의 변경사항은 각각 의미에 따라 커밋을 나누어 GitHub에 Push했다.

## Next

다음 단계부터 실제 서비스 기능 개발을 시작한다.

우선 인증과 가족 권한 구조를 구현하기 전에 User, Family, OWNER 권한의 관계와 데이터 구조를 구체화한다.

이후 PostgreSQL과 Prisma를 연결하고 실제 인증 및 가족 공동 양육 기능을 구현한다.
