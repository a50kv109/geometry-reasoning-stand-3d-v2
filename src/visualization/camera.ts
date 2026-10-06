/**
 * CAMERA MODEL FOR 3D VISUALIZATION
 * 
 * Strict architectural isolation:
 * - Camera state is purely visualization state.
 * - Camera rotation != Geometry rotation.
 * - Camera modifications NEVER mutate canonical geometry state.
 */

import { Point3D } from '../core/types';

export interface CameraState {
  readonly azimuth: number;   // Horizontal orbit angle (radians)
  readonly elevation: number; // Vertical tilt angle (radians) [-PI/2 + eps, PI/2 - eps]
  readonly distance: number;  // Distance from target
  readonly target: Point3D;   // Orbit target (default O(0,0,0))
  readonly fov: number;       // Field of view in degrees
  readonly panX: number;      // 2D screen pan X
  readonly panY: number;      // 2D screen pan Y
}

export interface ProjectedPoint {
  readonly x: number;         // Canvas pixel X
  readonly y: number;         // Canvas pixel Y
  readonly depth: number;     // Eye-space depth (for depth sorting, higher = closer to camera)
  readonly isVisible: boolean;
}

export const INITIAL_CAMERA: CameraState = Object.freeze({
  azimuth: Math.PI / 4,       // 45 degrees
  elevation: Math.PI / 6,     // 30 degrees
  distance: 380,
  target: { x: 0, y: 0, z: 0 },
  fov: 45,
  panX: 0,
  panY: 0,
});

/**
 * Transforms world coordinates to eye space.
 * World coordinate convention:
 * - X: right / front
 * - Y: depth / left
 * - Z: up (North Pole)
 */
export function worldToEye(point: Point3D, camera: CameraState): { x: number; y: number; z: number } {
  // Translate relative to target
  const tx = point.x - camera.target.x;
  const ty = point.y - camera.target.y;
  const tz = point.z - camera.target.z;

  const cosAz = Math.cos(camera.azimuth);
  const sinAz = Math.sin(camera.azimuth);
  const cosEl = Math.cos(camera.elevation);
  const sinEl = Math.sin(camera.elevation);

  // 1. Rotate around Z by azimuth
  const rx = cosAz * tx - sinAz * ty;
  const ry = sinAz * tx + cosAz * ty;
  const rz = tz;

  // 2. Rotate around horizontal axis by elevation
  // In eye space:
  // eyeX points to the right
  // eyeY points up
  // eyeZ points towards viewer (closer to eye = higher z)
  const eyeX = rx;
  const eyeY = -sinEl * ry + cosEl * rz;
  const eyeZ = -cosEl * ry - sinEl * rz + camera.distance;

  return { x: eyeX, y: eyeY, z: eyeZ };
}

/**
 * Projects a 3D point in world space to 2D viewport coordinates with perspective.
 */
export function projectWorldPoint(
  point: Point3D,
  camera: CameraState,
  viewportWidth: number,
  viewportHeight: number,
  scaleMultiplier: number = 1.0
): ProjectedPoint {
  const eye = worldToEye(point, camera);
  const cx = viewportWidth / 2 + camera.panX;
  const cy = viewportHeight / 2 + camera.panY;

  // Perspective projection factor
  // camera.distance is reference plane
  const focalLength = (camera.distance * scaleMultiplier) / Math.tan((camera.fov * Math.PI) / 360);
  
  // Guard against division by zero or behind camera
  const zClamped = Math.max(10, eye.z);
  const factor = focalLength / zClamped;

  const screenX = cx + eye.x * factor;
  const screenY = cy - eye.y * factor; // Invert Y for standard screen coordinates

  return {
    x: screenX,
    y: screenY,
    depth: -eye.z, // higher depth = closer
    isVisible: eye.z > 5,
  };
}

/**
 * Projects a 3D point in the fixed Global XYZ indicator widget.
 * Does not depend on target pan or distance; only azimuth and elevation.
 */
