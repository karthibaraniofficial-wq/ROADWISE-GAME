// ROADWISE — AI Traffic & Pedestrian Simulation System (Connected Road Graph Navigation)
import * as THREE from 'three';
import { TrafficLightData } from '../types/game';
import { RoadNetwork, RoadEdge } from './world/RoadNetwork';

export interface AICarEntity {
  mesh: THREE.Group;
  type: 'auto_rickshaw' | 'city_car' | 'ambulance';
  edge: RoadEdge;
  progress: number; // 0 to 1 along edge curve
  speed: number; // m/s
  maxSpeed: number;
  position: THREE.Vector3;
  isAmbulance: boolean;
  beaconLight?: THREE.PointLight;
  lateralOffset: number; // Left lane offset (Indian Left Hand Traffic)
}

export interface PedestrianEntity {
  mesh: THREE.Group;
  position: THREE.Vector3;
  speed: number;
  axis: 'X' | 'Z';
  rangeMin: number;
  rangeMax: number;
  direction: 1 | -1;
}

export class TrafficAIManager {
  public group: THREE.Group = new THREE.Group();
  public cars: AICarEntity[] = [];
  public pedestrians: PedestrianEntity[] = [];
  public ambulance: AICarEntity | null = null;
  private roadNetwork: RoadNetwork | null = null;

  constructor(roadNetwork?: RoadNetwork) {
    this.roadNetwork = roadNetwork || new RoadNetwork();
    this.spawnEntities();
  }

  private spawnEntities(): void {
    if (!this.roadNetwork) return;

    // 1. Autorickshaw on Central MG Boulevard
    const edgeMG = this.roadNetwork.edges.get('E_MG_WEST');
    if (edgeMG) {
      const auto = this.createCar('auto_rickshaw', edgeMG, 0.2, 8.5);
      this.cars.push(auto);
      this.group.add(auto.mesh);
    }

    // 2. City Car on MG East
    const edgeMGEast = this.roadNetwork.edges.get('E_MG_EAST');
    if (edgeMGEast) {
      const car1 = this.createCar('city_car', edgeMGEast, 0.4, 9.5);
      this.cars.push(car1);
      this.group.add(car1.mesh);
    }

    // 3. City Car navigating IT Park Roundabout
    const edgeRoundabout = this.roadNetwork.edges.get('E_R_N_E');
    if (edgeRoundabout) {
      const car2 = this.createCar('city_car', edgeRoundabout, 0.1, 7.5);
      this.cars.push(car2);
      this.group.add(car2.mesh);
    }

    // 4. City Car cruising Outer Ring Road Highway
    const edgeHwy = this.roadNetwork.edges.get('E_HWY_NORTH_ARC');
    if (edgeHwy) {
      const car3 = this.createCar('city_car', edgeHwy, 0.5, 13.0);
      this.cars.push(car3);
      this.group.add(car3.mesh);
    }

    // 5. Emergency Ambulance cruising along Central Boulevard / Ring Road
    const edgeCentral = this.roadNetwork.edges.get('E_CENTRAL_S');
    if (edgeCentral) {
      const amb = this.createCar('ambulance', edgeCentral, 0.05, 14.5);
      this.ambulance = amb;
      this.cars.push(amb);
      this.group.add(amb.mesh);
    }

    // 6. Zebra Crossing Pedestrians
    const p1 = this.createPedestrian(new THREE.Vector3(-3.5, 0, -8.0), 'X', -7.0, 7.0);
    const p2 = this.createPedestrian(new THREE.Vector3(3.5, 0, 8.0), 'X', -7.0, 7.0);
    const p3 = this.createPedestrian(new THREE.Vector3(-60, 0, -52.0), 'X', -67.0, -53.0);

    this.pedestrians.push(p1, p2, p3);
    this.group.add(p1.mesh);
    this.group.add(p2.mesh);
    this.group.add(p3.mesh);
  }

