# Архитектурный отчёт: Паспортизация 3D-геометрического объекта (PGO-3D)

**Проект-источник:** Geometry Reasoning Stand 3D  
**Репозиторий:** `https://github.com/a50kv109/geometry-reasoning-stand-3d-v2`  
**Целевой проект-реципиент:** Fedorov Symmetry Stand (FSS)  
**Режим:** READ-ONLY ARCHITECTURAL AUDIT & KNOWLEDGE EXTRACTION  
**Статус аудита:** ЗАВЕРШЁН (ZERO-TRUST EVIDENCE-BASED AUDIT)  
**Дата фиксации:** 2026-10-09  

---

## 0. Введение и цели аудита

Настоящий отчёт представляет собой системное архитектурное извлечение принципов, структур данных, математических инвариантов и контрактов паспортизации трёхмерного геометрического объекта из кодовой базы **Geometry Reasoning Stand 3D**.

Отчёт подготовлен как самостоятельный документ передачи знаний для проектирования ядра паспортизации геометрических тел и кристаллографических многогранников в проекте **Fedorov Symmetry Stand**.

### Фундаментальный факт аудита (Fact of Record):
> **В репозитории Geometry Reasoning Stand 3D отсутствует отдельный программный тип, интерфейс или файл с буквальным наименованием `ObjectPassport` или `PGO-3D`.**  
> Grep по кодовой базе (`grep -rnwi "passport" .`) подтверждает отсутствие такого идентификатора в исходном коде (`src/` и `docs/`).  
> 
> **Однако фактическая функция полного паспорта объекта в системе полностью реализована и декомпозирована на строго согласованный стек математических структур**:
> 1. **Каноническое базовое состояние** (`CanonicalGeometryState` в `src/core/types.ts:53-56`);
> 2. **Комбинаторно-топологический паспорт графа** (`CANONICAL_VERTICES`, `CANONICAL_EDGES`, `CANONICAL_FACES` в `src/core/topology.ts:15-47`);
> 3. **Детерминированная геометрическая сигнатура и FNV-1a хэш** (`computeGeometrySignature`, `computeGeometryHash` в `src/core/signature.ts:33-58`);
> 4. **Метрический паспорт инвариантов** (`ComprehensiveGeometryMetrics`, `GlobalMetrics` в `src/core/metrics.ts:15-50`);
> 5. **Многоуровневый паспорт валидации и статуса реализации** (`GeometryValidationResult`, `InputGeometryStatus`, `RealizationStatus` в `src/core/types.ts:97-145`);
> 6. **Централизованный масштабно-инвариантный паспорт допусков** (`ResolvedTolerances`, Package 06 в `src/core/tolerances.ts:12-74`);
> 7. **Ортодоксальный эпистемический слой паспортизации истинности** (`EpistemicStatus`, `EpistemicWrapper` в `src/core/types.ts:150-166`, `src/core/epistemic.ts:13-54`);
> 8. **Локальный микро-паспорт вершинной угловой структуры** (`LVG` в `src/core/lvg.ts:32-50`);
> 9. **Направленный паспорт рёберной согласованности** (`DLVM` в `src/core/dlvm.ts:23-30`, `verifySharedEdges` в `src/core/dlvm.ts:109-156`);
> 10. **Полный агрегированный диагностический снимок** (`GDS` — Geometric Diagnostic Snapshot в `src/core/gds.ts:17-26`);
> 11. **Временной паспорт измерений эволюции и трассировки** (`Observation<GDS>`, `StateTransition`, `GeometryMeasurement`, `TemporalTrace` в `src/core/geometryTemporal.ts:18-49`);
> 12. **Контракт оракула проверки гипотез внешних агентов** (`AgentStateSnapshot`, `StandOracle`, `AgentClaim`, `AgentVerificationReport` в `src/core/agentInterface.ts:28-58`, `src/core/types.ts:177-206`).

Ниже приводится детальный разбор всех архитектурных уровней, их математических формулировок, гарантий неизменяемости и рекомендаций по адаптации для **Fedorov Symmetry Stand**.

---

## 1. Сводная архитектурная карта декомпозиции «Паспорта»

В архитектуре Stand 3D концепция паспорта геометрического объекта строго подчинена принципу:
$$\text{ONE GEOMETRY} \implies \text{ONE CANONICAL STATE (SSOT)} \implies \text{DETERMINISTIC DERIVATION} \implies \text{MANY CLIENTS}$$

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                CANONICAL GEOMETRY STATE (SSOT)                               │
│       src/core/types.ts:53-56, src/core/geometryState.ts:48-64 (Deeply Frozen Immutable)     │
│       Sphere: S²(O, R)   │   Vertices: A, B, C, D ∈ ℝ³   │   DOF: 12 → 8 (on S²) → 5 (Shape)  │
└──────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
┌──────────────────────────────────────────────┐ ┌──────────────────────────────────────────────┐
│        TOPOLOGICAL IDENTITY PASSPORT         │ │         CENTRALIZED SCALE TOLERANCES         │
│          src/core/topology.ts:15-62          │ │          src/core/tolerances.ts:12-74        │
│  4 Vertices: A, B, C, D (non-reindexable)    │ │  L_scale = R                                 │
│  6 Euclidean Straight Chords: AB..CD         │ │  ε_sphere, ε_coinc, ε_plane ~ R^1            │
│  4 Planar Faces: ABC, ABD, ACD, BCD          │ │  ε_face ~ R^2  │  ε_volume ~ R^3             │
│  Opposite & Incidence Topological Maps       │ │  ε_reg, ε_angle, ε_finite ~ Dimensionless    │
└──────────────────────┬───────────────────────┘ └──────────────────────┬───────────────────────┘
                       │                                               │
                       └───────────────────────┬───────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                               DETERMINISTIC EVALUATION ENGINE                                │
