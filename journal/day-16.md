# Day16. Routine 데이터 모델 설계 및 Migration

## Context

반려동물의 실제 케어 기록을 저장하는 Routine 데이터 모델을 설계했다.

서비스의 핵심 기록 단위는 **"어떤 Pet에게 누가 무엇을 언제 했는지"**로 정의했다.

Category와 SubCategory를 Pet 기준으로 관리하고, 실제 행동 기록은 Routine으로 저장하는 구조를 결정했다.

특히 모든 Category에 SubCategory가 존재하는 것은 아니기 때문에, `Routine`에서 `categoryId`는 필수로 두고 `subCategoryId`는 nullable로 설계했다.

예를 들어:

- 밥 → 사료
- 배변 → 응가 / 쉬야
- 산책 → Category만 사용
- 약 → Category만 사용

## Decision

### 1. Category와 SubCategory의 관계

Category는 특정 Pet에 소속되도록 `petId`를 가진다.

```text
Pet 1 : N Category
Category 1 : N SubCategory
```

SubCategory는 `categoryId`를 통해 자신이 어떤 Category에 속하는지 표현한다.

### 2. Routine 모델

Routine은 실제로 수행한 케어 행동 하나를 기록한다.

```text
Routine
├── id
├── petId
├── userId
├── categoryId
├── subCategoryId?
├── recordedAt
└── memo?
```

* `petId`: 어떤 Pet에 대한 기록인지
* `userId`: 누가 기록했는지
* `categoryId`: 어떤 Category의 행동인지
* `subCategoryId`: 구체적인 행동인지. 없을 수도 있음
* `recordedAt`: 실제 기록이 생성된 시간
* `memo`: 선택적으로 남길 수 있는 메모

`recordedAt`은 사용자가 직접 입력하지 않고 서버에서 자동으로 생성하도록 `@default(now())`을 사용했다.

### 3. Category/SubCategory 이름 중복 방지

같은 Pet 안에서 Category 이름이 중복되지 않도록 다음 제약을 추가했다.

```text
@@unique([petId, name])
```

SubCategory도 같은 Category 안에서는 이름이 중복되지 않도록 다음 제약을 추가했다.

```text
@@unique([categoryId, name])
```

따라서 서로 다른 Pet이나 Category에서는 같은 이름을 사용할 수 있지만, 같은 부모 안에서는 중복 생성할 수 없다.

### 4. 삭제 시 데이터 처리

과거 기록이 불필요하게 삭제되지 않도록 관계별 삭제 동작을 설정했다.

* Pet 삭제 → Category / Routine cascade
* Category 삭제 → SubCategory / Routine cascade
* SubCategory 삭제 → Routine의 `subCategoryId`만 `NULL`
* User 삭제 → Routine cascade

특히 SubCategory가 삭제되어도 과거 Routine 기록 자체는 유지되도록 `ON DELETE SET NULL`을 사용했다.

## Outcome

Prisma schema에 다음 모델을 추가했다.

* `Category`
* `SubCategory`
* `Routine`

기존 `User`, `Pet` 모델에는 필요한 reverse relation을 추가했다.

이후 두 개의 migration을 생성하고 PostgreSQL 데이터베이스에 적용했다.

* `add_routine_models`
* `add_category_subcategory_unique_names`

Prisma Client generate도 정상적으로 완료했고, `pnpm run build`를 실행하여 타입 오류가 없는 것을 확인했다.

이번 작업을 통해 단순히 Routine 테이블을 만드는 것뿐만 아니라, 실제 서비스 UX를 데이터 구조에 어떻게 반영할지 결정했다.

특히 `산책`, `약`처럼 SubCategory가 없는 행동과 `사료`, `응가`처럼 구체적인 SubCategory가 있는 행동을 하나의 Routine 구조로 처리할 수 있도록 설계했다.

## Next

Day17에서는 설계한 Routine 모델을 실제 API로 구현한다.

우선 사용자가 실제 케어 행동을 기록할 수 있도록 Routine 생성 API부터 구현하고, 로그인한 사용자와 Pet의 관계 및 Category/SubCategory 유효성 검증을 함께 처리한다.
