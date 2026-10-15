// ROADWISE — Indian Left-Hand-Traffic (LHT) Complete 3D City World Builder
import * as THREE from 'three';
import { TrafficLightData, WeatherType } from '../types/game';
import { ObstacleBox } from './VehiclePhysics';
import { RoadNetwork } from './world/RoadNetwork';
import { RoadGeometryBuilder } from './world/RoadGeometry';
import { DistrictBuilder } from './world/Districts';
import { EnvironmentAssetBuilder } from './world/EnvironmentAssets';

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
  roadNetwork: RoadNetwork;
  findPath: (start: [number, number], end: [number, number]) => THREE.Vector3[];
  getSpeedLimitAt: (x: number, z: number) => number;
}

export function buildCity(): CityBundle {
  const cityGroup = new THREE.Group();
  let obstacles: ObstacleBox[] = [];
  const trafficLights: TrafficLightData[] = [];
  const signalMeshMap: Map<string, { redMat: THREE.MeshBasicMaterial; amberMat: THREE.MeshBasicMaterial; greenMat: THREE.MeshBasicMaterial }> = new Map();

  // 1. Initialize Road Network Graph
  const roadNetwork = new RoadNetwork();

  // 2. Build 3D Road Geometry (Centerline splines, curves, sidewalks, roundabouts, bridges)
  const roadBuilder = new RoadGeometryBuilder();
  const roadData = roadBuilder.generate(roadNetwork);
  cityGroup.add(roadData.group);
  obstacles.push(...roadData.obstacles);

  // 3. Ground Base Landscape Plane (~380m x 380m)
  const groundGeo = new THREE.PlaneGeometry(380, 380);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.95,
    metalness: 0.05,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -0.04;
  ground.receiveShadow = true;
  cityGroup.add(ground);

  // 4. Build 7 Distinct Indian City Districts
  const districtBuilder = new DistrictBuilder();
  const districtData = districtBuilder.buildAllDistricts();
  cityGroup.add(districtData.group);
  obstacles.push(...districtData.obstacles);

  // 5. Build Environment Assets (Streetlights, Trees, Bus Stops, Parked Bikes, Signs)
  const assetBuilder = new EnvironmentAssetBuilder();
  const assetData = assetBuilder.buildAllAssets();
  cityGroup.add(assetData.group);
  obstacles.push(...assetData.obstacles);

  // 6. Build 3D Traffic Light Signal Poles at Major Junctions
  const signalJunctions: { id: string; x: number; z: number; heading: number }[] = [
    { id: 'sig_center', x: 0, z: 0, heading: Math.PI },       // MG Road & Central Ave
    { id: 'sig_north', x: 0, z: -60, heading: Math.PI },      // School Corridor
    { id: 'sig_south', x: 0, z: 60, heading: 0 },             // Residential Gateway
    { id: 'sig_west', x: -60, z: 0, heading: -Math.PI / 2 },  // Heritage Junction
    { id: 'sig_hosp', x: -60, z: 60, heading: 0 },            // Hospital Emergency Junction
    { id: 'sig_sch_west', x: -60, z: -60, heading: Math.PI }, // School West
  ];

  for (const sj of signalJunctions) {
    const poleGroup = new THREE.Group();
    poleGroup.position.set(sj.x + 8.5, 0, sj.z - 8.5);

    // Vertical metal pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 5.8, 12),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 })
    );
    pole.position.y = 2.9;
    poleGroup.add(pole);

    // Horizontal mast arm
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 4.2),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
    );
    arm.rotation.z = Math.PI / 2;
    arm.position.set(-2.0, 5.2, 0);
    poleGroup.add(arm);

    // Signal housing box
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 1.6, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
    );
    box.position.set(-3.5, 5.0, 0);
    poleGroup.add(box);

    // Lamps
    const lampGeo = new THREE.SphereGeometry(0.16, 12, 12);
    const redMat = new THREE.MeshBasicMaterial({ color: 0x330000 });
    const amberMat = new THREE.MeshBasicMaterial({ color: 0x332200 });
    const greenMat = new THREE.MeshBasicMaterial({ color: 0x003300 });

    const redLamp = new THREE.Mesh(lampGeo, redMat);
    redLamp.position.set(-3.5, 5.5, 0.22);
    poleGroup.add(redLamp);

    const amberLamp = new THREE.Mesh(lampGeo, amberMat);
    amberLamp.position.set(-3.5, 5.0, 0.22);
    poleGroup.add(amberLamp);

    const greenLamp = new THREE.Mesh(lampGeo, greenMat);
    greenLamp.position.set(-3.5, 4.5, 0.22);
    poleGroup.add(greenLamp);

    cityGroup.add(poleGroup);

    signalMeshMap.set(sj.id, { redMat, amberMat, greenMat });

    trafficLights.push({
      id: sj.id,
      position: [sj.x + 8.5, 0, sj.z - 8.5],
      rotationY: 0,
      state: 'GREEN',
      timer: Math.random() * 8, // slight offset between junctions
      cycleDuration: { green: 14, amber: 3.5, red: 14 },
      stopLinePos: [sj.x - 3.5, 0, sj.z - 9.0],
      approachHeading: sj.heading,
    });
  }

  // 7. Monsoon Rain System (3,000 Drops)
  const rainCount = 2800;
  const rainGeo = new THREE.BufferGeometry();
  const rainPos = new Float32Array(rainCount * 3);
  for (let r = 0; r < rainCount; r++) {
    rainPos[r * 3 + 0] = (Math.random() - 0.5) * 260;
    rainPos[r * 3 + 1] = Math.random() * 50;
    rainPos[r * 3 + 2] = (Math.random() - 0.5) * 260;
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

  // 8. Delivery Checkpoint Markers (Pickup & Drop-off)
  function createMarker(colorHex: number): THREE.Group {
    const group = new THREE.Group();

    // Ground concentric rings (Inner & Outer)
    const ringGeo = new THREE.RingGeometry(1.8, 2.4, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    ring.position.y = 0.08;
    group.add(ring);

    // Vertical volumetric light beam reaching high into the sky (26m tall)
    const beamGeo = new THREE.CylinderGeometry(1.4, 2.8, 26, 16, 1, true);
    const beam = new THREE.Mesh(
      beamGeo,
      new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    beam.position.y = 13.0;
    group.add(beam);

    // Floating rotating destination beacon gem
    const icon = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.85, 0),
      new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.15,
        metalness: 0.7,
        emissive: colorHex,
        emissiveIntensity: 0.45,
      })
    );
    icon.position.y = 2.5;
    group.add(icon);

    // Point Light to illuminate surrounding asphalt
    const pointLight = new THREE.PointLight(colorHex, 2.0, 16);
    pointLight.position.y = 2.2;
    group.add(pointLight);

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
    roadBuilder.setWeatherWet(weather === 'MONSOON_RAIN');
  }

  function updateRain(delta: number): void {
    if (!rainSystem.visible) return;
    const positions = rainGeo.attributes.position.array as Float32Array;
    for (let r = 0; r < rainCount; r++) {
      positions[r * 3 + 1] -= 48 * delta;
      if (positions[r * 3 + 1] < 0) {
        positions[r * 3 + 1] = 48;
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
    roadNetwork,
    findPath: (start, end) => roadNetwork.findPath(start, end),
    getSpeedLimitAt: (x, z) => roadNetwork.getSpeedLimitAt(x, z),
  };
}
