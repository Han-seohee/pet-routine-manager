# Day 03

**Date:** 2026-08-12

## Context

Google/Kakao 소셜 로그인의 인증 흐름과 가족 권한 구조를 구체적으로 설계했다.
실제 OAuth나 DB 구현에 들어가기 전에 Authentication과 Authorization을 분리하고, User / Family / FamilyMember의 관계를 먼저 확정했다.

## Decision

* Google/Kakao 로그인은 OAuth 2.0 Authorization Code Flow를 사용한다.
* OAuth Provider와의 code 교환과 사용자 정보 조회는 Backend에서 처리한다.
* Provider의 Access Token과 별개로 서비스 자체 JWT를 발급한다.
* JWT의 `sub`에는 Backend의 `User.id`를 사용한다.
* Authentication은 JWT로 사용자를 식별하고, Authorization은 `FamilyMember.role`을 기준으로 판단한다.
* User와 Family는 N:M 관계이므로 `FamilyMember`를 중간 엔티티로 사용한다.
* `OWNER / MEMBER` 역할은 User가 아닌 FamilyMember에 둔다.
* 동일한 User가 같은 Family에 중복 가입하지 않도록 `(userId, familyId)`를 unique로 설정한다.
* 동일한 Provider 계정이 여러 User로 생성되지 않도록 `(provider, providerId)`를 unique로 설정한다.
* 가족당 OWNER 1명은 PostgreSQL의 partial unique index로 보장하는 방향으로 정했다.
* DB는 여러 Family를 지원할 수 있도록 설계하되, MVP에서는 현재 가족 하나를 중심으로 단순하게 구성한다.
* 실제 OAuth, Prisma, PostgreSQL 구현은 다음 단계로 미룬다.

## Outcome

인증과 권한의 전체 흐름을 확정했고, User / Family / FamilyMember의 관계와 역할 관리 방식을 결정했다.
다음 단계에서 Prisma와 PostgreSQL을 연결할 때 사용할 데이터 모델의 기준도 정리했다.

## Next

Prisma와 PostgreSQL을 연결하고, 오늘 확정한 User / Family / FamilyMember 구조를 실제 데이터베이스 스키마로 구현한다.
