# Fedorov Symmetry Stand (FSS) — Agent Gateway v0.1

**Версия спецификации:** 0.1.0  
**Статус:** IMPLEMENTED & VERIFIED  
**Дата:** 2026-10-09  
**Репозиторий:** `Geometry Reasoning Stand 3D / Fedorov Symmetry Stand`  

---

## 1. Назначение и архитектурная граница

FSS Agent Gateway v0.1 — это первый рабочий входной интерфейс для внешних AI-агентов к математическому ядру стенда. Он обеспечивает строгий программный доступ к исследованию 3D-геометрических тел, выполнению геометрических построений, применению преобразований симметрии и получению независимых, детерминированных протоколов доказательств (`EvidenceRecord`).

### Архитектурный инвариант:
```text
AI Agent → Agent Gateway → Command Validation → Canonical Geometry Core → Deterministic Verification → Evidence Record
```

* **Human UI и Agent Interface используют одно математическое ядро:** Никаких параллельных геометрических движков.
* **Шлюз не хранит второй копии геометрической истины:** Все вычисления производятся в каноническом евклидовом пространстве $\mathbb{R}^3$.
* **Шлюз не манипулирует UI напрямую:** Операции агента выполняются в изолированных снимках и ветках (`State Branches`) и не изменяют активную рабочую сцену исследователя-человека без явного запроса.
* **Принимающая сторона (Stand Verifier) единолично владеет допусками:** Агент не может передать произвольный допуск (например, `tolerance = 999`), чтобы принудительно подтвердить ложную гипотезу. Оракул использует масштабный контракт Package 06 ($\varepsilon_{\text{linear}} = 10^{-6} \cdot R$).
* **Фундаментальное разделение сущностей:**
  $$\boxed{\text{OBJECT IDENTITY} \neq \text{STATE SNAPSHOT} \neq \text{SYMMETRY PASSPORT} \neq \text{CLAIM} \neq \text{EVIDENCE}}$$

---

## 2. Классификация функциональности

| Компонент / Возможность | Статус в v0.1 | Описание реализации |
| :--- | :--- | :--- |
| **`CanonicalGeometryState` & SSOT** | `IMPLEMENTED` | Неизменяемое каноническое ядро (`geometryState.ts`), глубокая заморозка, детерминированная сигнатура. |
| **`ObjectPassport` (PGO-3D)** | `IMPLEMENTED` | Идентичность и топологическая схема объекта (4V/6E/4F, $\chi=2$, теоретический максимум симметрии). |
| **`SymmetryPassport` (PSS-3D)** | `IMPLEMENTED` | Состояние-зависимый паспорт симметрии с отслеживанием полноты (`FULL_GROUP_VERIFIED`, `GENERATORS_ONLY`, `SAMPLE_OPERATIONS`, `NOT_COMPUTED`). |
| **`StandOracle` (Smoke)** | `IMPLEMENTED` | Базовый оракул для тетраэдра (`agentInterface.ts`). |
| **`AgentGateway` (9 команд)** | `IMPLEMENTED` | Полноценный шлюз (`src/core/agentGateway.ts`) со строгой диспетчеризацией дискриминированных объединений. |
| **Symmetry Transformations** | `IMPLEMENTED` | Модуль `src/core/symmetry.ts`: центральная инверсия $i$, повороты по формуле Родрига $C_n$, отражения $\sigma$, несобственные повороты $S_4$, сравнение множеств вершин. |
| **Geometric Constructions** | `IMPLEMENTED` | Модуль `src/core/construction.ts`: регулярный тетраэдр, явный тетраэдр из 4 вершин, возмущения вершин. |
| **Receiver-Owned Tolerances** | `IMPLEMENTED` | Строгое игнорирование агентских попыток переопределить допуск; оракул применяет `getResolvedTolerances(R)`. |
| **Evidence Record & Ledger** | `IMPLEMENTED` | Фиксация каждого эксперимента с отделением математических доказательств от метаданных. |
| **Agent Console в интерфейсе** | `IMPLEMENTED` | Интерактивный компонент `src/components/AgentConsole.tsx` с кнопками команд, редактором JSON и просмотром обоих паспортов и доказательств. |
| **Внешнее сетевое подключение (HTTP/MCP)** | `MISSING (PLANNED)` | Приложение функционирует как клиентский Vite SPA. Шлюз доступен через `window.__fssAgentGateway` в браузере и TypeScript API в Node.js. Спецификация HTTP/MCP адаптера приведена ниже. |

