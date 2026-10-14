// ROADWISE — Procedural Road Geometry & Surface Generator
import * as THREE from 'three';
import { RoadNetwork, RoadEdge, RoadNode } from './RoadNetwork';
import { ObstacleBox } from '../VehiclePhysics';

export interface GeneratedRoads {
  group: THREE.Group;
  obstacles: ObstacleBox[];
}

export class RoadGeometryBuilder {
  private asphaltMat: THREE.MeshStandardMaterial;
  private bridgeMat: THREE.MeshStandardMaterial;
  private sidewalkMat: THREE.MeshStandardMaterial;
  private yellowLineMat: THREE.MeshBasicMaterial;
  private whiteLineMat: THREE.MeshBasicMaterial;
  private curbMat: THREE.MeshStandardMaterial;
  private guardrailMat: THREE.MeshStandardMaterial;

  constructor() {
    this.asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.85,
      metalness: 0.1,
    });

    this.bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
      metalness: 0.3,
    });

    this.sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.9,
      metalness: 0.05,
    });

    this.curbMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.85,
    });

    this.guardrailMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.85,
      roughness: 0.3,
    });

    this.yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    this.whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  }

  public setWeatherWet(isWet: boolean): void {
    if (isWet) {
      this.asphaltMat.roughness = 0.25;
      this.asphaltMat.metalness = 0.6;
    } else {
      this.asphaltMat.roughness = 0.85;
      this.asphaltMat.metalness = 0.1;
    }
  }

  /**
   * Generates all 3D road surfaces, curves, sidewalks, lane markings, bridge decks, and junctions.
   */
  public generate(network: RoadNetwork): GeneratedRoads {
    const group = new THREE.Group();
    const obstacles: ObstacleBox[] = [];

    // 1. Generate road ribbons for each edge
    for (const edge of network.edges.values()) {
      this.buildRoadEdge(edge, group, obstacles);
    }

    // 2. Generate junction connection aprons and roundabouts
    for (const node of network.nodes.values()) {
      this.buildNodeJunction(node, group, obstacles);
    }

    return { group, obstacles };
  }

  private buildRoadEdge(edge: RoadEdge, parent: THREE.Group, obstacles: ObstacleBox[]): void {
    const samples = Math.max(8, Math.ceil(edge.length / 4));
    const points = edge.curve.getPoints(samples);
    const halfWidth = edge.width / 2;
    const sidewalkWidth = 2.4;
    const curbHeight = 0.22;

    // Build road ribbon geometry
    const roadGeo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // Sidewalk vertices
    const lSidewalkVerts: number[] = [];
    const rSidewalkVerts: number[] = [];

    for (let i = 0; i <= samples; i++) {
      const pt = points[i];
      const tangent = edge.curve.getTangent(i / samples).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Left & Right road edge vertices
      const leftPt = pt.clone().addScaledVector(normal, halfWidth);
      const rightPt = pt.clone().addScaledVector(normal, -halfWidth);

      // Elevated road check
      const yOffset = edge.isElevated ? edge.elevationHeight || 0 : 0.015;
      leftPt.y += yOffset;
      rightPt.y += yOffset;

      vertices.push(leftPt.x, leftPt.y, leftPt.z);
      vertices.push(rightPt.x, rightPt.y, rightPt.z);

      const v = (i / samples) * (edge.length / 4);
      uvs.push(0, v, 1, v);

      if (i < samples) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }

      // Compute sidewalks
      const lOuter = leftPt.clone().addScaledVector(normal, sidewalkWidth);
      lOuter.y = pt.y + yOffset + curbHeight;
      leftPt.y = pt.y + yOffset + curbHeight;

      const rOuter = rightPt.clone().addScaledVector(normal, -sidewalkWidth);
      rOuter.y = pt.y + yOffset + curbHeight;
      rightPt.y = pt.y + yOffset + curbHeight;

      lSidewalkVerts.push(leftPt.x, leftPt.y, leftPt.z, lOuter.x, lOuter.y, lOuter.z);
      rSidewalkVerts.push(rOuter.x, rOuter.y, rOuter.z, rightPt.x, rightPt.y, rightPt.z);

      // Lane dividers (Dashed yellow/white markings along centerline)
      if (i > 0 && i % 2 === 0 && !edge.isOneWay) {
        const prevPt = points[i - 1];
        const dashGeo = new THREE.PlaneGeometry(0.25, 3.5);
        dashGeo.rotateX(-Math.PI / 2);
        const dashMesh = new THREE.Mesh(dashGeo, this.yellowLineMat);
        dashMesh.position.set(pt.x, pt.y + yOffset + 0.02, pt.z);
        dashMesh.rotation.y = Math.atan2(tangent.x, tangent.z);
        parent.add(dashMesh);
      }

      // Outer solid white road boundary lines
      if (i % 2 === 0) {
        const lWhite = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 4), this.whiteLineMat);
        lWhite.rotateX(-Math.PI / 2);
        const lWhitePos = pt.clone().addScaledVector(normal, halfWidth - 0.4);
        lWhite.position.set(lWhitePos.x, pt.y + yOffset + 0.02, lWhitePos.z);
        lWhite.rotation.y = Math.atan2(tangent.x, tangent.z);
        parent.add(lWhite);

        const rWhite = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 4), this.whiteLineMat);
        rWhite.rotateX(-Math.PI / 2);
        const rWhitePos = pt.clone().addScaledVector(normal, -halfWidth + 0.4);
        rWhite.position.set(rWhitePos.x, pt.y + yOffset + 0.02, rWhitePos.z);
        rWhite.rotation.y = Math.atan2(tangent.x, tangent.z);
        parent.add(rWhite);
      }
    }

    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const roadMesh = new THREE.Mesh(roadGeo, edge.isElevated ? this.bridgeMat : this.asphaltMat);
    roadMesh.receiveShadow = true;
    parent.add(roadMesh);

    // Build bridge pillars and guardrails if elevated
    if (edge.isElevated && edge.elevationHeight) {
      this.buildBridgeStructure(edge, points, halfWidth, parent, obstacles);
    }
  }

  private buildBridgeStructure(
    edge: RoadEdge,
    points: THREE.Vector3[],
    halfWidth: number,
    parent: THREE.Group,
    obstacles: ObstacleBox[]
  ): void {
    const h = edge.elevationHeight || 4.5;

    // Concrete support pillars every 15 meters
    for (let p = 2; p < points.length - 2; p += 3) {
      const pt = points[p];
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 1.1, h, 16),
        this.bridgeMat
      );
      pillar.position.set(pt.x, h / 2, pt.z);
      pillar.castShadow = true;
      parent.add(pillar);

      // Collider for pillar
      obstacles.push({
        minX: pt.x - 1.2,
        maxX: pt.x + 1.2,
        minZ: pt.z - 1.2,
        maxZ: pt.z + 1.2,
        name: 'Flyover Pillar',
      });
    }

    // Steel Guardrails along bridge sides
    for (let i = 0; i < points.length - 1; i++) {
      const pt = points[i];
      const nextPt = points[i + 1];
      const tangent = nextPt.clone().sub(pt).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const segLen = pt.distanceTo(nextPt);
      const railGeo = new THREE.BoxGeometry(0.2, 0.9, segLen);

      // Left rail
      const lRail = new THREE.Mesh(railGeo, this.guardrailMat);
      const lPos = pt.clone().lerp(nextPt, 0.5).addScaledVector(normal, halfWidth);
      lRail.position.set(lPos.x, h + 0.45, lPos.z);
      lRail.rotation.y = Math.atan2(tangent.x, tangent.z);
      parent.add(lRail);

      // Right rail
      const rRail = new THREE.Mesh(railGeo, this.guardrailMat);
      const rPos = pt.clone().lerp(nextPt, 0.5).addScaledVector(normal, -halfWidth);
      rRail.position.set(rPos.x, h + 0.45, rPos.z);
      rRail.rotation.y = Math.atan2(tangent.x, tangent.z);
      parent.add(rRail);
    }
  }

  private buildNodeJunction(node: RoadNode, parent: THREE.Group, obstacles: ObstacleBox[]): void {
    const px = node.pos.x;
    const pz = node.pos.y;

    if (node.type === 'ROUNDABOUT_NODE') {
      // Central roundabout monument / island
      if (node.id === 'R_NORTH') {
        // Build Roundabout central landscaped island at center (60, 60), radius 12m
        const islandGeo = new THREE.CylinderGeometry(11.5, 12, 0.5, 32);
        const islandMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 }); // Green lawn
        const island = new THREE.Mesh(islandGeo, islandMat);
        island.position.set(60, 0.25, 60);
        island.receiveShadow = true;
        parent.add(island);

        // Roundabout monument / fountain at center
        const monumentBase = new THREE.Mesh(
          new THREE.CylinderGeometry(3.0, 3.5, 1.2, 16),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.4 })
        );
        monumentBase.position.set(60, 0.85, 60);
        parent.add(monumentBase);

        const spire = new THREE.Mesh(
          new THREE.ConeGeometry(1.2, 5.5, 8),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 })
        );
        spire.position.set(60, 3.8, 60);
        spire.castShadow = true;
        parent.add(spire);

        // Island collider
        obstacles.push({
          minX: 60 - 10.5,
          maxX: 60 + 10.5,
          minZ: 60 - 10.5,
          maxZ: 60 + 10.5,
          name: 'Roundabout Center Island',
        });
      }
      return;
    }

    // Paved intersection apron
    const apronRadius = node.type === 'INTERSECTION_4WAY' ? 14 : 10;
    const apronGeo = new THREE.PlaneGeometry(apronRadius * 2, apronRadius * 2);
    apronGeo.rotateX(-Math.PI / 2);
    const apron = new THREE.Mesh(apronGeo, this.asphaltMat);
    apron.position.set(px, 0.012, pz);
    apron.receiveShadow = true;
    parent.add(apron);

    // If junction has traffic signals or pedestrian crossing
    if (node.hasSignal || node.type === 'INTERSECTION_4WAY') {
      // White stop lines and zebra pedestrian stripes
      this.buildJunctionMarkings(px, pz, apronRadius, parent);
    }
  }

  private buildJunctionMarkings(jx: number, jz: number, r: number, parent: THREE.Group): void {
    // 4 Cardinal Approaches: North, South, East, West
    const approaches = [
      { offset: [0, -r + 1.2], angle: 0, linePos: [-3.5, -r + 1.2], zebraCenter: [0, -r + 3.0], zebraRot: 0 },
      { offset: [0, r - 1.2], angle: Math.PI, linePos: [3.5, r - 1.2], zebraCenter: [0, r - 3.0], zebraRot: 0 },
      { offset: [-r + 1.2, 0], angle: -Math.PI / 2, linePos: [-r + 1.2, 3.5], zebraCenter: [-r + 3.0, 0], zebraRot: Math.PI / 2 },
      { offset: [r - 1.2, 0], angle: Math.PI / 2, linePos: [r - 1.2, -3.5], zebraCenter: [r - 3.0, 0], zebraRot: Math.PI / 2 },
    ];

    for (const app of approaches) {
      // Solid white stop line on incoming left lane
      const stopLine = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 0.65), this.whiteLineMat);
      stopLine.rotateX(-Math.PI / 2);
      stopLine.rotation.z = app.angle;
      stopLine.position.set(jx + app.linePos[0], 0.024, jz + app.linePos[1]);
      parent.add(stopLine);

      // Zebra crossing stripes across the approach
      for (let s = -3.2; s <= 3.2; s += 0.8) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 2.4), this.whiteLineMat);
        stripe.rotateX(-Math.PI / 2);
        stripe.rotation.z = app.zebraRot;

        if (app.zebraRot === 0) {
          stripe.position.set(jx + app.zebraCenter[0] + s, 0.022, jz + app.zebraCenter[1]);
        } else {
          stripe.position.set(jx + app.zebraCenter[0], 0.022, jz + app.zebraCenter[1] + s);
        }
        parent.add(stripe);
      }
    }
  }
}
