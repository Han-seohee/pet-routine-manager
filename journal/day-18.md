# Day 18. Frontend 인증 연동 및 하루멍냥 서비스 브랜딩 구축

**Date:** 2026-09-08

## Context

Frontend에서 Google/Kakao OAuth 로그인을 실제 서비스 흐름과 연결하고, 로그인 상태를 안전하게 유지할 수 있는 인증 구조를 구축했다.

기존 Backend OAuth 흐름은 provider 인증 후 JWT를 발급하는 방식이었지만, JWT가 URL에 노출될 가능성을 줄이고 브라우저에서 직접 접근할 수 없도록 인증 구조를 개선할 필요가 있었다.

또한 프로젝트의 사용자-facing 서비스명을 기존 `Pet Routine Manager`에서 **하루멍냥**으로 변경했다.

## Decision

### 1. OAuth 인증 과정에 일회용 Authorization Code 적용

OAuth provider 인증이 완료된 이후 JWT를 URL query parameter로 전달하지 않고, Backend에서 일회용 Authorization Code를 생성하도록 변경했다.

Authorization Code는 다음 조건으로 관리했다.

* 랜덤한 code 생성
* DB에는 SHA-256 hash만 저장
* 60초 후 만료
* 한 번 사용된 code는 재사용할 수 없도록 처리
* Frontend Route Handler가 Backend의 `/auth/token`에 code를 전달
* Backend에서 code를 검증한 후 기존 JWT 발급

이를 통해 JWT 자체가 URL이나 브라우저 JavaScript 영역에 노출되지 않도록 했다.

### 2. JWT를 HttpOnly Cookie로 관리

Frontend Route Handler에서 발급받은 JWT를 `HttpOnly Cookie`에 저장하도록 구성했다.

브라우저의 JavaScript에서는 해당 cookie에 접근할 수 없도록 하고, Server-side API 요청에서 cookie를 읽어 `Authorization: Bearer` 방식으로 Backend에 전달하도록 구성했다.

Route 보호는 cookie 존재 여부와 `/auth/me` 인증을 조합해 처리했다.

### 3. Google/Kakao 로그인 UI 구성

로그인 페이지에서 Google과 Kakao 로그인 버튼을 직접 제공하도록 구성했다.

별도의 중간 로그인 단계를 두지 않고 각 OAuth provider 인증으로 바로 이동하도록 구성했다.

### 4. 서비스 브랜딩 변경

사용자에게 보여지는 서비스명을 **하루멍냥**으로 변경했다.

Frontend의 다음 영역을 변경했다.

* 로그인 페이지
* 사이트 metadata
* Open Graph metadata
* 메인 페이지

Backend에서는 Swagger 문서의 서비스명과 README의 서비스 설명을 변경했다.

Repository와 package 이름인 `pet-routine-manager` 및 `pet-routine-manager-backend`는 내부 식별자로 유지했다.

## Outcome

Frontend와 Backend의 OAuth 인증 흐름을 연결하고 Google/Kakao 로그인을 실제 브라우저 환경에서 검증했다.

최종 인증 흐름은 다음과 같다.

`Google/Kakao OAuth → Backend callback → 일회용 Authorization Code → Frontend Route Handler → POST /auth/token → JWT → HttpOnly Cookie → 보호된 페이지/API 접근`

브라우저에서 JWT가 JavaScript에 노출되지 않는 것도 확인했다.

또한 서비스의 사용자-facing 이름을 **하루멍냥**으로 통일하면서 프로젝트의 서비스 정체성을 정리했다.

Backend 테스트는 **16 suites, 166 tests**가 통과했고, Backend build도 정상적으로 완료됐다.

## Troubleshooting

### Kakao OAuth 로그인 500 오류

Google 로그인은 정상적으로 동작했지만 Kakao 로그인에서는 OAuth callback 이후 500 오류가 발생했다.

Backend 로그를 확인한 결과 Kakao access token 발급 단계에서 다음 오류가 발생했다.

`KOE010 / invalid_client / Bad client credentials`

인가 코드 발급 이후 `https://kauth.kakao.com/oauth/token` 요청 과정에서 발생한 오류였기 때문에 사용자 조회나 JWT 발급 로직의 문제가 아니라 Kakao token exchange 단계의 문제로 범위를 좁혔다.

확인 결과 Kakao Developers의 REST API Key에서 Client Secret이 활성화되어 있었지만 `KakaoStrategy`에서는 `clientSecret`을 전달하지 않고 있었다.

사용 중인 `passport-kakao`는 `clientSecret`이 전달되지 않을 경우 기본값인 `'kakao'`를 사용하고 있었고, 실제 Kakao Client Secret과 다른 값이 token 요청에 전달되고 있었다.

`.env`에 `KAKAO_CLIENT_SECRET`을 추가하고 `KakaoStrategy`에서 해당 값을 `clientSecret`으로 전달하도록 수정했다.

수정 후:

* KakaoStrategy 테스트 3개 통과
* Backend unit test 16 suites / 166 tests 통과
* Backend build 통과
* Google 로그인 정상 동작
* Kakao 로그인 정상 동작
* 로그아웃 정상 동작

까지 실제로 확인했다.

## Next

OAuth 인증과 기본 서비스 브랜딩 작업을 마무리하고, 하루멍냥의 핵심 기능인 반려동물 및 루틴 기록 기능을 실제 Frontend 화면과 연결한다.