  private createCar(
    type: 'auto_rickshaw' | 'city_car' | 'ambulance',
    edge: RoadEdge,
    progress: number,
    speed: number
  ): AICarEntity {
    const mesh = new THREE.Group();
    let isAmbulance = false;
    let beaconLight: THREE.PointLight | undefined = undefined;

    if (type === 'auto_rickshaw') {
      // Classic Indian Auto-rickshaw (Yellow canopy, Green bottom)
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 });
      const blackMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });

      const lower = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 2.2), bodyMat);
      lower.position.y = 0.55;
      mesh.add(lower);

      const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 1.6), roofMat);
      canopy.position.set(0, 1.25, -0.2);
      mesh.add(canopy);

      const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 12);
      wheelGeo.rotateZ(Math.PI / 2);

      const wFront = new THREE.Mesh(wheelGeo, blackMat);
      wFront.position.set(0, 0.25, 0.9);
      mesh.add(wFront);

      const wRearL = new THREE.Mesh(wheelGeo, blackMat);
      wRearL.position.set(-0.65, 0.25, -0.7);
      mesh.add(wRearL);

      const wRearR = wRearL.clone();
      wRearR.position.x = 0.65;
      mesh.add(wRearR);

    } else if (type === 'ambulance') {
      isAmbulance = true;
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 3.8), whiteMat);
      body.position.y = 1.0;
      mesh.add(body);

      const stripeH = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.3, 1.8), redMat);
      stripeH.position.y = 1.1;
      mesh.add(stripeH);

      const beacon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.2, 12),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      beacon.position.set(0, 1.8, 0.4);
      mesh.add(beacon);

      beaconLight = new THREE.PointLight(0xff0000, 3.0, 20);
      beaconLight.position.set(0, 2.0, 0.4);
      mesh.add(beaconLight);

    } else {
      // City Hatchback
      const carMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.8, 3.4), carMat);
      body.position.y = 0.6;
      mesh.add(body);

      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.7, 1.9),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
      );
      cabin.position.set(0, 1.25, -0.2);
      mesh.add(cabin);
    }

    // Position car along curve on the Left Lane
    const pt = edge.curve.getPointAt(progress);
    const tangent = edge.curve.getTangentAt(progress).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const lateralOffset = (edge.width / 4); // Left side lane offset

    const initialPos = pt.clone().addScaledVector(normal, lateralOffset);
    mesh.position.copy(initialPos);
    mesh.rotation.y = Math.atan2(tangent.x, tangent.z);

    return {
      mesh,
      type,
      edge,
      progress,
      speed,
      maxSpeed: speed,
      position: initialPos,
      isAmbulance,
      beaconLight,
      lateralOffset,
    };
  }

  private createPedestrian(pos: THREE.Vector3, axis: 'X' | 'Z', min: number, max: number): PedestrianEntity {
    const mesh = new THREE.Group();

    const shirt = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.65, 0.25),
      new THREE.MeshStandardMaterial({ color: Math.random() > 0.5 ? 0xe11d48 : 0x0284c7 })
    );
    shirt.position.y = 0.85;
    mesh.add(shirt);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xd97706 })
    );
    head.position.y = 1.35;
    mesh.add(head);

    mesh.position.copy(pos);

    return {
      mesh,
      position: pos,
      speed: 1.4,
      axis,
      rangeMin: min,
      rangeMax: max,
      direction: 1,
    };
  }

  public update(delta: number, trafficLights: TrafficLightData[]): void {
    // 1. Update AI Vehicles along road curves
    for (const car of this.cars) {
      // Check for Red / Amber lights at approach
      let shouldStop = false;
      for (const light of trafficLights) {
        if (light.state === 'RED' || light.state === 'AMBER') {
          const [lx, , lz] = light.stopLinePos;
          const dist = car.position.distanceTo(new THREE.Vector3(lx, 0, lz));
          if (dist < 12.0 && dist > 1.8) {
            shouldStop = true;
            break;
          }
        }
      }

      const targetSpeed = shouldStop ? 0 : car.maxSpeed;
      car.speed = THREE.MathUtils.lerp(car.speed, targetSpeed, 3.2 * delta);

      // Advance progress along curve
      const step = (car.speed / car.edge.length) * delta;
      car.progress = (car.progress + step) % 1.0;

      const pt = car.edge.curve.getPointAt(car.progress);
      const tangent = car.edge.curve.getTangentAt(car.progress).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      car.position.copy(pt).addScaledVector(normal, car.lateralOffset);
      car.mesh.position.copy(car.position);
      car.mesh.rotation.y = Math.atan2(tangent.x, tangent.z);

      // Ambulance beacon light pulsing
      if (car.isAmbulance && car.beaconLight) {
        const flash = Math.sin(Date.now() * 0.015) > 0;
        car.beaconLight.color.setHex(flash ? 0xff0000 : 0x0066ff);
        car.beaconLight.intensity = flash ? 4.5 : 1.2;
      }
    }

    // 2. Update Pedestrians
    for (const p of this.pedestrians) {
      if (p.axis === 'X') {
        p.position.x += p.speed * p.direction * delta;
        if (p.position.x >= p.rangeMax) {
          p.position.x = p.rangeMax;
          p.direction = -1;
        } else if (p.position.x <= p.rangeMin) {
          p.position.x = p.rangeMin;
          p.direction = 1;
        }
      }
      p.mesh.position.copy(p.position);
    }
  }

  public getNearestPedestrianDistance(playerPos: THREE.Vector3): number {
    let minDist = Infinity;
    for (const p of this.pedestrians) {
      const d = playerPos.distanceTo(p.position);
      if (d < minDist) minDist = d;
    }
    return minDist;
  }

  public getAmbulanceDistance(playerPos: THREE.Vector3): number {
    if (!this.ambulance) return Infinity;
    return playerPos.distanceTo(this.ambulance.position);
  }
}