---

## 3. Набор команд v0.1 (9 реализованных команд)

Шлюз принимает строго типизированные команды `AgentGatewayCommand`:

### 1. `inspect_passport`
Возвращает паспорт объекта (`ObjectPassport`): глобальный ID, имя, топологический граф (4V/6E/4F, эйлерова характеристика $\chi=2$), теоретический максимум симметрии ($T_d$), типичные генераторы и список возможностей.
```json
{ "command": "inspect_passport" }
```

### 2. `inspect_symmetry_passport`
Возвращает паспорт симметрии **конкретного геометрического состояния** (`SymmetryPassport`):
* Идентифицирует точное состояние (`stateId`, `stateSignature`).
* Отслеживает статус классификации (`VERIFIED`, `REFUTED`, `PARTIALLY_VERIFIED`, `NOT_COMPUTED`).
* Отслеживает полноту проверки точечной группы:
  - `FULL_GROUP_VERIFIED`: проверены все 24 операции группы $T_d$ (или доказан срыв симметрии до $C_1$/подгруппы).
  - `GENERATORS_ONLY`: проверены только генераторы (4 оси $C_3$, 3 оси $C_2$, инверсия $i$); полная группа **не** утверждается.
  - `NOT_COMPUTED`: расчёт не запрашивался; система честно возвращает `'NOT_COMPUTED'`.
* Фиксирует статус центра инверсии $i$ (для тетраэдра — `REFUTED`).
```json
{
  "command": "inspect_symmetry_passport",
  "evaluateFullGroup": true
}
```

### 3. `get_canonical_snapshot`
Возвращает замороженный снимок канонического состояния в $\mathbb{R}^3$, сигнатуру, статус валидации и метрики (объём, регулярность, ориентация).
```json
{ "command": "get_canonical_snapshot", "stateId": "active" }
```

### 4. `construct_object`
Создаёт новый геометрический объект через проверенный конструктор. Отклоняет некорректные, нефинитные или компланарные вершины без скрытого выравнивания.
* `REGULAR_TETRAHEDRON`: `{ "radius": 1.0, "center": { "x": 0, "y": 0, "z": 0 } }`
* `EXPLICIT_TETRAHEDRON`: явные координаты вершин $A, B, C, D$.
```json
{
  "command": "construct_object",
  "constructionType": "REGULAR_TETRAHEDRON",
  "params": { "radius": 1.0 }
}
```

### 5. `apply_symmetry_operation`
Применяет изометрию пространства $O(3) \rtimes \mathbb{R}^3$ к заданному состоянию и регистрирует новое результирующее состояние в реестре шлюза (не мутируя рабочую сцену человека).
* `CENTRAL_INVERSION`: инверсия $\mathbf{x}' = -\mathbf{x}$ относительно центра.
* `AXIS_ROTATION`: поворот вокруг оси на заданный угол в градусах.
* `PLANE_REFLECTION`: отражение относительно плоскости с заданной нормалью.
```json
{
  "command": "apply_symmetry_operation",
  "operation": {
    "type": "AXIS_ROTATION",
    "axis": { "x": 0, "y": 0, "z": 1 },
    "angleDegrees": 120
  }
}
```

### 6. `query_metric`
Детерминированный опрос глобальной или локальной метрики: `signedVolume`, `absoluteVolume`, `isRegular`, `edgeLength`, `faceArea`, `orientation`, `all`.
```json
{
  "command": "query_metric",
  "metricName": "signedVolume"
}
```

