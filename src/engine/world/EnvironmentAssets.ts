// ROADWISE — Instanced & Reusable Environmental Assets (Streetlights, Trees, Vehicles, Signs)
import * as THREE from 'three';
import { ObstacleBox } from '../VehiclePhysics';

export interface AssetsBundle {
  group: THREE.Group;
  obstacles: ObstacleBox[];
}

export class EnvironmentAssetBuilder {
  public buildAllAssets(): AssetsBundle {
    const group = new THREE.Group();
    const obstacles: ObstacleBox[] = [];

    this.buildStreetlights(group);
    this.buildTrees(group, obstacles);
    this.buildBusStops(group, obstacles);
    this.buildParkedTwoWheelers(group, obstacles);
    this.buildRegulatorySigns(group);
    this.buildConstructionDetour(group, obstacles);

    return { group, obstacles };
  }

  // ---------------------------------------------------------------------------
  // 1. INSTANCED STREETLIGHTS (Along major avenues & ring road)
  // ---------------------------------------------------------------------------
  private buildStreetlights(parent: THREE.Group): void {
    const lightPositions: [number, number, number][] = [
      // Central MG Boulevard (North side)
      [-50, 0, -8], [-25, 0, -8], [0, 0, -8], [25, 0, -8], [50, 0, -8],
      // Central MG Boulevard (South side)
      [-50, 0, 8], [-25, 0, 8], [0, 0, 8], [25, 0, 8], [50, 0, 8],
      // Central Avenue N-S
      [-8, 0, -50], [-8, 0, -25], [-8, 0, 25], [-8, 0, 50],
      [8, 0, -50], [8, 0, -25], [8, 0, 25], [8, 0, 50],
      // Ring Road Highway
      [20, 0, -125], [60, 0, -115], [110, 0, -35], [110, 0, 45],
    ];

    const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 6.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const lanternGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfde047,
      emissiveIntensity: 0.8,
    });

    for (const [lx, ly, lz] of lightPositions) {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(lx, ly + 3.25, lz);
      pole.castShadow = true;
      parent.add(pole);

      // Curved mast arm
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8), poleMat);
      arm.rotation.z = Math.PI / 3;
      arm.position.set(lx + 0.6, ly + 6.3, lz);
      parent.add(arm);

      // Glowing lantern
      const lantern = new THREE.Mesh(lanternGeo, lanternMat);
      lantern.position.set(lx + 1.2, ly + 6.1, lz);
      parent.add(lantern);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. STREET TREES & GREENERY (Banyan / Neem style foliage)
  // ---------------------------------------------------------------------------
  private buildTrees(parent: THREE.Group, obstacles: ObstacleBox[]): void {
    const treeCoords: [number, number][] = [
      // Green Valley Residential
      [-15, 75], [-30, 75], [15, 75], [30, 75], [-45, 95], [0, 95], [35, 95],
      // Central Boulevard Margins
      [-42, 16], [-12, 16], [16, 16], [42, 16],
      [-42, -16], [-12, -16], [16, -16], [42, -16],
      // Heritage Quarter
      [-75, -45], [-75, -75], [-92, -45],
      // School Campus Perimeter
      [-22, -80], [22, -80], [-35, -95], [35, -95],
    ];

    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.38, 2.8, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const foliageGeo = new THREE.DodecahedronGeometry(1.9, 1);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 });

    for (const [tx, tz] of treeCoords) {
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(tx, 1.4, tz);
      trunk.castShadow = true;
      parent.add(trunk);

      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.set(tx, 3.6, tz);
      foliage.castShadow = true;
      parent.add(foliage);

      obstacles.push({
        minX: tx - 0.5,
        maxX: tx + 0.5,
        minZ: tz - 0.5,
        maxZ: tz + 0.5,
        name: 'Tree',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 3. BUS STOPS & PASSENGER SHELTERS
  // ---------------------------------------------------------------------------
  private buildBusStops(parent: THREE.Group, obstacles: ObstacleBox[]): void {
    const stops = [
      { x: -35, z: 9.5, rot: 0, name: 'MG Road Bus Stop' },
      { x: 35, z: -9.5, rot: Math.PI, name: 'Commercial Plaza Bus Stop' },
      { x: 9.5, z: -40, rot: -Math.PI / 2, name: 'School Lane Shelter' },
    ];

    const shelterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.4 });
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

    for (const bs of stops) {
      const stopGroup = new THREE.Group();
      stopGroup.position.set(bs.x, 0, bs.z);
      stopGroup.rotation.y = bs.rot;

      // Canopy
      const roof = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.25, 2.2), shelterMat);
      roof.position.set(0, 2.8, 0);
      stopGroup.add(roof);

      // Back glass panel
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(4.3, 2.4, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.6 })
      );
      back.position.set(0, 1.4, -0.95);
      stopGroup.add(back);

      // Wooden bench inside
      const bench = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 0.6), benchMat);
      bench.position.set(0, 0.45, -0.4);
      stopGroup.add(bench);

      parent.add(stopGroup);

      obstacles.push({
        minX: bs.x - 2.5,
        maxX: bs.x + 2.5,
        minZ: bs.z - 1.5,
        maxZ: bs.z + 1.5,
        name: bs.name,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 4. PARKED TWO-WHEELERS (Curbside Scooters & Bikes)
  // ---------------------------------------------------------------------------
  private buildParkedTwoWheelers(parent: THREE.Group, obstacles: ObstacleBox[]): void {
    const parkedSlots = [
      { x: 12, z: 8.5, color: 0xdc2626 },
      { x: 14, z: 8.5, color: 0x2563eb },
      { x: 16, z: 8.5, color: 0x1e293b },
      { x: -14, z: -8.5, color: 0xf59e0b },
      { x: -16, z: -8.5, color: 0x059669 },
    ];

    const bikeMat = new THREE.MeshStandardMaterial({ roughness: 0.4 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.1, 10);
    wheelGeo.rotateZ(Math.PI / 2);

    for (const b of parkedSlots) {
      const bikeGroup = new THREE.Group();
      bikeGroup.position.set(b.x, 0, b.z);
      bikeGroup.rotation.y = Math.PI / 2 + 0.2; // Parked at slight angle

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.6, 1.6),
        new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.4 })
      );
      body.position.y = 0.55;
      bikeGroup.add(body);

      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.15, 0.8),
        wheelMat
      );
      seat.position.set(0, 0.88, -0.15);
      bikeGroup.add(seat);

      const wF = new THREE.Mesh(wheelGeo, wheelMat);
      wF.position.set(0, 0.24, 0.65);
      bikeGroup.add(wF);

      const wR = new THREE.Mesh(wheelGeo, wheelMat);
      wR.position.set(0, 0.24, -0.65);
      bikeGroup.add(wR);

      parent.add(bikeGroup);

      obstacles.push({
        minX: b.x - 0.6,
        maxX: b.x + 0.6,
        minZ: b.z - 0.8,
        maxZ: b.z + 0.8,
        name: 'Parked Two-Wheeler',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 5. REGULATORY TRAFFIC SIGNS (Speed 30, Speed 50, Hospital, Stop)
  // ---------------------------------------------------------------------------
  private buildRegulatorySigns(parent: THREE.Group): void {
    const signs = [
      // Speed 30 in School Zone
      { x: -8.5, z: -45, rot: 0, text: '30', border: 0xdc2626 },
      // Speed 50 on Ring Road Highway
      { x: 18, z: -128, rot: 0, text: '50', border: 0xdc2626 },
      // Hospital Silent Zone
      { x: -52, z: 45, rot: -Math.PI / 2, text: 'H', border: 0x0284c7 },
    ];

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569 });

    for (const s of signs) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2), poleMat);
      pole.position.set(s.x, 1.6, s.z);
      parent.add(pole);

      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.65, 0.06, 24),
        new THREE.MeshBasicMaterial({ color: s.border })
      );
      disc.rotateX(Math.PI / 2);
      disc.rotation.z = s.rot;
      disc.position.set(s.x, 2.9, s.z);
      parent.add(disc);

      const inner = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.52, 0.07, 24),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      inner.rotateX(Math.PI / 2);
      inner.position.set(s.x, 2.9, s.z);
      parent.add(inner);
    }
  }

  // ---------------------------------------------------------------------------
  // 6. ROAD CONSTRUCTION & DETOUR BARRIER ZONE (Shortcut Trap)
  // ---------------------------------------------------------------------------
  private buildConstructionDetour(parent: THREE.Group, obstacles: ObstacleBox[]): void {
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
    const whiteStripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Barricade across shortcut alley at [25, -25]
    for (let k = -2; k <= 2; k++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.3), barrierMat);
      bar.position.set(25 + k * 1.8, 0.55, -25);
      parent.add(bar);

      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.25, 0.32), whiteStripeMat);
      stripe.position.set(25 + k * 1.8, 0.55, -25);
      parent.add(stripe);

      obstacles.push({
        minX: 25 + k * 1.8 - 0.9,
        maxX: 25 + k * 1.8 + 0.9,
        minZ: -25.6,
        maxZ: -24.4,
        name: 'Construction Barrier',
      });
    }

    // Circular No-Entry Regulatory Sign
    const signDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.08, 24),
      new THREE.MeshBasicMaterial({ color: 0xdc2626 }) // Red ring
    );
    signDisc.rotateX(Math.PI / 2);
    signDisc.position.set(20.5, 2.8, -24.0);
    parent.add(signDisc);

    const signBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.22, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xffffff }) // White horizontal bar
    );
    signBar.position.set(20.5, 2.8, -23.95);
    parent.add(signBar);
  }
}
