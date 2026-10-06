/**
 * CAUSAL DEPENDENCY MODEL (Semantic Geometry Graph)
 * 
 * Generates topological dependencies dynamically for any selected geometric element.
 * Provides human-readable educational explanations in Russian.
 */

import { VertexId, EdgeId, FaceId } from '../core/types';
import { CANONICAL_EDGES, CANONICAL_FACES } from '../core/topology';

export type SelectedElement = 
  | { type: 'VERTEX'; id: VertexId }
  | { type: 'EDGE'; id: EdgeId }
  | { type: 'FACE'; id: FaceId }
  | { type: 'SPHERE' }
  | null;

export interface CausalAnalysis {
  readonly selected: SelectedElement;
  readonly affectedVertices: ReadonlySet<VertexId>;
  readonly affectedEdges: ReadonlySet<EdgeId>;
  readonly affectedFaces: ReadonlySet<FaceId>;
  readonly unaffectedVertices: ReadonlySet<VertexId>;
  readonly unaffectedEdges: ReadonlySet<EdgeId>;
  readonly unaffectedFaces: ReadonlySet<FaceId>;
  readonly title: string;
  readonly summary: string;
  readonly directEffects: readonly string[];
  readonly indirectEffects: readonly string[];
  readonly invariantElements: readonly string[];
}

const ALL_VERTICES: readonly VertexId[] = ['A', 'B', 'C', 'D'];

/**
 * Computes causal dependency structure and educational narrative dynamically.
 */