### 7. `verify_claim`
Математическая проверка гипотезы через эталонный оракул. Формирует `EvidenceRecord` с вердиктом `VERIFIED` или `REFUTED`.
Поддерживаемые предикаты:
* `IS_INVARIANT_UNDER_OPERATION`: проверка инвариантности относительно операции симметрии.
* `IS_REGULAR`: проверка правильности фигуры.
* `IS_DEGENERATE`: проверка вырожденности (компланарности/нулевого объёма).
* `ORIENTATION`: проверка знака тройного скалярного произведения (`POSITIVE` / `NEGATIVE`).
* `SIGNED_VOLUME_EQUALS`: проверка точного объёма с допуском $\varepsilon_{\text{volume}}$.
* `EDGE_LENGTH_EQUALS`: проверка длины ребра.
* `FACE_AREA_EQUALS`: проверка площади грани.
* `POINT_ON_SPHERE`: проверка принадлежности сфере.
```json
{
  "command": "verify_claim",
  "hypothesis": {
    "predicate": "IS_INVARIANT_UNDER_OPERATION",
    "claimedValue": true,
    "operationContext": {
      "type": "AXIS_ROTATION",
      "axis": { "x": 0, "y": 0, "z": 1 },
      "angleDegrees": 120
    }
  }
}
```

### 8. `perturb_geometry`
Создаёт контролируемое воспроизводимое возмущение (деформацию) вершины $A, B, C$ или $D$ на вектор $(\Delta x, \Delta y, \Delta z)$. Служит для изучения срыва симметрии (*Symmetry Breaking*).
```json
{
  "command": "perturb_geometry",
  "vertexId": "A",
  "offset": { "x": 0.15, "y": 0, "z": 0 }
}
```

### 9. `get_experiment_ledger`
Возвращает историю экспериментов со всеми протоколами доказательств.
```json
{ "command": "get_experiment_ledger", "limit": 10 }
```

---

## 4. Контракт протокола доказательств (Evidence Record)

Каждая верифицированная операция возвращает протокол `EvidenceRecord`:
```typescript
export interface EvidenceRecord {
  readonly evidenceId: string;
  readonly experimentId: string;
  readonly objectId: string;
  readonly inputStateSignature: string;
  readonly outputStateSignature?: string;
  readonly command: string;
  readonly parameters: Readonly<Record<string, any>>;
  readonly predicate: string;
  readonly verdict: 'VERIFIED' | 'REFUTED' | 'INVALID_INPUT' | 'UNSUPPORTED_OPERATION';
  readonly epistemicStatus: EpistemicStatus;
  readonly explanation: string;
  readonly receiverTolerancePolicy: {
    readonly scale: number;
    readonly linearEpsilon: number;
    readonly angularEpsilon: number;
    readonly volumeEpsilon: number;
    readonly appliedEpsilon: number;
    readonly rule: string;
  };
  readonly mathematicalEvidence: {
    readonly predicate: string;
    readonly claimedValue: any;
    readonly actualValue: any;
    readonly residual?: number;
    readonly toleranceUsed: number;
    readonly invariantPreserved: boolean;
  };
  readonly timestamp: number;
}
```

---

## 5. Интерактивная консоль агента (Agent Console)

В интерфейсе приложения (правая колонка, блок 7) размещена рабочая станция **Agent Console**:
1. **Команды MVP:** быстрый запуск 8 типовых сценариев (осмотр паспорта, проверка $C_3$, проверка инверсии, срыв симметрии, опрос метрик).
2. **JSON Консоль:** редактор структурированных JSON-запросов агента с валидацией синтаксиса и кнопкой выполнения.
3. **Паспорт PGO-3D:** просмотр структуры, эйлеровой характеристики и генераторов группы.
4. **Журнал экспериментов:** список всех проведённых сессий с фильтрацией по вердиктам.
5. **Карточка доказательства:** отображение невязки (`Residual`), применённого допуска ($\varepsilon$) и вердикта оракула.
6. **Кнопка «Показать в 3D сцене»:** явное переключение рабочей сцены человека на результат эксперимента агента (исключая скрытые мутации).

---

## 6. Внешнее подключение агентов (Connectivity Specification)

