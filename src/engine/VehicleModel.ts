// ROADWISE — Procedural 3D Vehicle & Rider Generator
import * as THREE from 'three';
import { VehicleId } from '../types/game';

export interface VehicleMeshBundle {
  root: THREE.Group;
  bodyMesh: THREE.Mesh;
  headlight: THREE.SpotLight;
  headlightLens: THREE.Mesh;
  brakeLight: THREE.Mesh;
  frontWheel: THREE.Group;
  rearWheel: THREE.Group;
  handlebars: THREE.Group;
  riderHelmet: THREE.Mesh;
  updateVisuals: (speedKmh: number, steerAngle: number, isBraking: boolean, hasHelmet: boolean, delta: number) => void;
  setColor: (hexColor: string) => void;
}

export function createVehicleModel(vehicleId: VehicleId, primaryColor: string = '#0ea5e9'): VehicleMeshBundle {
  const root = new THREE.Group();

  // Materials
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(primaryColor),
    roughness: 0.35,
    metalness: 0.45,
  });

  const blackPlastic = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
    metalness: 0.1,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.15,
    metalness: 0.9,
  });

  const rubberMaterial = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.9,
    metalness: 0.05,
  });

  const lensMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff5cc,
    emissiveIntensity: 1.5,
    roughness: 0.1,
  });

  const brakeMaterial = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xff0000,
    emissiveIntensity: 0.4,
    roughness: 0.2,
  });

  // --- 1. CHASSIS & FLOORBOARD ---
  const floorboardGeo = new THREE.BoxGeometry(0.55, 0.1, 1.2);
  const floorboard = new THREE.Mesh(floorboardGeo, blackPlastic);
  floorboard.position.set(0, 0.28, 0.0);
  floorboard.castShadow = true;
  root.add(floorboard);

  // Main body / apron
  const bodyGeo = new THREE.BoxGeometry(0.52, 0.55, 0.85);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
  bodyMesh.position.set(0, 0.55, -0.15);
  bodyMesh.castShadow = true;
  root.add(bodyMesh);

  // Front shield / cowl
  const frontShieldGeo = new THREE.BoxGeometry(0.48, 0.7, 0.35);
  const frontShield = new THREE.Mesh(frontShieldGeo, bodyMaterial);
  frontShield.position.set(0, 0.65, 0.65);
  frontShield.rotation.x = -0.22;
  frontShield.castShadow = true;
  root.add(frontShield);

  // Seat
  const seatGeo = new THREE.BoxGeometry(0.42, 0.14, 0.75);
  const seat = new THREE.Mesh(seatGeo, blackPlastic);
  seat.position.set(0, 0.82, -0.22);
  seat.castShadow = true;
  root.add(seat);

  // Rear Cargo Delivery Box (Roadwise Courier Box)
  const boxGeo = new THREE.BoxGeometry(0.52, 0.48, 0.48);
  const boxMaterial = new THREE.MeshStandardMaterial({
    color: 0xf97316, // Roadwise Delivery Orange
    roughness: 0.4,
    metalness: 0.2,
  });
  const cargoBox = new THREE.Mesh(boxGeo, boxMaterial);
  cargoBox.position.set(0, 0.95, -0.72);
  cargoBox.castShadow = true;
  root.add(cargoBox);

  // Delivery Box rack/supports
  const rackGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.5);
  const rackL = new THREE.Mesh(rackGeo, chromeMaterial);
  rackL.position.set(-0.22, 0.62, -0.68);
  root.add(rackL);
  const rackR = rackL.clone();
  rackR.position.x = 0.22;
  root.add(rackR);

  // --- 2. LIGHTING ---
  // Headlamp lens
  const lensGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.05, 16);
  lensGeo.rotateX(Math.PI / 2);
  const headlightLens = new THREE.Mesh(lensGeo, lensMaterial);
  headlightLens.position.set(0, 0.88, 0.82);
  root.add(headlightLens);

  // Real Spotlight casting forward
  const headlight = new THREE.SpotLight(0xfff7ed, 4.0, 45, Math.PI / 5, 0.4, 1.2);
  headlight.position.set(0, 0.88, 0.85);
  const target = new THREE.Object3D();
  target.position.set(0, 0.2, 15);
  root.add(target);
  headlight.target = target;
  root.add(headlight);

  // Tail / Brake Light
  const brakeGeo = new THREE.BoxGeometry(0.25, 0.08, 0.04);
  const brakeLight = new THREE.Mesh(brakeGeo, brakeMaterial);
  brakeLight.position.set(0, 0.65, -0.96);
  root.add(brakeLight);

  // --- 3. HANDLEBARS & STEERING ---
  const handlebars = new THREE.Group();
  handlebars.position.set(0, 1.05, 0.6);

  const barStem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35), chromeMaterial);
  barStem.position.set(0, -0.15, 0);
  handlebars.add(barStem);

  const barCross = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.72), chromeMaterial);
  barCross.rotation.z = Math.PI / 2;
  handlebars.add(barCross);

  // Grips
  const gripGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.12);
  gripGeo.rotateZ(Math.PI / 2);
  const gripL = new THREE.Mesh(gripGeo, blackPlastic);
  gripL.position.set(-0.32, 0, 0);
  handlebars.add(gripL);
  const gripR = gripL.clone();
  gripR.position.x = 0.32;
  handlebars.add(gripR);

  // Rearview mirrors
  const mirrorStemL = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16), chromeMaterial);
  mirrorStemL.position.set(-0.28, 0.1, 0.02);
  mirrorStemL.rotation.z = -0.3;
  handlebars.add(mirrorStemL);

  const mirrorGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.015, 12);
  mirrorGeo.rotateX(Math.PI / 2);
  const mirrorL = new THREE.Mesh(mirrorGeo, chromeMaterial);
  mirrorL.position.set(-0.32, 0.17, 0.02);
  handlebars.add(mirrorL);

  const mirrorStemR = mirrorStemL.clone();
  mirrorStemR.position.x = 0.28;
  mirrorStemR.rotation.z = 0.3;
  handlebars.add(mirrorStemR);
  const mirrorR = mirrorL.clone();
  mirrorR.position.x = 0.32;
  handlebars.add(mirrorR);

  root.add(handlebars);

  // --- 4. WHEELS ---
  function createWheel(radius: number, width: number): THREE.Group {
    const wheelGroup = new THREE.Group();

    // Tire
    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 20);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, rubberMaterial);
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Rim
    const rimGeo = new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, width * 1.05, 16);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, chromeMaterial);
    wheelGroup.add(rim);

    // Hub cap
    const hubGeo = new THREE.CylinderGeometry(0.04, 0.04, width * 1.2, 8);
    hubGeo.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, blackPlastic);
    wheelGroup.add(hub);

    return wheelGroup;
  }

  const frontWheel = createWheel(0.24, 0.1);
  frontWheel.position.set(0, 0.24, 0.85);
  root.add(frontWheel);

  const rearWheel = createWheel(0.24, 0.12);
  rearWheel.position.set(0, 0.24, -0.65);
  root.add(rearWheel);

  // Front fork
  const forkL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65), chromeMaterial);
  forkL.position.set(-0.08, 0.52, 0.8);
  forkL.rotation.x = -0.15;
  root.add(forkL);
  const forkR = forkL.clone();
  forkR.position.x = 0.08;
  root.add(forkR);

  // --- 5. RIDER CHARACTER ---
  const riderGroup = new THREE.Group();
  riderGroup.position.set(0, 0.86, -0.18);

  // Legs / pants
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.8 });
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.18), legMaterial);
  legL.position.set(-0.16, -0.25, 0.15);
  riderGroup.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.16;
  riderGroup.add(legR);

  // Torso / Jacket
  const jacketMaterial = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Courier blue jacket with reflective stripe
    roughness: 0.6,
  });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.28), jacketMaterial);
  torso.position.set(0, 0.26, -0.05);
  torso.rotation.x = 0.2; // leaning slightly forward
  torso.castShadow = true;
  riderGroup.add(torso);

  // Reflective stripe across back
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.43, 0.06, 0.29),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 })
  );
  stripe.position.set(0, 0.28, -0.05);
  stripe.rotation.x = 0.2;
  riderGroup.add(stripe);

  // Arms extending to handlebars
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.45), jacketMaterial);
  armL.position.set(-0.26, 0.28, 0.25);
  armL.rotation.x = 0.95;
  armL.rotation.z = -0.3;
  riderGroup.add(armL);

  const armR = armL.clone();
  armR.position.x = 0.26;
  armR.rotation.z = 0.3;
  riderGroup.add(armR);

  // Head / Face
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 })
  );
  head.position.set(0, 0.56, 0.05);
  riderGroup.add(head);

  // Helmet
  const helmetGeo = new THREE.SphereGeometry(0.15, 16, 16);
  const helmetMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15, // High-visibility yellow helmet
    roughness: 0.2,
    metalness: 0.3,
  });
  const riderHelmet = new THREE.Mesh(helmetGeo, helmetMat);
  riderHelmet.position.set(0, 0.58, 0.05);
  riderHelmet.castShadow = true;
  riderGroup.add(riderHelmet);

  // Visor
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.08, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.8 })
  );
  visor.position.set(0, 0.56, 0.16);
  riderHelmet.add(visor);

  root.add(riderGroup);

  // Roll angle for motorcycle leaning into turns
  let currentLean = 0;

  function updateVisuals(speedKmh: number, steerAngle: number, isBraking: boolean, hasHelmet: boolean, delta: number): void {
    // Wheel rotation based on speed
    const wheelRotSpeed = (speedKmh / 3.6) / 0.24 * delta;
    frontWheel.rotation.x += wheelRotSpeed;
    rearWheel.rotation.x += wheelRotSpeed;

    // Handlebar turning
    handlebars.rotation.y = steerAngle;

    // Leaning into turns (subtle roll)
    const targetLean = -steerAngle * Math.min(1.0, speedKmh / 20) * 0.45;
    currentLean = THREE.MathUtils.lerp(currentLean, targetLean, 8.0 * delta);
    root.rotation.z = currentLean;

    // Brake light glow
    if (isBraking) {
      brakeMaterial.emissiveIntensity = 2.8;
      brakeMaterial.color.setHex(0xff1111);
    } else {
      brakeMaterial.emissiveIntensity = 0.4;
      brakeMaterial.color.setHex(0xef4444);
    }

    // Helmet visibility
    riderHelmet.visible = hasHelmet;
  }

  function setColor(hexColor: string): void {
    bodyMaterial.color.set(hexColor);
  }

  return {
    root,
    bodyMesh,
    headlight,
    headlightLens,
    brakeLight,
    frontWheel,
    rearWheel,
    handlebars,
    riderHelmet,
    updateVisuals,
    setColor,
  };
}
