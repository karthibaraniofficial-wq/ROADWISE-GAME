// ROADWISE — Indian Left-Hand-Traffic (LHT) Procedural City Generator
import * as THREE from 'three';
import { TrafficLightData, WeatherType } from '../types/game';
import { ObstacleBox } from './VehiclePhysics';

export interface CityBundle {
  scene: THREE.Group;
  obstacles: ObstacleBox[];
  trafficLights: TrafficLightData[];
  updateSignals: (delta: number) => void;
  setSignalVisuals: () => void;
  setWeather: (weather: WeatherType) => void;
  updateRain: (delta: number) => void;
  pickupMarker: THREE.Group;
  dropoffMarker: THREE.Group;
}

export function buildCity(): CityBundle {
  const cityGroup = new THREE.Group();
  const obstacles: ObstacleBox[] = [];
  const trafficLights: TrafficLightData[] = [];

  // --- SHARED REUSABLE MATERIALS ---
  const asphaltMat = new THREE.MeshStandardMaterial({
    color: 0x242831,
    roughness: 0.85,
    metalness: 0.1,
  });

  const sidewalkMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.9,
    metalness: 0.05,
  });

  const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

  const buildingPalette = [
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7, metalness: 0.2 }), // Slate
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8, metalness: 0.1 }), // Grey
    new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.5, metalness: 0.4 }), // Teal Commercial
    new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9, metalness: 0.05 }), // Terracotta Brick
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.8 }), // Modern Glass Tower
  ];

  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfde047,
    emissiveIntensity: 0.5,
    roughness: 0.2,
  });

  // Ground plane (grass / base)
  const groundGeo = new THREE.PlaneGeometry(350, 350);
  groundGeo.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 })
  );
  ground.position.y = -0.05;
  cityGroup.add(ground);

  // --- 1. ROAD GRID (Left Hand Traffic) ---
  // North-South Avenues at X = -50, X = 0, X = 50
  // East-West Streets at Z = -50, Z = 0, Z = 50
  const avenueCoords = [-50, 0, 50];
  const streetCoords = [-50, 0, 50];

  // Build N-S Avenues
  for (const ax of avenueCoords) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(14, 300), asphaltMat);
    road.rotateX(-Math.PI / 2);
    road.position.set(ax, 0.01, 0);
    cityGroup.add(road);

    // Center dividing dashed yellow line
    for (let z = -140; z <= 140; z += 10) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 5), yellowLineMat);
      dash.rotateX(-Math.PI / 2);
      dash.position.set(ax, 0.02, z);
      cityGroup.add(dash);
    }

    // Sidewalks on left & right of avenue
    const curbL = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.25, 300), sidewalkMat);
    curbL.position.set(ax - 8.25, 0.12, 0);
    cityGroup.add(curbL);

    const curbR = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.25, 300), sidewalkMat);
    curbR.position.set(ax + 8.25, 0.12, 0);
    cityGroup.add(curbR);
  }

  // Build E-W Streets
  for (const sz of streetCoords) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(300, 14), asphaltMat);
    road.rotateX(-Math.PI / 2);
    road.position.set(0, 0.015, sz);
    cityGroup.add(road);

    // Center dividing line
    for (let x = -140; x <= 140; x += 10) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.25), yellowLineMat);
      dash.rotateX(-Math.PI / 2);
      dash.position.set(x, 0.022, sz);
      cityGroup.add(dash);
    }
  }

  // --- 2. INTERSECTIONS, STOP LINES & ZEBRA CROSSINGS ---
  const signalMeshMap: Map<string, { redMat: THREE.MeshBasicMaterial; amberMat: THREE.MeshBasicMaterial; greenMat: THREE.MeshBasicMaterial }> = new Map();

  for (const ix of avenueCoords) {
    for (const iz of streetCoords) {
      // White Stop Lines on the Left-Hand side of approaches
      // North approach (approaching South heading)
      const stopLineN = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.6), whiteLineMat);
      stopLineN.rotateX(-Math.PI / 2);
      stopLineN.position.set(ix - 3.5, 0.03, iz - 9.0);
      cityGroup.add(stopLineN);

      // South approach (approaching North heading)
      const stopLineS = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.6), whiteLineMat);
      stopLineS.rotateX(-Math.PI / 2);
      stopLineS.position.set(ix + 3.5, 0.03, iz + 9.0);
      cityGroup.add(stopLineS);

      // Zebra crossings across N-S and E-W entrances
      for (let s = -2.8; s <= 2.8; s += 0.8) {
        // North zebra stripe
        const stripeN = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 2.2), whiteLineMat);
        stripeN.rotateX(-Math.PI / 2);
        stripeN.position.set(ix + s, 0.028, iz - 7.5);
        cityGroup.add(stripeN);

        // South zebra stripe
        const stripeS = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 2.2), whiteLineMat);
        stripeS.rotateX(-Math.PI / 2);
        stripeS.position.set(ix + s, 0.028, iz + 7.5);
        cityGroup.add(stripeS);
      }

      // --- 3. 3D TRAFFIC LIGHT POLE ---
      const poleGroup = new THREE.Group();
      poleGroup.position.set(ix + 8.0, 0, iz - 8.0);

      // Metal pole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 5.5, 12),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 })
      );
      pole.position.y = 2.75;
      poleGroup.add(pole);

      // Horizontal mast arm
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 4.2),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
      );
      arm.rotation.z = Math.PI / 2;
      arm.position.set(-2.0, 5.0, 0);
      poleGroup.add(arm);

      // Signal housing box
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 1.6, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
      );
      box.position.set(-3.5, 4.8, 0);
      poleGroup.add(box);

      // Lamps
      const lampGeo = new THREE.SphereGeometry(0.16, 12, 12);
      const redMat = new THREE.MeshBasicMaterial({ color: 0x330000 });
      const amberMat = new THREE.MeshBasicMaterial({ color: 0x332200 });
      const greenMat = new THREE.MeshBasicMaterial({ color: 0x003300 });

      const redLamp = new THREE.Mesh(lampGeo, redMat);
      redLamp.position.set(-3.5, 5.3, 0.22);
      poleGroup.add(redLamp);

      const amberLamp = new THREE.Mesh(lampGeo, amberMat);
      amberLamp.position.set(-3.5, 4.8, 0.22);
      poleGroup.add(amberLamp);

      const greenLamp = new THREE.Mesh(lampGeo, greenMat);
      greenLamp.position.set(-3.5, 4.3, 0.22);
      poleGroup.add(greenLamp);

      cityGroup.add(poleGroup);

      const lightId = `light_${ix}_${iz}`;
      signalMeshMap.set(lightId, { redMat, amberMat, greenMat });

      trafficLights.push({
        id: lightId,
        position: [ix + 8.0, 0, iz - 8.0],
        rotationY: 0,
        state: 'GREEN',
        timer: Math.random() * 8, // slight offset between junctions
        cycleDuration: { green: 14, amber: 3.5, red: 14 },
        stopLinePos: [ix - 3.5, 0, iz - 9.0],
        approachHeading: Math.PI, // Facing South
      });
    }
  }

  // --- 4. BUILDINGS & CITY BLOCKS ---
  // 4 Quadrants per block around avenues & streets
  const blockCenters = [
    [-25, -25], [25, -25],
    [-25, 25],  [25, 25],
    [-75, -25], [-75, 25],
    [75, -25],  [75, 25],
    [-25, -75], [25, -75],
    [-25, 75],  [25, 75],
  ];

  for (const [bx, bz] of blockCenters) {
    // Generate cluster of 2 to 3 buildings per block
    const bCount = 2;
    for (let i = 0; i < bCount; i++) {
      const offsetX = (i === 0 ? -6 : 6);
      const offsetZ = (i === 0 ? -6 : 6);
      const posX = bx + offsetX;
      const posZ = bz + offsetZ;
      const width = 16 + Math.random() * 6;
      const depth = 16 + Math.random() * 6;
      const height = 18 + Math.random() * 26;

      const mat = buildingPalette[Math.floor(Math.random() * buildingPalette.length)];
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
      bldg.position.set(posX, height / 2, posZ);
      bldg.castShadow = true;
      bldg.receiveShadow = true;
      cityGroup.add(bldg);

      // Add window details
      const winCount = Math.floor(height / 4);
      for (let w = 1; w < winCount; w++) {
        const winBand = new THREE.Mesh(
          new THREE.BoxGeometry(width + 0.1, 0.8, depth + 0.1),
          windowMat
        );
        winBand.position.set(posX, w * 4, posZ);
        cityGroup.add(winBand);
      }

      // Add obstacle collider
      obstacles.push({
        minX: posX - width / 2 - 0.5,
        maxX: posX + width / 2 + 0.5,
        minZ: posZ - depth / 2 - 0.5,
        maxZ: posZ + depth / 2 + 0.5,
        name: 'Building',
      });
    }
  }

  // --- 5. SHORTCUT TRAP & CONSTRUCTION DETOUR ZONE ---
  // Alleyway between X = 20 and X = 30 at Z = -25 blocked with barricades
  const barrierMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
  const barrierStripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  for (let k = -2; k <= 2; k++) {
    const barricade = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.3), barrierMat);
    barricade.position.set(24 + k * 1.8, 0.55, -25);
    cityGroup.add(barricade);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.25, 0.32), barrierStripeMat);
    stripe.position.set(24 + k * 1.8, 0.55, -25);
    cityGroup.add(stripe);

    obstacles.push({
      minX: 24 + k * 1.8 - 0.9,
      maxX: 24 + k * 1.8 + 0.9,
      minZ: -25.5,
      maxZ: -24.5,
      name: 'Construction Barrier',
    });
  }

  // No-Entry Circular Sign
  const signPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x475569 })
  );
  signPole.position.set(20.5, 1.6, -24.0);
  cityGroup.add(signPole);

  const signDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.65, 0.08, 24),
    new THREE.MeshBasicMaterial({ color: 0xdc2626 }) // Red circle
  );
  signDisc.rotateX(Math.PI / 2);
  signDisc.position.set(20.5, 3.0, -24.0);
  cityGroup.add(signDisc);

  const signDash = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.2, 0.1),
    new THREE.MeshBasicMaterial({ color: 0xffffff }) // White horizontal bar
  );
  signDash.position.set(20.5, 3.0, -23.95);
  cityGroup.add(signDash);

  // --- 6. STREET TREES & DECORATION ---
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });

  const treePositions = [
    [-42, 15], [-42, 35], [-42, -15], [-42, -35],
    [8, 15],   [8, 35],   [8, -15],   [8, -35],
    [42, 15],  [42, 35],  [42, -15],  [42, -35],
  ];

  for (const [tx, tz] of treePositions) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 2.5), trunkMat);
    trunk.position.set(tx, 1.25, tz);
    cityGroup.add(trunk);

    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6), foliageMat);
    foliage.position.set(tx, 3.2, tz);
    foliage.castShadow = true;
    cityGroup.add(foliage);

    obstacles.push({
      minX: tx - 0.4,
      maxX: tx + 0.4,
      minZ: tz - 0.4,
      maxZ: tz + 0.4,
      name: 'Tree',
    });
  }

  // --- 7. MONSOON RAIN SYSTEM (3,000 Drops) ---
  const rainCount = 2800;
  const rainGeo = new THREE.BufferGeometry();
  const rainPos = new Float32Array(rainCount * 3);
  for (let r = 0; r < rainCount; r++) {
    rainPos[r * 3 + 0] = (Math.random() - 0.5) * 220;
    rainPos[r * 3 + 1] = Math.random() * 50;
    rainPos[r * 3 + 2] = (Math.random() - 0.5) * 220;
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.PointsMaterial({
    color: 0x93c5fd,
    size: 0.35,
    transparent: true,
    opacity: 0.65,
  });
  const rainSystem = new THREE.Points(rainGeo, rainMat);
  rainSystem.visible = false;
  cityGroup.add(rainSystem);

  // --- 8. DELIVERY CHECKPOINT MARKERS (Pickup & Drop-off) ---
  function createMarker(colorHex: number): THREE.Group {
    const group = new THREE.Group();

    // Ground beacon cylinder ring
    const ringGeo = new THREE.RingGeometry(1.6, 2.2, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    ring.position.y = 0.08;
    group.add(ring);

    // Vertical translucent light beam column
    const beamGeo = new THREE.CylinderGeometry(1.6, 1.6, 12, 16, 1, true);
    const beam = new THREE.Mesh(
      beamGeo,
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
    );
    beam.position.y = 6.0;
    group.add(beam);

    // Floating parcel/destination icon
    const icon = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
      new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3, metalness: 0.6 })
    );
    icon.position.y = 2.4;
    group.add(icon);

    return group;
  }

  const pickupMarker = createMarker(0x10b981); // Emerald Green for Pickup
  const dropoffMarker = createMarker(0xf59e0b); // Amber for Delivery Destination
  cityGroup.add(pickupMarker);
  cityGroup.add(dropoffMarker);

  // --- UPDATE ROUTINES ---
  function updateSignals(delta: number): void {
    for (const light of trafficLights) {
      light.timer += delta;
      const totalCycle = light.cycleDuration.green + light.cycleDuration.amber + light.cycleDuration.red;
      const t = light.timer % totalCycle;

      if (t < light.cycleDuration.green) {
        light.state = 'GREEN';
      } else if (t < light.cycleDuration.green + light.cycleDuration.amber) {
        light.state = 'AMBER';
      } else {
        light.state = 'RED';
      }
    }
    setSignalVisuals();
  }

  function setSignalVisuals(): void {
    for (const light of trafficLights) {
      const meshes = signalMeshMap.get(light.id);
      if (!meshes) continue;

      if (light.state === 'RED') {
        meshes.redMat.color.setHex(0xff1111);
        meshes.amberMat.color.setHex(0x332200);
        meshes.greenMat.color.setHex(0x003300);
      } else if (light.state === 'AMBER') {
        meshes.redMat.color.setHex(0x330000);
        meshes.amberMat.color.setHex(0xffaa00);
        meshes.greenMat.color.setHex(0x003300);
      } else {
        meshes.redMat.color.setHex(0x330000);
        meshes.amberMat.color.setHex(0x332200);
        meshes.greenMat.color.setHex(0x00ff44);
      }
    }
  }

  function setWeather(weather: WeatherType): void {
    rainSystem.visible = weather === 'MONSOON_RAIN';
    if (weather === 'MONSOON_RAIN') {
      asphaltMat.roughness = 0.25;
      asphaltMat.metalness = 0.55; // Wet reflective asphalt look!
    } else {
      asphaltMat.roughness = 0.85;
      asphaltMat.metalness = 0.1;
    }
  }

  function updateRain(delta: number): void {
    if (!rainSystem.visible) return;
    const positions = rainGeo.attributes.position.array as Float32Array;
    for (let r = 0; r < rainCount; r++) {
      positions[r * 3 + 1] -= 45 * delta;
      if (positions[r * 3 + 1] < 0) {
        positions[r * 3 + 1] = 45;
      }
    }
    rainGeo.attributes.position.needsUpdate = true;
  }

  return {
    scene: cityGroup,
    obstacles,
    trafficLights,
    updateSignals,
    setSignalVisuals,
    setWeather,
    updateRain,
    pickupMarker,
    dropoffMarker,
  };
}