Текущий стенд собран на Vite как клиентское веб-приложение. Для подключения внешних AI-агентов (по сети или через локальные скрипты) реализованы следующие механизмы:

1. **In-Browser Automation (Console / Playwright / Puppeteer):**
   Объект шлюза примонтирован к `window.__fssAgentGateway`:
   ```javascript
   const res = window.__fssAgentGateway.executeCommand({
     command: 'inspect_passport'
   });
   console.log(res);
   ```

2. **TypeScript / Node.js Direct Import:**
   Любой внешний скрипт или агентский пайплайн импортирует ядро стенда напрямую:
   ```typescript
   import { createAgentGateway, constructRegularTetrahedron } from './src/core';
   const tetra = constructRegularTetrahedron(1.0).canonicalState!;
   const gateway = createAgentGateway(tetra);
   const result = gateway.executeCommand({ command: 'inspect_passport' });
   ```

3. **Спецификация для будущего HTTP / MCP адаптера (Phase 2):**
   Для запуска полноценного HTTP/JSON-RPC сервера или сервера Model Context Protocol (MCP) достаточно создать легковесный адаптер (например, `server.ts` на Express):
   ```typescript
   // POST /api/agent/command
   app.post('/api/agent/command', (req, res) => {
     const response = gateway.executeCommand(req.body);
     res.status(response.success ? 200 : 400).json(response);
   });
   ```
   Шлюз `AgentGateway` полностью отделён от UI и готов к немедленному использованию в серверном окружении без изменений.

---

## 7. Краткий пример использования (Agent Quickstart)

```typescript
import {
  createAgentGateway,
  constructRegularTetrahedron,
  createPoint3D,
} from './src/core';

// 1. Инициализация стенда с правильным тетраэдром R=1
const initial = constructRegularTetrahedron(1.0).canonicalState!;
const gateway = createAgentGateway(initial, 'TETRAHEDRON-01');

// 2. Агент осматривает паспорт объекта
const passport = gateway.executeCommand({ command: 'inspect_passport' });
console.log('Object Passport:', passport.data.name);

// 3. Агент выдвигает гипотезу: тетраэдр инвариантен относительно C_3 (120° вокруг Z)
const verifyC3 = gateway.executeCommand({
  command: 'verify_claim',
  hypothesis: {
    predicate: 'IS_INVARIANT_UNDER_OPERATION',
    claimedValue: true,
    operationContext: {
      type: 'AXIS_ROTATION',
      axis: createPoint3D(0, 0, 1),
      angleDegrees: 120,
    },
  },
});
console.log('C3 Verdict:', verifyC3.evidence?.verdict); // "VERIFIED"

// 4. Агент возмущает вершину A на dx = 0.15 (срыв симметрии)
const perturb = gateway.executeCommand({
  command: 'perturb_geometry',
  vertexId: 'A',
  offset: createPoint3D(0.15, 0, 0),
});

// 5. Агент повторяет проверку на возмущённом состоянии
const verifyPerturbed = gateway.executeCommand({
  command: 'verify_claim',
  targetStateId: perturb.data.resultingStateId,
  hypothesis: {
    predicate: 'IS_INVARIANT_UNDER_OPERATION',
    claimedValue: true,
    operationContext: {
      type: 'AXIS_ROTATION',
      axis: createPoint3D(0, 0, 1),
      angleDegrees: 120,
    },
  },
});
console.log('Perturbed Verdict:', verifyPerturbed.evidence?.verdict); // "REFUTED"
console.log('Residual:', verifyPerturbed.evidence?.mathematicalEvidence.residual);
```

---

## 8. Итоги верификации и тестов

* **Тестовый прогон:** `npm run test:all` успешно выполняет **11 тестовых наборов** (все тесты `PASS`, 0 `FAIL`).
* **Тест шлюза:** `src/tests/agent_gateway_v01.test.ts` подтверждает все 12 контрактов (типизация, отказ от недопустимых операций, неизменность исходного состояния, срыв симметрии, оракул допуска).
* **Сборка:** `compile_applet` и `lint_applet` завершены без единой ошибки.
