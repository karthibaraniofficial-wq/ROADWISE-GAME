// ROADWISE — 7 Distinct Indian City Districts & Architectural Generator
import * as THREE from 'three';
import { DistrictType } from './RoadNetwork';
import { ObstacleBox } from '../VehiclePhysics';

export interface DistrictBundle {
  group: THREE.Group;
  obstacles: ObstacleBox[];
}

export class DistrictBuilder {
  // Reusable materials palette
  private windowMat: THREE.MeshStandardMaterial;
  private glassMat: THREE.MeshStandardMaterial;
  private brickMat: THREE.MeshStandardMaterial;
  private stuccoMat: THREE.MeshStandardMaterial;
  private hospitalWhiteMat: THREE.MeshStandardMaterial;
  private hospitalBlueMat: THREE.MeshStandardMaterial;
  private schoolYellowMat: THREE.MeshStandardMaterial;
  private heritageStoneMat: THREE.MeshStandardMaterial;
  private templeGoldMat: THREE.MeshStandardMaterial;
  private concreteMat: THREE.MeshStandardMaterial;
  private redCrossMat: THREE.MeshBasicMaterial;

  constructor() {
    this.windowMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfde047,
      emissiveIntensity: 0.35,
      roughness: 0.2,
    });

    this.glassMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.85,
      roughness: 0.15,
      transparent: true,
      opacity: 0.85,
    });

    this.brickMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.85,
      metalness: 0.05,
    });

    this.stuccoMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a, // Warm Indian cream / sand
      roughness: 0.9,
    });

    this.hospitalWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
    });

    this.hospitalBlueMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.5,
    });

    this.schoolYellowMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Indian school bus / campus yellow
      roughness: 0.75,
    });

    this.heritageStoneMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // Red Fort sandstone
      roughness: 0.9,
    });

    this.templeGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.7,
      roughness: 0.3,
    });

    this.concreteMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.85,
    });

    this.redCrossMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  }

  public buildAllDistricts(): DistrictBundle {
    const group = new THREE.Group();
    const obstacles: ObstacleBox[] = [];

    // 1. Commercial Market District (Center & MG Road, Around [0, 0] to [30, -30])
    this.buildCommercialMarket(group, obstacles);

    // 2. IT Park & Modern Tech Towers (Around [60, 60] and East)
    this.buildITPark(group, obstacles);

    // 3. Residential Neighborhood (Green Valley, South at [0, 60] to [35, 90])
    this.buildResidentialColony(group, obstacles);

    // 4. School Zone (North at [0, -75] to [-40, -75])
    this.buildSchoolZone(group, obstacles);

    // 5. Hospital & Emergency Ward (South-West at [-60, 60] to [-90, 75])
    this.buildHospitalDistrict(group, obstacles);

    // 6. Heritage & Temple District (North-West at [-60, -60] to [-90, -70])
    this.buildHeritageQuarter(group, obstacles);

    return { group, obstacles };
  }

  // ---------------------------------------------------------------------------
  // 1. COMMERCIAL MARKET (MG Road Bazaar)
  // ---------------------------------------------------------------------------
  private buildCommercialMarket(parent: THREE.Group, obstacles: ObstacleBox[]): void {
    const shops = [
      { x: -18, z: -18, w: 18, d: 16, h: 16, name: 'Bazaar Complex A', color: 0x0f766e, awning: 0xef4444 },
      { x: 18, z: -18, w: 16, d: 16, h: 18, name: 'Chai Point Corner', color: 0xb45309, awning: 0xf59e0b },
      { x: -18, z: 18, w: 16, d: 16, h: 14, name: 'Bakers Street Sweets', color: 0x0369a1, awning: 0x10b981 },
      { x: 35, z: 18, w: 18, d: 14, h: 20, name: 'Commercial Plaza', color: 0x475569, awning: 0x6366f1 },
    ];

    for (const s of shops) {
      const bldgMat = new THREE.MeshStandardMaterial({ color: s.color, roughness: 0.6 });
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), bldgMat);
      bldg.position.set(s.x, s.h / 2, s.z);
      bldg.castShadow = true;
      bldg.receiveShadow = true;
      parent.add(bldg);

      // Colorful striped awning over shopfront
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(s.w - 2, 0.4, 2.5),
        new THREE.MeshStandardMaterial({ color: s.awning, roughness: 0.5 })
      );
      awning.position.set(s.x, 3.8, s.z + (s.d / 2) + 1.2);
      awning.rotation.x = 0.2;
      parent.add(awning);

      // Window bands
      const floorCount = Math.floor(s.h / 3.8);
      for (let f = 1; f < floorCount; f++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(s.w + 0.1, 0.9, s.d + 0.1), this.windowMat);
        win.position.set(s.x, f * 3.8, s.z);
        parent.add(win);
      }

      obstacles.push({
        minX: s.x - s.w / 2 - 0.4,
        maxX: s.x + s.w / 2 + 0.4,
        minZ: s.z - s.d / 2 - 0.4,
        maxZ: s.z + s.d / 2 + 0.4,
        name: s.name,
      });
    }

    // Roadside Chai Stall (near Chai Point at [15, 20])
    const stallGroup = new THREE.Group();
    stallGroup.position.set(15, 0, 18);

    const stallCounter = new THREE.Mesh(
      new THREE.BoxGeometry(2.8, 1.1, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
    );
    stallCounter.position.y = 0.55;
    stallGroup.add(stallCounter);

    const tarpaulin = new THREE.Mesh(
      new THREE.ConeGeometry(2.2, 0.8, 4),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 }) // Blue tarpaulin
    );
    tarpaulin.position.y = 2.4;
    tarpaulin.rotation.y = Math.PI / 4;
    stallGroup.add(tarpaulin);

    parent.add(stallGroup);

    obstacles.push({
      minX: 13.5,
      maxX: 16.5,
      minZ: 17.0,
      maxZ: 19.2,
      name: 'Chai Stall',
    });
  }

  // ---------------------------------------------------------------------------
  // 2. IT PARK & BUSINESS DISTRICT (Cyber City Towers)
  // ---------------------------------------------------------------------------
  private buildITPark(parent: THREE.Group, obstacles: ObstacleBox[]): void {
    const towers = [
      { x: 90, z: 30, w: 24, d: 24, h: 56, name: 'Cyber One Tower' },
      { x: 95, z: 85, w: 26, d: 22, h: 48, name: 'Tech Park Infinity' },
      { x: 45, z: 95, w: 22, d: 24, h: 42, name: 'Global Tech Hub' },
    ];

    for (const t of towers) {
      // Glass facade tower
      const tower = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), this.glassMat);
      tower.position.set(t.x, t.h / 2, t.z);
      tower.castShadow = true;
      tower.receiveShadow = true;
      parent.add(tower);

      // Steel architectural spires / antennas on roof
      const spire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.4, 9, 8),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 })
      );
      spire.position.set(t.x, t.h + 4.5, t.z);
      parent.add(spire);

      // Concrete entrance podium
      const podium = new THREE.Mesh(
        new THREE.BoxGeometry(t.w + 4, 3.5, t.d + 4),
        this.concreteMat
      );
      podium.position.set(t.x, 1.75, t.z);
      parent.add(podium);

      obstacles.push({
        minX: t.x - t.w / 2 - 1.0,
        maxX: t.x + t.w / 2 + 1.0,
        minZ: t.z - t.d / 2 - 1.0,
        maxZ: t.z + t.d / 2 + 1.0,
        name: t.name,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 3. RESIDENTIAL COLONY (Green Valley & Shanti Nagar)
  // ---------------------------------------------------------------------------
  private buildResidentialColony(parent: THREE.Group, obstacles: ObstacleBox[]): void {
    const houses = [
      { x: -25, z: 85, w: 14, d: 14, h: 8, name: 'Bungalow 14' },
      { x: 22, z: 85, w: 15, d: 15, h: 9, name: 'Shanti Niwas' },
      { x: -38, z: 85, w: 12, d: 14, h: 8, name: 'Green View Villa' },
    ];

    for (const h of houses) {
      // House base
      const house = new THREE.Mesh(new THREE.BoxGeometry(h.w, h.h, h.d), this.stuccoMat);
      house.position.set(h.x, h.h / 2, h.z);
      house.castShadow = true;
      house.receiveShadow = true;
      parent.add(house);

      // Sloped tiled roof
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(Math.max(h.w, h.d) * 0.72, 3.8, 4),
        this.brickMat
      );
      roof.position.set(h.x, h.h + 1.9, h.z);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      parent.add(roof);

      // Front compound boundary wall
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(h.w + 2, 1.6, 0.4),
        this.concreteMat
      );
      wall.position.set(h.x, 0.8, h.z - (h.d / 2) - 2.5);
      parent.add(wall);

      obstacles.push({
        minX: h.x - h.w / 2 - 0.5,
        maxX: h.x + h.w / 2 + 0.5,
        minZ: h.z - h.d / 2 - 0.5,
        maxZ: h.z + h.d / 2 + 0.5,
        name: h.name,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 4. SCHOOL ZONE (St. Jude Public School & Campus)
  // ---------------------------------------------------------------------------
  private buildSchoolZone(parent: THREE.Group, obstacles: ObstacleBox[]): void {
    // Large School Main Building at [0, -95]
    const schoolMain = new THREE.Mesh(
      new THREE.BoxGeometry(32, 14, 18),
      this.schoolYellowMat
    );
    schoolMain.position.set(0, 7, -95);
    schoolMain.castShadow = true;
    schoolMain.receiveShadow = true;
    parent.add(schoolMain);

    // School Clock Tower
    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(6, 22, 6),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 })
    );
    tower.position.set(0, 11, -95);
    parent.add(tower);

    // School Zone Boundary Walls
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(16, 2.2, 0.5), this.concreteMat);
    wallL.position.set(-14, 1.1, -78);
    parent.add(wallL);

    const wallR = new THREE.Mesh(new THREE.BoxGeometry(16, 2.2, 0.5), this.concreteMat);
    wallR.position.set(14, 1.1, -78);
    parent.add(wallR);

    // Regulatory School Zone Warning Sign (Triangular / Circular 30 km/h)
    const signPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 3.4),
      this.concreteMat
    );
    signPole.position.set(-6.5, 1.7, -72);
    parent.add(signPole);

    const signBoard = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.65, 0.08, 24),
      new THREE.MeshBasicMaterial({ color: 0xdc2626 }) // Red ring
    );
    signBoard.rotateX(Math.PI / 2);
    signBoard.position.set(-6.5, 3.0, -72);
    parent.add(signBoard);

    obstacles.push({
      minX: -16.5,
      maxX: 16.5,
      minZ: -105,
      maxZ: -85,
      name: 'St. Jude Public School',
    });
  }

  // ---------------------------------------------------------------------------
  // 5. HOSPITAL DISTRICT (City Central Trauma Ward)
  // ---------------------------------------------------------------------------
  private buildHospitalDistrict(parent: THREE.Group, obstacles: ObstacleBox[]): void {
    // Hospital Main Building at [-85, 75]
    const hosp = new THREE.Mesh(
      new THREE.BoxGeometry(26, 18, 22),
      this.hospitalWhiteMat
    );
    hosp.position.set(-85, 9, 75);
    hosp.castShadow = true;
    hosp.receiveShadow = true;
    parent.add(hosp);

    // Blue Hospital Accent Band
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(26.2, 1.5, 22.2),
      this.hospitalBlueMat
    );
    band.position.set(-85, 12, 75);
    parent.add(band);

    // Red Cross Emblem on Facade
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.2, 0.2), this.redCrossMat);
    crossV.position.set(-85, 15, 63.8);
    parent.add(crossV);

    const crossH = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.8, 0.2), this.redCrossMat);
    crossH.position.set(-85, 15, 63.8);
    parent.add(crossH);

    // Emergency Ambulance Portico / Bay Canopy
    const bayRoof = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.5, 10),
      this.concreteMat
    );
    bayRoof.position.set(-85, 4.2, 59);
    parent.add(bayRoof);

    // Bay support pillars
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 4.2), this.concreteMat);
    p1.position.set(-91, 2.1, 55);
    parent.add(p1);

    const p2 = p1.clone();
    p2.position.set(-79, 2.1, 55);
    parent.add(p2);

    obstacles.push({
      minX: -99,
      maxX: -71,
      minZ: 63,
      maxZ: 87,
      name: 'City Trauma Ward & Emergency',
    });
  }

  // ---------------------------------------------------------------------------
  // 6. HERITAGE & TEMPLE DISTRICT (Old City Quarter)
  // ---------------------------------------------------------------------------
  private buildHeritageQuarter(parent: THREE.Group, obstacles: ObstacleBox[]): void {
    // Traditional Indian Temple / Gopuram at [-95, -60]
    const templeBase = new THREE.Mesh(
      new THREE.BoxGeometry(18, 8, 18),
      this.heritageStoneMat
    );
    templeBase.position.set(-95, 4, -60);
    templeBase.castShadow = true;
    parent.add(templeBase);

    // Stepped pyramidal Gopuram spire
    for (let level = 1; level <= 4; level++) {
      const stepSize = 18 - level * 3.2;
      const stepH = 2.4;
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(stepSize, stepH, stepSize),
        this.heritageStoneMat
      );
      step.position.set(-95, 8 + (level - 0.5) * stepH, -60);
      parent.add(step);
    }

    // Golden Kalash pinnacle on top
    const kalash = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      this.templeGoldMat
    );
    kalash.position.set(-95, 18.5, -60);
    parent.add(kalash);

    // Heritage entrance archway (over approach road at [-72, -60])
    const archL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 6.0, 1.4), this.heritageStoneMat);
    archL.position.set(-72, 3.0, -55);
    parent.add(archL);

    const archR = new THREE.Mesh(new THREE.BoxGeometry(1.4, 6.0, 1.4), this.heritageStoneMat);
    archR.position.set(-72, 3.0, -65);
    parent.add(archR);

    const archTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 12), this.heritageStoneMat);
    archTop.position.set(-72, 6.5, -60);
    parent.add(archTop);

    obstacles.push({
      minX: -105,
      maxX: -85,
      minZ: -70,
      maxZ: -50,
      name: 'Heritage Temple Complex',
    });
  }
}