│                                   src/core/metrics.ts:128-237                                │
│       L_ij, Face Areas, Face Normals, Signed Volume V_s, Centroid G, Regularity Ratio        │
└──────────────────┬───────────────────────────┬───────────────────────────┬───────────────────┘
                   │                           │                           │
                   ▼                           ▼                           ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐ ┌─────────────────────────────┐
│  GEOMETRIC SIGNATURE & HASH │ │  MULTI-STATUS VALIDATION    │ │  LOCAL ANGULAR MANIFOLDS    │
│  src/core/signature.ts:1-58 │ │  src/core/geometryState.ts  │ │  (LVG & DLVM)               │
│  GEOM_V1|O:..|R:..|VERTICES │ │  Input: VALID/OUTSIDE/NaN   │ │  src/core/lvg.ts:32-50      │
│  10-digit normalized coords │ │  Realization: POS/NEG/DEGEN │ │  src/core/dlvm.ts:23-30     │
│  FNV-1a 32-bit stable hash  │ │  Anti-silent-projection     │ │  Gram matrix, Solid angles  │
└──────────────┬──────────────┘ └──────────────┬──────────────┘ └──────────────┬──────────────┘
               │                               │                               │
               └───────────────────────┬───────┴───────────────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                         GEOMETRIC DIAGNOSTIC SNAPSHOT (GDS) — FULL PASSPORT                  │