export function analyzeCausalNeighborhood(selected: SelectedElement): CausalAnalysis {
  if (!selected) {
    return {
      selected: null,
      affectedVertices: new Set(),
      affectedEdges: new Set(),
      affectedFaces: new Set(),
      unaffectedVertices: new Set(ALL_VERTICES),
      unaffectedEdges: new Set(CANONICAL_EDGES.map(e => e.id)),
      unaffectedFaces: new Set(CANONICAL_FACES.map(f => f.id)),
      title: 'Общая геометрическая система',
      summary: 'Выберите любую вершину, ребро или грань для анализа причинно-следственных зависимостей.',
      directEffects: [],
      indirectEffects: [
        'Все четыре вершины A, B, C, D лежат строго на поверхности сферы S²(O, R).',
        'Шесть евклидовых хорд образуют каркас тетраэдра.',
        'Четыре плоские треугольные грани ограничивают трёхмерный объём.',
      ],
      invariantElements: [
        'Центр сферы O(0,0,0) и радиус R остаются фиксированным вмещающим пространством.',
      ],
    };
  }

  if (selected.type === 'VERTEX') {
    const vId = selected.id;
    
    // Affected edges: edges incident to vId
    const affectedEdgesList = CANONICAL_EDGES.filter(e => e.v1 === vId || e.v2 === vId).map(e => e.id);
    const unaffectedEdgesList = CANONICAL_EDGES.filter(e => e.v1 !== vId && e.v2 !== vId).map(e => e.id);

    // Affected faces: faces containing vId
    const affectedFacesList = CANONICAL_FACES.filter(f => f.vertices.includes(vId)).map(f => f.id);
    const unaffectedFacesList = CANONICAL_FACES.filter(f => !f.vertices.includes(vId)).map(f => f.id);

    const affectedVertices = new Set<VertexId>([vId]);
    const unaffectedVertices = new Set<VertexId>(ALL_VERTICES.filter(v => v !== vId));

    const affectedEdges = new Set<EdgeId>(affectedEdgesList);
    const unaffectedEdges = new Set<EdgeId>(unaffectedEdgesList);

    const affectedFaces = new Set<FaceId>(affectedFacesList);
    const unaffectedFaces = new Set<FaceId>(unaffectedFacesList);

    const oppFace = unaffectedFacesList[0];

    return {
      selected,
      affectedVertices,
      affectedEdges,
      affectedFaces,
      unaffectedVertices,
      unaffectedEdges,
      unaffectedFaces,
      title: `Вершина ${vId}`,
      summary: `Вершина ${vId} находится на поверхности сферы S²(O, R). При её перемещении изменяются 3 инцидентных ребра и 3 инцидентных грани.`,
      directEffects: [
        `Непосредственно изменяются длины трёх инцидентных рёбер: ${affectedEdgesList.join(', ')}.`,
        `Изменяются форма, ориентация и площади трёх смежных граней: ${affectedFacesList.join(', ')}.`,
      ],
      indirectEffects: [
        'Пересчитывается общий ориентированный объём тетраэдра.',
        'Изменяется суммарная площадь поверхности и положение центроида G.',
      ],
      invariantElements: [
        `Противолежащая грань ${oppFace} остаётся абсолютно инвариантной.`,
        `Длины противоположных рёбер (${unaffectedEdgesList.join(', ')}) не изменяются.`,
        `Остальные вершины (${Array.from(unaffectedVertices).join(', ')}) остаются неподвижными.`,
      ],
    };
  }

  if (selected.type === 'EDGE') {
    const eId = selected.id;
    const edgeObj = CANONICAL_EDGES.find(e => e.id === eId)!;
    const { v1, v2 } = edgeObj;

    const affectedFacesList = CANONICAL_FACES.filter(f => f.vertices.includes(v1) && f.vertices.includes(v2)).map(f => f.id);
    const unaffectedFacesList = CANONICAL_FACES.filter(f => !affectedFacesList.includes(f.id)).map(f => f.id);

    const affectedVertices = new Set<VertexId>([v1, v2]);
    const unaffectedVertices = new Set<VertexId>(ALL_VERTICES.filter(v => v !== v1 && v !== v2));

    const affectedEdges = new Set<EdgeId>([eId]);
    const unaffectedEdges = new Set<EdgeId>(CANONICAL_EDGES.filter(e => e.id !== eId).map(e => e.id));

    const affectedFaces = new Set<FaceId>(affectedFacesList);
    const unaffectedFaces = new Set<FaceId>(unaffectedFacesList);

    return {
      selected,
      affectedVertices,
      affectedEdges,
      affectedFaces,
      unaffectedVertices,
      unaffectedEdges,
      unaffectedFaces,
      title: `Ребро ${eId}`,
      summary: `Прямолинейная хорда между вершинами ${v1} и ${v2}, разделяющая смежные грани ${affectedFacesList.join(' и ')}.`,
      directEffects: [
        `Является общим ребром для двух смежных треугольных граней: ${affectedFacesList.join(', ')}.`,
        `Длина ребра определяется евклидовым расстоянием между вершинами ${v1} и ${v2}.`,
      ],
      indirectEffects: [
        'Входит в расчёт периметра смежных граней и площади поверхности тетраэдра.',
      ],
      invariantElements: [
        `Противоположное скрещивающееся ребро и остальные 4 ребра независимы от прямой хорды ${eId}.`,
        `Оставшиеся грани (${unaffectedFacesList.join(', ')}) не содержат это ребро.`,
      ],
    };
  }

  if (selected.type === 'FACE') {
    const fId = selected.id;
    const faceObj = CANONICAL_FACES.find(f => f.id === fId)!;
    const [vA, vB, vC] = faceObj.vertices;
    const oppVertex = ALL_VERTICES.find(v => !faceObj.vertices.includes(v))!;

    const faceEdges = CANONICAL_EDGES.filter(
      e => faceObj.vertices.includes(e.v1) && faceObj.vertices.includes(e.v2)
    ).map(e => e.id);

    return {
      selected,
      affectedVertices: new Set(faceObj.vertices),
      affectedEdges: new Set(faceEdges),
      affectedFaces: new Set([fId]),
      unaffectedVertices: new Set([oppVertex]),
      unaffectedEdges: new Set(CANONICAL_EDGES.filter(e => !faceEdges.includes(e.id)).map(e => e.id)),
      unaffectedFaces: new Set(CANONICAL_FACES.filter(f => f.id !== fId).map(f => f.id)),
      title: `Грань ${fId}`,
      summary: `Плоский евклидов треугольник с вершинами ${vA}, ${vB}, ${vC}, противолежащий вершине ${oppVertex}.`,
      directEffects: [
        `Ограничена тремя рёбрами: ${faceEdges.join(', ')}.`,
        `Площадь вычисляется через векторное произведение: 1/2 ||(B-A) × (C-A)||.`,
      ],
      indirectEffects: [
        `Вместе с противоположной вершиной ${oppVertex} образует трёхмерный объём тетраэдра.`,
      ],
      invariantElements: [
        `Вершина ${oppVertex} не принадлежит плоскости этой грани при регулярной геометрии.`,
      ],
    };
  }

  // Sphere selected
  return {
    selected,
    affectedVertices: new Set(ALL_VERTICES),
    affectedEdges: new Set(CANONICAL_EDGES.map(e => e.id)),
    affectedFaces: new Set(CANONICAL_FACES.map(f => f.id)),
    unaffectedVertices: new Set(),
    unaffectedEdges: new Set(),
    unaffectedFaces: new Set(),
    title: 'Вмещающая сфера S²(O, R)',
    summary: 'Фиксированный геометрический контейнер. Все вершины тетраэдра обязаны строго лежать на её поверхности.',
    directEffects: [
      'Задаёт масштабную шкалу системы: L_scale = R.',
      'Ограничивает степени свободы вершин: каждая вершина имеет 2 степени свободы (широта φ, долгота λ).',
    ],
    indirectEffects: [
      'Все пороги точности (epsDistance, epsVolume, epsFaceArea) централизованно масштабируются от R.',
    ],
    invariantElements: [
      'Положение центра O(0,0,0) и радиус R не зависят от перемещения вершин внутри тетраэдра.',
    ],
  };
}