export function projectTriadPoint(
  vector: Point3D,
  camera: CameraState,
  center: { x: number; y: number },
  length: number
): { x: number; y: number; depth: number } {
  const cosAz = Math.cos(camera.azimuth);
  const sinAz = Math.sin(camera.azimuth);
  const cosEl = Math.cos(camera.elevation);
  const sinEl = Math.sin(camera.elevation);

  const rx = cosAz * vector.x - sinAz * vector.y;
  const ry = sinAz * vector.x + cosAz * vector.y;
  const rz = vector.z;

  const eyeX = rx;
  const eyeY = -sinEl * ry + cosEl * rz;
  const eyeZ = -cosEl * ry - sinEl * rz;

  return {
    x: center.x + eyeX * length,
    y: center.y - eyeY * length,
    depth: -eyeZ,
  };
}

/**
 * Performs raycasting from screen coordinates (pixelX, pixelY) onto sphere S^2(O, R).
 * Returns the intersection point closest to the camera, or null if ray misses the sphere.
 */
export function raycastScreenToSphere(
  pixelX: number,
  pixelY: number,
  sphereRadius: number,
  sphereCenter: Point3D,
  camera: CameraState,
  viewportWidth: number,
  viewportHeight: number,
  scaleMultiplier: number = 1.0
): Point3D | null {
  const cx = viewportWidth / 2 + camera.panX;
  const cy = viewportHeight / 2 + camera.panY;
  const focalLength = (camera.distance * scaleMultiplier) / Math.tan((camera.fov * Math.PI) / 360);

  // Ray in eye space starting from eye origin (0, 0, camera.distance)
  const eyeRayDir = {
    x: (pixelX - cx) / focalLength,
    y: -(pixelY - cy) / focalLength,
    z: -1,
  };
  const norm = Math.sqrt(eyeRayDir.x * eyeRayDir.x + eyeRayDir.y * eyeRayDir.y + eyeRayDir.z * eyeRayDir.z);
  const dX = eyeRayDir.x / norm;
  const dY = eyeRayDir.y / norm;
  const dZ = eyeRayDir.z / norm;

  // Transform ray direction from eye space back to world space
  const cosAz = Math.cos(camera.azimuth);
  const sinAz = Math.sin(camera.azimuth);
  const cosEl = Math.cos(camera.elevation);
  const sinEl = Math.sin(camera.elevation);

  // Inverse rotation:
  // First invert elevation rotation:
  const ry1 = -sinEl * dY - cosEl * dZ;
  const rz1 = cosEl * dY - sinEl * dZ;
  const rx1 = dX;

  // Then invert azimuth rotation:
  const wDirX = cosAz * rx1 + sinAz * ry1;
  const wDirY = -sinAz * rx1 + cosAz * ry1;
  const wDirZ = rz1;

  // Camera eye position in world space:
  const eyeWorldX = sphereCenter.x - (-sinAz * (-cosEl * camera.distance));
  const eyeWorldY = sphereCenter.y - (cosAz * (-cosEl * camera.distance));
  const eyeWorldZ = sphereCenter.z + sinEl * camera.distance;

  // Ray: P(t) = eyeWorld + t * wDir
  // Sphere: ||P(t) - sphereCenter||^2 = R^2
  const ocX = eyeWorldX - sphereCenter.x;
  const ocY = eyeWorldY - sphereCenter.y;
  const ocZ = eyeWorldZ - sphereCenter.z;

  const a = wDirX * wDirX + wDirY * wDirY + wDirZ * wDirZ; // 1.0
  const b = 2 * (ocX * wDirX + ocY * wDirY + ocZ * wDirZ);
  const c = ocX * ocX + ocY * ocY + ocZ * ocZ - sphereRadius * sphereRadius;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return null; // Ray does not intersect sphere
  }

  const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
  const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
  const t = t1 > 0 ? t1 : t2;
  if (t <= 0) return null;

  return {
    x: sphereCenter.x + t * wDirX,
    y: sphereCenter.y + t * wDirY,
    z: sphereCenter.z + t * wDirZ,
  };
}