│                                      src/core/gds.ts:17-71                                   │
│  • canonicalSignature       • globalMetrics           • 4×DLVM (A, B, C, D)                  │
│  • sharedEdgeConsistency    • epistemicStatus (DERIVED) • isDegenerate & degeneracyFlags      │
└──────────────────────────────────────┬───────────────────────────────────────────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      ▼                                 ▼
┌──────────────────────────────────────────────┐ ┌──────────────────────────────────────────────┐
│            TEMPORAL EVOLUTION PASSPORT       │ │          AGENT ORACLE & PROTOCOL BOUNDARY    │
│         src/core/geometryTemporal.ts:18-49   │ │          src/core/agentInterface.ts:28-58    │
│  • Observation<GDS>                          │ │  • AgentStateSnapshot                        │
│  • StateTransition (t0 < t1 guard, dt)       │ │  • verifyClaim(AgentClaim)                   │
│  • GeometryMeasurement (ΔV, ΔS, ΔG, ΔL, ΔΩ)  │ │  • Epistemic Status Ledger                   │
│  • TemporalTrace (PRISTINE/DEGRADED/CORRUPT) │ │  • "Agent may be wrong. Stand must not."     │
└──────────────────────────────────────────────┘ └──────────────────────────────────────────────┘
```

---

## 2. Уровень 1: Каноническое состояние и SSOT (Single Source of Truth)

### 2.1. Контракт и интерфейс
Каноническое состояние объекта определено в `src/core/types.ts` (строки 53–56) и создаётся через фабрику `createCanonicalGeometryState` в `src/core/geometryState.ts` (строки 48–64):

```typescript
// src/core/types.ts:12-21
export interface Point3D {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface Sphere3D {
  readonly center: Point3D;
  readonly radius: number;
}

// src/core/types.ts:53-56
export interface CanonicalGeometryState {
  readonly sphere: Sphere3D;
  readonly vertices: Readonly<Record<VertexId, Point3D>>;
}
```

### 2.2. Архитектурные правила неизменяемости
1. **Глубокая заморозка (`Object.freeze`)**: Все координаты и структуры защищены от мутации во время выполнения (`src/core/geometryState.ts:52–63`). Любая попытка прямой записи поля (`state.sphere.radius = 999`) выбрасывает исключение в strict-mode (проверено тестом `T17` в `src/tests/m1_canonical_state.test.ts:420–455`).
2. **Нулевая автокоррекция (Anti-Silent-Projection Invariant)**: Если точка не лежит на поверхности сферы $S^2(O, R)$ с точностью до $\varepsilon_{\text{sphere}}$, система **не проецирует** её принудительно, а выбрасывает статус `OUTSIDE_SPHERE` (`src/core/geometryState.ts:198–208`, `src/core/representation.ts:43–47`).
3. **Фиксированная система координат (Fixed World Frame)**: Центр сферы $O(0, 0, 0)$ и оси $+X, +Y, +Z$ не вращаются вместе с объектом (`docs/architecture-packages/PACKAGE_02_GEOMETRIC_CONTRACT_AND_REPRESENTATION.md:8–18`).
4. **Анализ степеней свободы (Degrees of Freedom)**:
   - 4 произвольные точки в $\mathbb{R}^3$: $4 \times 3 = 12$ степеней свободы.
   - Ограничение сферы $\|V_i - O\| = R$: 4 связи $\implies 8$ параметров конфигурации ($4 \times (\phi_i, \lambda_i)$).
   - Фактор по группе жестких вращений $SO(3)$: $8 - 3 = 5$ внутренних размерных параметров формы тетраэдра при фиксированном $R$.

---

## 3. Уровень 2: Персистентная комбинаторная топология

### 3.1. Контракт структуры
В файле `src/core/topology.ts` (строки 15–47) зафиксирована замкнутая неизменяемая топология тетраэдра $4V / 6E / 4F$:

```typescript
// src/core/types.ts:27-31
export type VertexId = 'A' | 'B' | 'C' | 'D';
export type EdgeId = 'AB' | 'AC' | 'AD' | 'BC' | 'BD' | 'CD';
export type FaceId = 'ABC' | 'ABD' | 'ACD' | 'BCD';
```

Константы топологии:
- `CANONICAL_VERTICES`: `['A', 'B', 'C', 'D']` (`src/core/topology.ts:15`)
- `CANONICAL_EDGES`: 6 хорд, соединяющих вершины (`src/core/topology.ts:17-24`)
- `CANONICAL_FACES`: 4 плоских треугольника с ориентацией обхода (`src/core/topology.ts:26-47`)

### 3.2. Топологические инварианты
1. **Персистентность меток**: Идентификаторы $A, B, C, D$ пожизненно закреплены за геометрическими точками. Запрещена пересортировка вершин по координатам, расстояниям или хронологии (`docs/M1_CANONICAL_GEOMETRY_STATE.md:53–59`).
2. **Топологические карты смежности и противоположностей**:
   - `getIncidentEdges(vertexId)` (`src/core/topology.ts:66–68`)
   - `getIncidentFaces(vertexId)` (`src/core/topology.ts:72–74`)
   - `getOppositeFace(vertexId)` (`src/core/topology.ts:80–87`): $A \to BCD, B \to ACD, C \to ABD, D \to ABC$
   - `getOppositeEdge(edgeId)` (`src/core/topology.ts:92–101`): $AB \leftrightarrow CD, AC \leftrightarrow BD, AD \leftrightarrow BC$
3. **Евклидовы прямолинейные хорды**: Рёбра являются прямыми отрезками в $\mathbb{R}^3$, а грани — плоскими евклидовыми треугольниками, а не геодезическими сферическими дугами или криволинейными куполами (`docs/architecture-packages/PACKAGE_02...:29–35`).

---

## 4. Уровень 3: Детерминированная сигнатура и идентификация (Identity)

### 4.1. Метаданные исключены из идентификации
В паспорте Stand 3D реализовано строгое правило: **геометрическая идентичность объекта зависит исключительно от геометрии, но не от контекста среды**.
Временные метки (`timestamp`), идентификаторы сессий, позиция камеры, зум, частота кадров, выбор пользователем (`selection`) категорически исключены из хэша (`src/core/signature.ts:4–8`).

### 4.2. Алгоритм нормализации и строковая сигнатура
В `src/core/signature.ts` (строки 16–43):
- Числа с плавающей точкой форматируются ровно до 10 знаков после запятой (`toFixed(10)`).
- Устраняется различие между $+0.0$ и $-0.0$ (`Object.is(n, -0) ? 0 : n`).
- Формируется строковый канонический дескриптор:
  $$\text{GEOM\_V1}|O:(x,y,z)|R:r|\text{VERTICES}:[A:(x,y,z);B:(x,y,z);C:(x,y,z);D:(x,y,z)]$$

### 4.3. 32-битный хэш FNV-1a
Функция `computeGeometryHash` (`src/core/signature.ts:50–58`) реализует алгоритм Fowler–Noll–Vo (FNV-1a) со стартовым смещением `0x811c9dc5` и простым множителем `0x01000193`. Результат возвращается как 8-символьная шестнадцатеричная строка (например, `a4f891b2`).

---

## 5. Уровень 4: Метрический паспорт объекта (Comprehensive Metrics)

Вся метрическая информация детерминированно вычисляется функцией `computeDerivedMetrics` (`src/core/metrics.ts:128–237`).

### 5.1. Структура `ComprehensiveGeometryMetrics`
```typescript
// src/core/metrics.ts:45-49
export interface ComprehensiveGeometryMetrics {
  readonly edges: Readonly<Record<EdgeId, EdgeMetric>>;
  readonly faces: Readonly<Record<FaceId, FaceMetric>>;
  readonly global: GlobalMetrics;
}
```

### 5.2. Формулы метрических параметров
1. **Длина рёбер (хорд)**:
   $$L_{ij} = \|V_j - V_i\|_2 = \sqrt{(x_j - x_i)^2 + (y_j - y_i)^2 + (z_j - z_i)^2}$$
2. **Площади граней и нормали**:
   Для грани $(P, Q, S)$:
   $$\mathbf{u} = Q - P, \quad \mathbf{v} = S - P, \quad \mathbf{w} = \mathbf{u} \times \mathbf{v}$$
   $$S_F = \frac{1}{2} \|\mathbf{w}\|_2, \quad \mathbf{n}_F = \frac{\mathbf{w}}{\|\mathbf{w}\|_2} \quad (\text{если } S_F > \varepsilon_{\text{faceArea}})$$
3. **Ориентированный объём тетраэдра (Signed Volume)**:
   $$V_s = \frac{1}{6} (B - A) \cdot ((C - A) \times (D - A))$$
4. **Центроид фигуры**:
   $$G = \frac{A + B + C + D}{4}$$
   *Архитектурный инвариант*: центроид $G$ математически отвязан от центра описанной сферы $O(0, 0, 0)$. Равенство $G = O$ выполняется тогда и только тогда, когда тетраэдр правильный (`docs/architecture-packages/PACKAGE_03...:41–44`).
5. **Предикат правильности (Regularity Predicate)**:
   $$\text{regularityRatio} = \frac{L_{\max} - L_{\min}}{R} \le \varepsilon_{\text{regularity}} \quad (10^{-4})$$
   Тетраэдр признаётся правильным (`isRegular = true`), если разброс длин рёбер относительно радиуса сферы не превышает безразмерного допуска и фигура не компланарна (`src/core/metrics.ts:209–212`).

---

## 6. Уровень 5: Паспорт валидации и классификации реализации

Система разделяет проверку входных данных от геометрического анализа конфигурации.

### 6.1. Ортогональные таксономии (`src/core/types.ts:97–118`)
```typescript
export enum InputGeometryStatus {
  VALID_INPUT = 'VALID_INPUT',
  INVALID_INPUT = 'INVALID_INPUT',
  OUTSIDE_SPHERE = 'OUTSIDE_SPHERE',
  NON_FINITE_INPUT = 'NON_FINITE_INPUT'
}

export enum RealizationStatus {
  VALID_POSITIVE = 'VALID_POSITIVE',
  VALID_NEGATIVE = 'VALID_NEGATIVE',
  DEGENERATE = 'DEGENERATE',
  VERTEX_COINCIDENT = 'VERTEX_COINCIDENT'
}

export enum GeometryValidationCode {
  VALID = 'VALID',
  INVALID_RADIUS = 'INVALID_RADIUS',
  NON_FINITE_COORDINATES = 'NON_FINITE_COORDINATES',
  VERTEX_OUTSIDE_SPHERE = 'VERTEX_OUTSIDE_SPHERE',
  COINCIDENT_VERTICES = 'COINCIDENT_VERTICES',
  COPLANAR_VERTICES = 'COPLANAR_VERTICES'
}
```

### 6.2. Ключевые архитектурные правила валидатора
1. **Легитимность отрицательной ориентации**: Тетраэдр с левой ориентацией вершин ($V_s < -\varepsilon_{\text{volume}}$) является **полноценным геометрическим телом** со статусом `VALID_NEGATIVE`, а не ошибкой (`src/core/geometryState.ts:253–264`).
2. **Компланарность без отбраковки**: Если вершины лежат в одной плоскости ($|V_s| \le \varepsilon_{\text{volume}}$), входной статус признаётся корректным (`isValid: true`, `inputStatus: VALID_INPUT`), но статус реализации переводится в `DEGENERATE`, что позволяет вычислительному движку и агентам анализировать вырожденные предельные состояния (`src/core/geometryState.ts:239–251`).
3. **Детальная диагностика**: Структура `GeometryValidationResult` возвращает детальные карты по каждой вершине (`vertexDetails`) и обнаруженные совпадения пар вершин (`coincidences`) (`src/core/types.ts:135–144`).

---

## 7. Уровень 6: Масштабно-зависимая модель допусков (Package 06)

Централизованная политика допусков исключает локальные «магические константы» (`magic numbers`).

### 7.1. Анализ размерностей (Dimensional Scaling Law)
Все эпсилоны вычисляются от характеристического линейного масштаба $L_{\text{scale}} = R$ (`src/core/tolerances.ts:55–74`):

| Параметр | Символ | Размерность | Коэффициент $c_Q$ | Масштабирование | Физический смысл |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **Принадлежность сфере** | `epsSphere` | $[L^1]$ | $10^{-6}$ | $10^{-6} \cdot R$ | Допуск нахождения вершины на поверхности $S^2$ |
| **Совпадение вершин** | `epsCoincident` | $[L^1]$ | $10^{-6}$ | $10^{-6} \cdot R$ | Минимальное расстояние между двумя вершинами |
| **Расстояние до плоскости** | `epsPlane` | $[L^1]$ | $10^{-6}$ | $10^{-6} \cdot R$ | Допуск компланарности точек |
| **Площадь грани** | `epsFaceArea` | $[L^2]$ | $10^{-6}$ | $10^{-6} \cdot R^2$ | Порог вырождения треугольной грани |
| **Объём тетраэдра** | `epsVolume` | $[L^3]$ | $10^{-7}$ | $10^{-7} \cdot R^3$ | Порог компланарности тетраэдра |
| **Безразмерная правильность** | `epsRegularity` | $[L^0]$ | $10^{-4}$ | $10^{-4}$ | Порог отношения $(L_{\max} - L_{\min})/R$ |
| **Угловой допуск** | `epsAngle` | $[L^0]$ | $10^{-6}$ | $10^{-6}\text{ рад}$ | Сингулярности полюсов и углы |
| **Численный нуль** | `epsFinite` | $[L^0]$ | $10^{-12}$ | $10^{-12}$ | Сравнение вещественных чисел |

Масштабная инвариантность подтверждена тестами `scale_dependency_consistency.test.ts` (при изменении $R$ от 0.5 до 10.0 метрики $L \sim R^1$, $S \sim R^2$, $V \sim R^3$ сохраняют законы подобия с машинной точностью).

---

## 8. Уровень 7: Эпистемический паспорт истинности (Epistemic Layer)

### 8.1. Принцип ортогональности
Эпистемический статус (является ли утверждение фактом, гипотезой или опровергнутым предположением) строго ортогонален математическому значению величины (`src/core/epistemic.ts:5–8`). Обертывание в эпистемическую структуру не искажает и не модифицирует само число или вектор (`isEpistemicOrthogonal` в `src/core/epistemic.ts:52–54`).

### 8.2. Таксономия истинности (`src/core/types.ts:150–158`)
```typescript
export enum EpistemicStatus {
  KNOWN_FACT = 'KNOWN_FACT',       // Непреложный факт канонического SSOT
  DERIVED = 'DERIVED',             // Детерминированно вычислено Stand
  HYPOTHESIS = 'HYPOTHESIS',       // Гипотеза внешнего агента (untrusted)
  VERIFIED = 'VERIFIED',           // Верифицировано математическим оракулом
  CONTRADICTION = 'CONTRADICTION', // Противоречие в утверждениях агента
  REFUTED = 'REFUTED',             // Математически опровергнуто Stand
  INDETERMINATE = 'INDETERMINATE'  // Неопределимо в текущих допущениях
}

export interface EpistemicWrapper<T> {
  readonly value: T;
  readonly status: EpistemicStatus;
  readonly provenance: string;     // Источник происхождения (история вывода)
  readonly confidence: number;     // Степень уверенности [0.0, 1.0]
  readonly timestamp: number;
}
```

---

## 9. Уровень 8: Локальные микро-паспорта вершин (LVG и DLVM)

Stand 3D реализует концепцию **локальной дифференциально-угловой паспортизации** каждой вершины многогранника.

### 9.1. Local Vertex Geometry (LVG — `src/core/lvg.ts:32–50`)
Для каждой вершины вычисляется её локальный угловой паспорт:
1. **Направляющие единичные векторы инцидентных рёбер**:
   $$\mathbf{u}_{vj} = \frac{\mathbf{v}_j - \mathbf{v}}{\|\mathbf{v}_j - \mathbf{v}\|}$$
2. **Матрица Грама ($3 \times 3$)**:
   $$G_{jk} = \mathbf{u}_{vj} \cdot \mathbf{u}_{vk}, \quad \det(G) = [\mathbf{u}_1 \cdot (\mathbf{u}_2 \times \mathbf{u}_3)]^2$$
3. **Плоские углы**: $\alpha_{jk} = \arccos(\mathbf{u}_{vj} \cdot \mathbf{u}_{vk})$.
4. **Двугранные углы** между инцидентными гранями.
5. **Телесный угол вершины $\Omega(v)$**: вычисляется по формуле сферического эксцесса Оостерома–Страке (Oosterom–Strackee) через непрерывный двухпараметрический арктангенс (`atan2`):
   $$\tan\left(\frac{\Omega}{2}\right) = \frac{|\mathbf{u}_1 \cdot (\mathbf{u}_2 \times \mathbf{u}_3)|}{1 + \mathbf{u}_1 \cdot \mathbf{u}_2 + \mathbf{u}_2 \cdot \mathbf{u}_3 + \mathbf{u}_3 \cdot \mathbf{u}_1}$$
6. **Классификация вырождения вершины ($D_0 - D_5$)**:
   - `D0_VALID` — регулярный невырожденный трехгранный угол;
   - `D1_COLLINEAR_EDGE` — коллинеарность двух рёбер;
   - `D2_COPLANAR_EDGES` — все три инцидентных ребра лежат в одной плоскости;
   - `D3_NEAR_DEGENERATE` — критическая близость к вырождению;
   - `D4_INVERTED_ORIENTATION` — инвертированная ориентация трёхгранника;
   - `D5_NUMERICAL_FAULT` — некорректные численные значения (`NaN`/`Infinity`).

### 9.2. Directed Local Vertex Manifold (DLVM — `src/core/dlvm.ts:23–30`)
DLVM связывает локальный трёхгранник вершины с рёбрами общего многогранника и формулирует фундаментальный инвариант:
$$\mathbf{u}_{AB}^{(A)} + \mathbf{u}_{BA}^{(B)} = 0 \quad (\text{строгая антипараллельность общих рёбер})$$
Функция `verifySharedEdges` (`src/core/dlvm.ts:109–156`) проверяет этот инвариант по всем 6 парам рёбер с точностью $\varepsilon_{\text{finite}}$.

---

## 10. Уровень 9: Geometric Diagnostic Snapshot (GDS) — Фактический агрегированный паспорт

Файл `src/core/gds.ts` формирует единый снимок, объединяющий все вышеперечисленные срезы в единую структуру данных:

```typescript
// src/core/gds.ts:17-26
export interface GDS {
  readonly timestamp: number;
  readonly canonicalSignature: string;
  readonly globalMetrics: GlobalMetrics;
  readonly dlvms: Readonly<Record<VertexId, DLVM>>;
  readonly sharedEdgeConsistency: SharedEdgeVerificationResult;
  readonly epistemicStatus: EpistemicStatus;
  readonly isDegenerate: boolean;
  readonly degeneracyFlags: readonly string[];
}
```

### Гарантия однонаправленного потока:
`CanonicalGeometryState` $\to$ `GDS`.  
У структуры `GDS` отсутствует какая-либо возможность обратной записи в каноническое состояние (`ZERO reverse-write capability`). Это строгий диагностический паспорт объекта в заданный момент времени.

---

## 11. Уровень 10: Временной паспорт эволюции объекта (Temporal Evolution)

В `src/core/geometryTemporal.ts` реализован паспорт трассировки изменения формы объекта во времени:

### 11.1. Контракты наблюдений и переходов
```typescript
// src/core/geometryTemporal.ts:18-49
export interface Observation<T> {
  readonly timestamp: number;
  readonly data: T;
  readonly status: 'VALID' | 'CORRUPTED' | 'DEGENERATE';
}

export interface GeometryMeasurement {
  readonly deltaVolume: number;
  readonly deltaSurfaceArea: number;
  readonly deltaCentroidDisplacement: number;
  readonly deltaEdgeLengths: Readonly<Record<EdgeId, number>>;
  readonly vertexDisplacements: Readonly<Record<VertexId, number>>;
  readonly deltaSolidAngles: Readonly<Record<VertexId, number>>;
  readonly maxVertexDisplacement: number;
}

export interface StateTransition {
  readonly t0: number;
  readonly t1: number;
  readonly dt: number;
  readonly fromSignature: string;
  readonly toSignature: string;
  readonly isValidOrdering: boolean;
  readonly measurements: GeometryMeasurement | null;
  readonly status: 'VALID' | 'CORRUPTED' | 'DEGENERATE';
}

export interface TemporalTrace {
  readonly observations: readonly Observation<GDS>[];
  readonly transitions: readonly StateTransition[];
  readonly quality: 'PRISTINE' | 'DEGRADED' | 'CORRUPTED';
}
```

### 11.2. Ограничитель монотонности времени (Monotonic Time Guard)
Если при переходе между состояниями $\Delta t = t_1 - t_0 \le 0$, переход автоматически бракуется с признаком `CORRUPTED`, а измерения геометрических приращений аннулируются (`src/core/geometryTemporal.ts:77–88`, протестировано в `lvg_dlvm_gds_temporal.test.ts:182–195`).

---

## 12. Уровень 11: Граница доверия и паспорт для AI-агентов (Agent Boundary)

Принцип: **«Agent may be wrong. Stand must not.»** (`src/core/agentInterface.ts:5`).

### 12.1. Снимок состояния агента
```typescript
// src/core/types.ts:200-206
export interface AgentStateSnapshot {
  readonly canonical: CanonicalGeometryState;
  readonly representation: RepresentationState;
  readonly validation: GeometryValidationResult;
  readonly timestamp: number;
  readonly signature: string;
}
```

### 12.2. Математический оракул верификации гипотез
Агент формулирует гипотезу `AgentClaim` (тип, цель, утверждаемое значение, желаемый допуск). Оракул `StandOracle` (`verifyAgentClaim`) пересчитывает каноническую истину и возвращает заключение:
- `VERIFIED` — гипотеза агента совпала с каноническим значением в пределах допуска;
- `REFUTED` — гипотеза агента опровергнута с точным указанием расхождения `delta`.
Защита от замкнутого круга (`Anti-Circular Guard`): утверждение агента никогда не может выступать предпосылкой для верификации другого утверждения агента (`docs/architecture-packages/PACKAGE_05...:58`).

---

## 13. Уровень 12: Паспортизация в пользовательском интерфейсе

В пользовательском интерфейсе Stand 3D паспорт объекта отображается через три независимых компонента:

1. **Панель измерений и состояния (`MeasurementPanel.tsx`)**:
   Отображает объём со знаком $V_s$, площадь поверхности, статус правильности (`Правильный`, `Произвольный`, `Вырожденный`), координаты центроида $G$, длины всех 6 рёбер с индикацией причинно-следственной зависимости (`AFFECTED` vs `UNCHANGED`).
2. **Панель инженерной диагностики M1 (`DebugPanel.tsx`)**:
   Отображает сырое каноническое состояние, результат валидации, 32-битный FNV-1a хэш, строковую сигнатуру и таблицу активных допусков Package 06.
3. **Глобус локальной угловой геометрии (`LsmInspector.tsx`)**:
   Реализует концепцию физического глобуса локальной сферы $S^2(v)$:
   $$\boxed{\text{Geometry State} = \text{const}} \quad \iff \quad \boxed{\text{Observer View Orientation} = \text{поворот модели в руках}}$$
   Поворот глобуса пользователем меняет угол обзора наблюдателя, но не мутирует ни один геометрический параметр самого тетраэдра.

---

## 14. Сравнительный анализ: Переносимость в Fedorov Symmetry Stand (FSS)

Проект **Fedorov Symmetry Stand** нацелен на исследование групп симметрии кристаллов, многогранников Фёдорова (параллелоэдров) и пространственных групп Шёнфлиса–Фёдорова.

Ниже приведена матрица прямого переноса решений Stand 3D и перечень необходимых расширений:

| Архитектурный модуль Stand 3D | Реализовано в Stand 3D | Переносимость в Fedorov Stand | Необходимое расширение для кристаллографии (FSS) |
| :--- | :--- | :---: | :--- |
| **Канонический SSOT (`CanonicalGeometryState`)** | Замороженный объект `O, R, A, B, C, D` | **100% ПЕРЕНОСИМО** | Расширение от 4 фиксированных вершин до произвольного массива $N$ вершин $V_1 \dots V_N$. Снятие ограничения описанной сферы (многогранники могут быть неописанными). |
| **Комбинаторная топология (`Persistent Topology`)** | Фиксированный граф 4V / 6E / 4F | **ПЕРЕНОСИМА КОНЦЕПЦИЯ** | Переход от жестких типов `'A'|'B'|'C'|'D'` к обобщенному представлению многогранников (структура Half-Edge или B-Rep / графы инцидентности граней произвольного порядка $n \ge 3$). |
| **FNV-1a Геометрическая сигнатура** | 10-значная нормализация координат без метаданных | **100% ПЕРЕНОСИМО** | Расширение сигнатуры инвариантами группы симметрии (класс точечной группы, сигнатура кристаллографической системы). |
| **Масштабные допуски (Package 06)** | $L_{\text{scale}} = R$, степени $R^1, R^2, R^3$ | **100% ПЕРЕНОСИМО** | Выбор $L_{\text{scale}}$ как максимального габарита полиэдра или параметра элементарной ячейки кристаллической решётки $a, b, c$. |
| **Ортодоксальный эпистемический слой** | `EpistemicStatus` (Fact, Hypothesis, Refuted) | **100% ПЕРЕНОСИМО** | Идеально для автоматического поиска и проверки элементов симметрии (плоскости зеркальной симметрии, поворотные оси, инверсия). |
| **Локальные трёхгранники (LVG & DLVM)** | Матрица Грама, углы Оостерома–Страке | **ВЫСОКАЯ ПЕРЕНОСИМОСТЬ** | Обобщение на вершины порядка $k \ge 3$ (где сходятся $k$ граней: 4, 5 или 6 рёбер в вершине). |
| **Диагностический снимок (GDS)** | Агрегированный снимок метрик и дефектов | **100% ПЕРЕНОСИМО** | Служит прямым прототипом для структуры `FedorovPolyhedronPassport` (PGO-3D). |
| **Временные эволюции (Temporal Trace)** | $\Delta t > 0$, дифференциальные измерения | **100% ПЕРЕНОСИМО** | Применимо для исследования непрерывных деформаций ячеек (деформации Бэна, фазовые переходы). |
| **Инспектор «Глобус углов» (`LsmInspector`)** | Вращение глобуса без мутации геометрии | **100% ПЕРЕНОСИМО** | Прямая основа для **стереографической проекции** кристаллографических граней и осей симметрии (сетка Вульфа). |

---

## 15. Проектируемая спецификация PGO-3D для Fedorov Symmetry Stand

На основе извлечённых из Stand 3D проверенных решений формулируется рекомендация по целевой структуре **Паспорта геометрического объекта 3D (PGO-3D)** для проекта Fedorov Symmetry Stand:

```typescript
/**
 * FEDOROV SYMMETRY STAND — 3D OBJECT PASSPORT (PGO-3D)
 * Спроектировано на основе доказанной архитектуры Geometry Reasoning Stand 3D
 */

export interface FedorovPassportPGO3D {
  // 1. Идентификация и версионирование
  readonly passportVersion: 'PGO_3D_V1';
  readonly objectId: string;
  readonly canonicalSignature: string;          // FNV-1a хэш от канонических координат и топологии
  readonly timestamp: number;                   // Время генерации паспорта

