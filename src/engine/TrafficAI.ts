// ROADWISE — AI Traffic & Pedestrian Simulation System
import * as THREE from 'three';
import { TrafficLightData } from '../types/game';

export interface AICarEntity {
  mesh: THREE.Group;
  type: 'auto_rickshaw' | 'city_car' | 'ambulance';
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  speed: number;
  maxSpeed: number;
  heading: number; // yaw angle
  laneAxis: 'X' | 'Z';
  laneDirection: 1 | -1;
  isAmbulance: boolean;
  beaconLight?: THREE.PointLight;
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

  constructor() {
    this.spawnInitialEntities();
  }

  private spawnInitialEntities(): void {
    // 1. Spawn Autorickshaw
    const auto1 = this.createCar('auto_rickshaw', new THREE.Vector3(-3.5, 0, -40), 'Z', 1);
    this.cars.push(auto1);
    this.group.add(auto1.mesh);

    // 2. Spawn Hatchback
    const car1 = this.createCar('city_car', new THREE.Vector3(3.5, 0, 60), 'Z', -1);
    this.cars.push(car1);
    this.group.add(car1.mesh);

    const car2 = this.createCar('city_car', new THREE.Vector3(40, 0, 3.5), 'X', -1);
    this.cars.push(car2);
    this.group.add(car2.mesh);

    // 3. Spawn Emergency Ambulance
    const amb = this.createCar('ambulance', new THREE.Vector3(-3.5, 0, -120), 'Z', 1);
    this.ambulance = amb;
    this.cars.push(amb);
    this.group.add(amb.mesh);

    // 4. Spawn Pedestrians across zebra crossings
    const p1 = this.createPedestrian(new THREE.Vector3(-3.5, 0, -7.5), 'X', -7.0, 7.0);
    const p2 = this.createPedestrian(new THREE.Vector3(3.5, 0, 7.5), 'X', -7.0, 7.0);
    const p3 = this.createPedestrian(new THREE.Vector3(42.5, 0, -7.5), 'X', 38.0, 52.0);

    this.pedestrians.push(p1, p2, p3);
    this.group.add(p1.mesh);
    this.group.add(p2.mesh);
    this.group.add(p3.mesh);
  }

  private createCar(type: 'auto_rickshaw' | 'city_car' | 'ambulance', pos: THREE.Vector3, axis: 'X' | 'Z', dir: 1 | -1): AICarEntity {
    const mesh = new THREE.Group();

    if (type === 'auto_rickshaw') {
      // Classic Indian Auto-rickshaw (Yellow canopy, Green bottom)
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 }); // Green
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 }); // Yellow
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
      // White emergency ambulance with red cross and beacon
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 3.8), whiteMat);
      body.position.y = 1.0;
      mesh.add(body);

      // Red cross stripe
      const stripeH = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.3, 1.8), redMat);
      stripeH.position.y = 1.1;
      mesh.add(stripeH);

      // Emergency flashing beacon
      const beaconGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.2, 12);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(0, 1.8, 0.4);
      mesh.add(beacon);

      const beaconLight = new THREE.PointLight(0xff0000, 3.0, 18);
      beaconLight.position.set(0, 2.0, 0.4);
      mesh.add(beaconLight);

      mesh.position.copy(pos);
      return {
        mesh,
        type,
        position: pos,
        velocity: new THREE.Vector3(),
        speed: 12.0,
        maxSpeed: 14.0,
        heading: dir === 1 ? 0 : Math.PI,
        laneAxis: axis,
        laneDirection: dir,
        isAmbulance: true,
        beaconLight,
      };

    } else {
      // City Hatchback
      const carMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.8, 3.4), carMat);
      body.position.y = 0.6;
      mesh.add(body);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 1.9), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 }));
      cabin.position.set(0, 1.25, -0.2);
      mesh.add(cabin);
    }

    mesh.position.copy(pos);
    return {
      mesh,
      type,
      position: pos,
      velocity: new THREE.Vector3(),
      speed: 7.5,
      maxSpeed: 9.0,
      heading: dir === 1 ? 0 : Math.PI,
      laneAxis: axis,
      laneDirection: dir,
      isAmbulance: false,
    };
  }

  private createPedestrian(pos: THREE.Vector3, axis: 'X' | 'Z', min: number, max: number): PedestrianEntity {
    const mesh = new THREE.Group();

    // Body
    const shirt = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.65, 0.25),
      new THREE.MeshStandardMaterial({ color: Math.random() > 0.5 ? 0xe11d48 : 0x0284c7 })
    );
    shirt.position.y = 0.85;
    mesh.add(shirt);

    // Head
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
    // 1. Update AI Vehicles
    for (const car of this.cars) {
      // Check red lights ahead
      let shouldStop = false;
      for (const light of trafficLights) {
        if (light.state === 'RED' || light.state === 'AMBER') {
          const [lx, , lz] = light.stopLinePos;
          const dist = car.position.distanceTo(new THREE.Vector3(lx, 0, lz));
          // If stopped behind the line
          if (dist < 10.0 && dist > 1.5) {
            shouldStop = true;
            break;
          }
        }
      }

      // Smooth acceleration / stopping
      const targetSpeed = shouldStop ? 0 : car.maxSpeed;
      car.speed = THREE.MathUtils.lerp(car.speed, targetSpeed, 3.5 * delta);

      // Move along designated lane
      if (car.laneAxis === 'Z') {
        car.position.z += car.speed * car.laneDirection * delta;
        car.mesh.rotation.y = car.laneDirection === 1 ? 0 : Math.PI;

        // Wrap around at city bounds
        if (car.position.z > 140) car.position.z = -140;
        if (car.position.z < -140) car.position.z = 140;
      } else {
        car.position.x += car.speed * car.laneDirection * delta;
        car.mesh.rotation.y = car.laneDirection === 1 ? Math.PI / 2 : -Math.PI / 2;

        if (car.position.x > 140) car.position.x = -140;
        if (car.position.x < -140) car.position.x = 140;
      }

      car.mesh.position.copy(car.position);

      // Ambulance beacon flashing
      if (car.isAmbulance && car.beaconLight) {
        const flash = Math.sin(Date.now() * 0.012) > 0;
        car.beaconLight.color.setHex(flash ? 0xff0000 : 0x0066ff);
        car.beaconLight.intensity = flash ? 4.0 : 1.0;
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
