# Day14 - Pet 모델 구축 🐶

**Date: 2026-09-03**

## Context

Family 기능 구현을 마무리하고, 반려동물 정보를 관리하기 위한 Pet 모델을 구축했다.

이번 단계에서는 Pet CRUD API를 바로 구현하지 않고, 먼저 데이터 구조와 Family와의 관계를 설계하고 Prisma 모델 및 DB Migration까지 반영했다.

Pet은 특정 사용자 개인의 데이터가 아니라 가족 구성원들이 함께 관리하는 데이터이기 때문에 `Family 1 : N Pet` 관계로 설계했다.

## Decision

### 1. Pet 모델 설계

Pet에 다음 정보를 저장하기로 결정했다.

- `id`: Pet 식별자
- `familyId`: Pet이 속한 Family 식별자
- `name`: 반려동물 이름
- `birthDate`: 생년월일
- `gender`: 성별
- `breed`: 품종
- `image`: 프로필 이미지 URL

`age`는 별도의 필드로 저장하지 않기로 했다.

나이는 시간이 지나면 값이 변경되기 때문에 DB에 저장하면 주기적으로 업데이트해야 한다. 따라서 변하지 않는 `birthDate`를 저장하고 필요한 시점에 나이를 계산하는 방식으로 결정했다.

### 2. Family와 Pet 관계

하나의 Family에서 여러 마리의 반려동물을 관리할 수 있으므로 `Family 1 : N Pet` 관계로 설계했다.

- `Family.pets`: 여러 Pet
- `Pet.family`: 하나의 Family
- `Pet.familyId`: 실제 Family와 Pet을 연결하는 FK

`familyName`은 Pet 테이블에 중복 저장하지 않기로 했다.

Family 이름은 이미 Family 테이블에서 관리하고 있으므로 `familyId`를 통해 필요한 경우 Family 정보를 조회하는 것이 데이터 중복을 줄일 수 있기 때문이다.

### 3. Pet 이름의 Unique 여부

Pet의 `name`은 unique로 설정하지 않았다.

같은 Family에서도 같은 이름을 가진 Pet이 존재할 수 있기 때문이다.

예를 들어 같은 Family에서 `초코`라는 이름의 강아지와 고양이를 함께 키우는 것도 데이터상 문제가 없다.

따라서 Pet의 식별자는 `id`이고, `name`은 중복될 수 있도록 설계했다.

### 4. Gender Enum

Pet의 성별은 정해진 값만 사용하도록 `PetGender` enum을 추가했다.

- `MALE`
- `FEMALE`

`FamilyRole`에서 `OWNER`, `MEMBER`를 enum으로 제한했던 것과 같은 방식으로, 서비스에서 허용할 값을 명확하게 제한하기 위해 enum을 사용했다.

### 5. Image

이미지는 DB에 실제 파일을 저장하지 않고 이미지 URL을 저장하는 방식으로 설계했다.

따라서 `image`는 `String?`으로 설정해 프로필 이미지 없이도 Pet을 등록할 수 있도록 했다.

### 6. Family 삭제와 Pet 삭제

Family가 삭제되면 해당 Family에서 관리하던 Pet도 함께 삭제되도록 `onDelete: Cascade`를 적용했다.

Pet은 Family에 종속된 데이터이므로 Family가 존재하지 않는 상태에서 Pet만 남겨두지 않도록 결정했다.

## Outcome

### Prisma

`PetGender` enum과 `Pet` 모델을 추가했다.

```text
Pet
├── id
├── familyId
├── name
├── birthDate
├── gender
├── breed
└── image
```

Family에는 `pets Pet[]` 관계를 추가하고, Pet에는 `family Family` 관계를 추가했다.

### Migration

새로운 Migration을 생성했다.

`20260903085628_add_pet_model`

Migration을 통해 다음 내용이 반영되었다.

* `PetGender` enum 생성
* `Pet` 테이블 생성
* `Pet.familyId` → `Family.id` FK 생성
* Family 삭제 시 Pet도 삭제되는 `ON DELETE CASCADE` 적용
* 기존 테이블과 기존 Migration은 수정하지 않음

### 검증

* 테스트: 8 suites / 55 tests passed
* Build: `npm run build` 성공

기존 Family / FamilyMember / User 구조를 유지하면서 Pet 모델과 Family 관계를 추가하는 데 성공했다.

## Next

다음 단계에서는 Pet 모델을 기반으로 실제 Pet API를 구현한다.

* Pet 생성
* Pet 조회
* Pet 수정
* Pet 삭제
* Family와 Pet의 연결
* Family 권한에 따른 Pet 접근 제어
* Unit / E2E 테스트 추가