  // 2. Канонический геометрический базис (SSOT)
  readonly geometry: {
    readonly vertices: Readonly<Record<string, Point3D>>;
    readonly characteristicScale: number;       // L_scale для допусков Package 06
    readonly centroid: Point3D;
    readonly boundingBox: { readonly min: Point3D; readonly max: Point3D };
    readonly circumsphere?: Sphere3D;           // Опционально, если существует
  };

  // 3. Комбинаторная топология (обобщение 4V/6E/4F)
  readonly topology: {
    readonly vertexCount: number;
    readonly edgeCount: number;
    readonly faceCount: number;
    readonly eulerCharacteristic: number;       // V - E + F = 2 (для сферических полиэдров)
    readonly edges: readonly { readonly id: string; readonly v1: string; readonly v2: string }[];
    readonly faces: readonly { readonly id: string; readonly vertexCycle: readonly string[] }[];
  };

  // 4. Метрические инварианты
  readonly metrics: {
    readonly edgeLengths: Readonly<Record<string, number>>;
    readonly faceAreas: Readonly<Record<string, number>>;
    readonly totalSurfaceArea: number;
    readonly volume: number;
    readonly isConvex: boolean;
    readonly isIsohedral: boolean;              // Гранетранзитивность
    readonly isIsogonal: boolean;               // Вершиннотранзитивность
  };

  // 5. Кристаллографический паспорт симметрии (расширение FSS)
  readonly symmetry: {
    readonly pointGroupHermannMauguin: string;  // например, "m-3m", "4/mmm", "23"
    readonly pointGroupSchoenflies: string;     // например, "Oh", "D4h", "T"
    readonly symmetryOrder: number;             // Порядок точечной группы (например, 48 для куба)
    readonly symmetryElements: {
      readonly inversionCenter: Point3D | null;
      readonly rotationAxes: readonly { readonly order: number; readonly axis: Point3D }[];
      readonly mirrorPlanes: readonly { readonly normal: Point3D; readonly distance: number }[];
    };
    readonly fedorovType?: 'PARALLELOHEDRON' | 'STEREOHEDRON' | 'GENERAL_POLYHEDRON';
  };

  // 6. Локальные многообразия вершин (обобщение LVG/DLVM)
  readonly localVertexManifolds: Readonly<Record<string, {
    readonly valency: number;                   // Количество сходящихся рёбер
    readonly incidentEdges: readonly string[];
    readonly planarAngles: readonly number[];
    readonly solidAngle: number;                // Сферический эксцесс вершины
    readonly gramDeterminant: number;
    readonly localSymmetryGroup?: string;
  }>>;

  // 7. Статус валидации и допуски (Package 06)
  readonly validation: {
    readonly isValid: boolean;
    readonly tolerancesUsed: ResolvedTolerances;
    readonly realizationStatus: RealizationStatus;
    readonly degeneracyFlags: readonly string[];
  };

  // 8. Эпистемический контекст
  readonly epistemic: {
    readonly status: EpistemicStatus;
    readonly provenance: string;
    readonly verifiedByOracle: boolean;
  };
}
```

---

## 16. Сводная таблица доказательств реализации в кодовой базе (Verification Ledger)

Каждое утверждение данного отчёта подтверждено прямыми ссылками на исходный код и набором детерминированных тестов:

| Модуль | Исходный файл | Ключевые интерфейсы и функции | Подтверждающие тесты |
| :--- | :--- | :--- | :--- |
| **Канонический SSOT** | `src/core/geometryState.ts`<br>`src/core/types.ts` | `CanonicalGeometryState`<br>`createCanonicalGeometryState`<br>`computeSignedVolume` | `m1_canonical_state.test.ts` (T01, T02, T11, T17)<br>`regular_tetrahedron_metric.test.ts` |
| **Топология** | `src/core/topology.ts`<br>`src/core/types.ts` | `CANONICAL_VERTICES`, `CANONICAL_EDGES`, `CANONICAL_FACES`<br>`getIncidentEdges`, `getOppositeFace` | `m1_canonical_state.test.ts` (T13, T14)<br>`lvg_dlvm_gds_temporal.test.ts` |
| **Сигнатура и FNV-1a** | `src/core/signature.ts` | `computeGeometrySignature`<br>`computeGeometryHash` | `m1_canonical_state.test.ts` (T09, T10, T17) |
| **Метрики** | `src/core/metrics.ts` | `computeDerivedMetrics`<br>`ComprehensiveGeometryMetrics`<br>`calculateFaceArea` | `scale_dependency_consistency.test.ts`<br>`scale_dependency_irregular.test.ts` |
| **Валидация** | `src/core/geometryState.ts` | `validateGeometryState`<br>`InputGeometryStatus`<br>`RealizationStatus` | `m1_canonical_state.test.ts` (T03–T08, T15, T16) |
| **Допуски Package 06** | `src/core/tolerances.ts` | `getResolvedTolerances`<br>`ResolvedTolerances` | `scale_dependency_consistency.test.ts`<br>`m1_7_scale_and_guides.test.ts` |
| **Эпистемика** | `src/core/epistemic.ts`<br>`src/core/types.ts` | `EpistemicStatus`<br>`wrapEpistemic`, `fact`, `hypothesis`<br>`isEpistemicOrthogonal` | `epistemic_status_orthogonal.test.ts`<br>`agent_readiness_smoke.test.ts` |
| **LVG** | `src/core/lvg.ts` | `computeLVG`, `LVG`<br>`Gram matrix`, `solidAngle` (Oosterom–Strackee) | `lvg_dlvm_gds_temporal.test.ts` (LVG-01–LVG-04) |
| **DLVM** | `src/core/dlvm.ts` | `computeDLVM`, `computeAllDLVMs`<br>`verifySharedEdges` | `lvg_dlvm_gds_temporal.test.ts` (DLVM-01, DLVM-02) |
| **GDS** | `src/core/gds.ts` | `computeGDS`, `GDS` | `lvg_dlvm_gds_temporal.test.ts` (GDS-01) |
| **Временная динамика** | `src/core/geometryTemporal.ts` | `createObservation`, `computeStateTransition`<br>`createTemporalTrace`, `TemporalTrace` | `lvg_dlvm_gds_temporal.test.ts` (Temporal-01–Temporal-03) |
| **Агентский оракул** | `src/core/agentInterface.ts` | `createStandOracle`, `verifyAgentClaim`<br>`AgentStateSnapshot` | `agent_readiness_smoke.test.ts` (Contract 01–10) |
| **UI-инспекторы** | `src/components/MeasurementPanel.tsx`<br>`src/components/DebugPanel.tsx`<br>`src/components/LsmInspector.tsx` | Панель измерений, панель M1 диагностики, интерактивный глобус локальной геометрии | `m1_5_visual_client.test.ts`<br>`m1_6_workspace_layout.test.ts` |

---

## 17. Заключение

Аудит репозитория Geometry Reasoning Stand 3D подтверждает:
1. Архитектура Stand 3D содержит законченный, верифицированный и строго изолированный математический контур паспортизации геометрического объекта.
2. Принцип неизменяемого канонического состояния (SSOT) с глубокой заморозкой и отсутствием негласных проекций гарантирует математическую надёжность.
3. Полный диагностический снимок `GDS`, локальные трёхгранники `LVG/DLVM`, ортогональный эпистемический слой и масштабно-инвариантные допуски Package 06 готовы к прямому заимствованию в качестве фундамента паспортизации многогранников в проекте **Fedorov Symmetry Stand**.
