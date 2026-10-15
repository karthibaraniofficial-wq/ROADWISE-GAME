// ROADWISE — Connected Road Network Graph & Procedural Road Graph Architect
import * as THREE from 'three';

export type DistrictType =
  | 'COMMERCIAL_MARKET'
  | 'RESIDENTIAL_COLONY'
  | 'IT_PARK'
  | 'SCHOOL_ZONE'
  | 'HOSPITAL_DISTRICT'
  | 'RING_ROAD_HIGHWAY'
  | 'HERITAGE_QUARTER'
  | 'INDUSTRIAL_ZONE';

export type RoadType =
  | 'HIGHWAY'
  | 'ARTERIAL'
  | 'RESIDENTIAL'
  | 'COMMERCIAL'
  | 'ALLEY'
  | 'ROUNDABOUT'
  | 'BRIDGE';

export interface RoadNode {
  id: string;
  pos: THREE.Vector2; // X, Z
  type: 'INTERSECTION_4WAY' | 'T_JUNCTION' | 'ROUNDABOUT_NODE' | 'CURVE_NODE' | 'DEAD_END';
  district: DistrictType;
  connections: string[]; // Edge IDs
  hasSignal?: boolean;
}

export interface RoadEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  curve: THREE.CatmullRomCurve3;
  width: number;
  lanes: number; // e.g. 2 for 1 each way, 4 for 2 each way
  speedLimitKmh: number;
  isOneWay: boolean;
  type: RoadType;
  district: DistrictType;
  isElevated?: boolean;
  elevationHeight?: number;
  length: number;
}

export class RoadNetwork {
  public nodes: Map<string, RoadNode> = new Map();
  public edges: Map<string, RoadEdge> = new Map();

  constructor() {
    this.buildCityNetwork();
  }

  private addNode(
    id: string,
    x: number,
    z: number,
    type: RoadNode['type'],
    district: DistrictType,
    hasSignal: boolean = false
  ): RoadNode {
    const node: RoadNode = {
      id,
      pos: new THREE.Vector2(x, z),
      type,
      district,
      connections: [],
      hasSignal,
    };
    this.nodes.set(id, node);
    return node;
  }

  private addEdge(
    id: string,
    fromNodeId: string,
    toNodeId: string,
    controlPoints: THREE.Vector3[],
    width: number,
    lanes: number,
    speedLimitKmh: number,
    type: RoadType,
    district: DistrictType,
    isOneWay: boolean = false,
    isElevated: boolean = false,
    elevationHeight: number = 0
  ): RoadEdge {
    const curve = new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.2);
    const length = curve.getLength();

    const edge: RoadEdge = {
      id,
      fromNodeId,
      toNodeId,
      curve,
      width,
      lanes,
      speedLimitKmh,
      isOneWay,
      type,
      district,
      isElevated,
      elevationHeight,
      length,
    };

    this.edges.set(id, edge);

    // Register with nodes
    const fromNode = this.nodes.get(fromNodeId);
    const toNode = this.nodes.get(toNodeId);
    if (fromNode && !fromNode.connections.includes(id)) fromNode.connections.push(id);
    if (toNode && !toNode.connections.includes(id)) toNode.connections.push(id);

    return edge;
  }

  /**
   * Constructs the connected procedural Indian city road graph.
   * Total city footprint: ~360m x 360m.
   */
  private buildCityNetwork(): void {
    // -------------------------------------------------------------
    // 1. KEY JUNCTION NODES
    // -------------------------------------------------------------
    // Central Axis Intersections
    this.addNode('N_CENTER', 0, 0, 'INTERSECTION_4WAY', 'COMMERCIAL_MARKET', true);
    this.addNode('N_NORTH', 0, -60, 'INTERSECTION_4WAY', 'SCHOOL_ZONE', true);
    this.addNode('N_SOUTH', 0, 60, 'INTERSECTION_4WAY', 'RESIDENTIAL_COLONY', true);
    this.addNode('N_WEST', -60, 0, 'T_JUNCTION', 'HERITAGE_QUARTER', true);
    this.addNode('N_EAST', 60, 0, 'T_JUNCTION', 'IT_PARK', true);

    // Roundabout Nodes (South-East Hub, Center at [60, 60], radius 16m)
    this.addNode('R_NORTH', 60, 44, 'ROUNDABOUT_NODE', 'IT_PARK');
    this.addNode('R_EAST', 76, 60, 'ROUNDABOUT_NODE', 'IT_PARK');
    this.addNode('R_SOUTH', 60, 76, 'ROUNDABOUT_NODE', 'IT_PARK');
    this.addNode('R_WEST', 44, 60, 'ROUNDABOUT_NODE', 'IT_PARK');

    // Hospital District Nodes (South-West)
    this.addNode('HOSP_MAIN', -60, 60, 'INTERSECTION_4WAY', 'HOSPITAL_DISTRICT', true);
    this.addNode('HOSP_EMERGENCY', -85, 60, 'DEAD_END', 'HOSPITAL_DISTRICT');
    this.addNode('HOSP_GATE', -60, 85, 'T_JUNCTION', 'HOSPITAL_DISTRICT');

    // School Zone Nodes (North-Central)
    this.addNode('SCH_GATE', 0, -85, 'DEAD_END', 'SCHOOL_ZONE');
    this.addNode('SCH_WEST', -60, -60, 'INTERSECTION_4WAY', 'SCHOOL_ZONE', true);

    // Heritage Quarter Nodes (North-West)
    this.addNode('HERIT_TEMPLE', -85, -60, 'T_JUNCTION', 'HERITAGE_QUARTER');
    this.addNode('HERIT_ALLEY_S', -85, -20, 'DEAD_END', 'HERITAGE_QUARTER');
    this.addNode('HERIT_ALLEY_N', -85, -90, 'T_JUNCTION', 'HERITAGE_QUARTER');

    // Commercial Bazaar Nodes
    this.addNode('BAZAAR_WEST', -30, 0, 'T_JUNCTION', 'COMMERCIAL_MARKET');
    this.addNode('BAZAAR_EAST', 30, 0, 'T_JUNCTION', 'COMMERCIAL_MARKET');
    this.addNode('BAZAAR_ALLEY', 25, -25, 'T_JUNCTION', 'COMMERCIAL_MARKET');

    // Outer Ring Road / Highway Nodes (Sweeping North-East to South-East)
    this.addNode('HWY_NW', -60, -120, 'CURVE_NODE', 'RING_ROAD_HIGHWAY');
    this.addNode('HWY_N', 0, -135, 'CURVE_NODE', 'RING_ROAD_HIGHWAY');
    this.addNode('HWY_NE', 80, -120, 'CURVE_NODE', 'RING_ROAD_HIGHWAY');
    this.addNode('HWY_E', 120, -40, 'CURVE_NODE', 'RING_ROAD_HIGHWAY');
    this.addNode('HWY_SE', 120, 60, 'CURVE_NODE', 'RING_ROAD_HIGHWAY');
    this.addNode('HWY_S', 60, 120, 'CURVE_NODE', 'RING_ROAD_HIGHWAY');
    this.addNode('HWY_SW', -60, 120, 'CURVE_NODE', 'RING_ROAD_HIGHWAY');

    // Elevated Flyover / Bridge Nodes (Passing over North road at Z = -30)
    this.addNode('FLY_START', 40, -30, 'CURVE_NODE', 'IT_PARK');
    this.addNode('FLY_MID', 0, -30, 'CURVE_NODE', 'COMMERCIAL_MARKET');
    this.addNode('FLY_END', -40, -30, 'CURVE_NODE', 'HERITAGE_QUARTER');

    // Industrial Zone Nodes (Southern Logistics Corridor)
    this.addNode('IND_JUNCTION', 0, 90, 'T_JUNCTION', 'INDUSTRIAL_ZONE', true);
    this.addNode('IND_DEPOT', -35, 90, 'DEAD_END', 'INDUSTRIAL_ZONE');
    this.addNode('IND_LOGISTICS', 35, 90, 'T_JUNCTION', 'INDUSTRIAL_ZONE');

    // -------------------------------------------------------------
    // 2. CONNECTING ARTERIAL & SECONDARY ROAD EDGES
    // -------------------------------------------------------------

    // MG Boulevard (East-West Major Spine)
    this.addEdge(
      'E_MG_WEST',
      'N_WEST',
      'N_CENTER',
      [
        new THREE.Vector3(-60, 0, 0),
        new THREE.Vector3(-30, 0, 0),
        new THREE.Vector3(0, 0, 0),
      ],
      14,
      4,
      45,
      'ARTERIAL',
      'COMMERCIAL_MARKET'
    );

    this.addEdge(
      'E_MG_EAST',
      'N_CENTER',
      'N_EAST',
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(30, 0, 0),
        new THREE.Vector3(60, 0, 0),
      ],
      14,
      4,
      45,
      'ARTERIAL',
      'COMMERCIAL_MARKET'
    );

    // Central Avenue (North-South Major Spine)
    this.addEdge(
      'E_CENTRAL_N',
      'N_CENTER',
      'N_NORTH',
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -30),
        new THREE.Vector3(0, 0, -60),
      ],
      14,
      4,
      40,
      'ARTERIAL',
      'COMMERCIAL_MARKET'
    );

    this.addEdge(
      'E_CENTRAL_S',
      'N_CENTER',
      'N_SOUTH',
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 30),
        new THREE.Vector3(0, 0, 60),
      ],
      14,
      4,
      40,
      'ARTERIAL',
      'RESIDENTIAL_COLONY'
    );

    // -------------------------------------------------------------
    // 3. CURVED ROUNDABOUT (IT Park Hub)
    // -------------------------------------------------------------
    // Connect Roundabout segments clockwise
    this.addEdge(
      'E_R_N_E',
      'R_NORTH',
      'R_EAST',
      [
        new THREE.Vector3(60, 0, 44),
        new THREE.Vector3(71.3, 0, 48.7),
        new THREE.Vector3(76, 0, 60),
      ],
      12,
      2,
      30,
      'ROUNDABOUT',
      'IT_PARK'
    );

    this.addEdge(
      'E_R_E_S',
      'R_EAST',
      'R_SOUTH',
      [
        new THREE.Vector3(76, 0, 60),
        new THREE.Vector3(71.3, 0, 71.3),
        new THREE.Vector3(60, 0, 76),
      ],
      12,
      2,
      30,
      'ROUNDABOUT',
      'IT_PARK'
    );

    this.addEdge(
      'E_R_S_W',
      'R_SOUTH',
      'R_WEST',
      [
        new THREE.Vector3(60, 0, 76),
        new THREE.Vector3(48.7, 0, 71.3),
        new THREE.Vector3(44, 0, 60),
      ],
      12,
      2,
      30,
      'ROUNDABOUT',
      'IT_PARK'
    );

    this.addEdge(
      'E_R_W_N',
      'R_WEST',
      'R_NORTH',
      [
        new THREE.Vector3(44, 0, 60),
        new THREE.Vector3(48.7, 0, 48.7),
        new THREE.Vector3(60, 0, 44),
      ],
      12,
      2,
      30,
      'ROUNDABOUT',
      'IT_PARK'
    );

    // Connect Roundabout arms to the rest of the city
    this.addEdge(
      'E_EAST_TO_R',
      'N_EAST',
      'R_NORTH',
      [
        new THREE.Vector3(60, 0, 0),
        new THREE.Vector3(60, 0, 22),
        new THREE.Vector3(60, 0, 44),
      ],
      12,
      2,
      40,
      'ARTERIAL',
      'IT_PARK'
    );

    this.addEdge(
      'E_SOUTH_TO_R',
      'N_SOUTH',
      'R_WEST',
      [
        new THREE.Vector3(0, 0, 60),
        new THREE.Vector3(22, 0, 60),
        new THREE.Vector3(44, 0, 60),
      ],
      12,
      2,
      40,
      'RESIDENTIAL',
      'RESIDENTIAL_COLONY'
    );

    // -------------------------------------------------------------
    // 4. HOSPITAL & EMERGENCY ZONE (South-West)
    // -------------------------------------------------------------
    this.addEdge(
      'E_SOUTH_TO_HOSP',
      'N_SOUTH',
      'HOSP_MAIN',
      [
        new THREE.Vector3(0, 0, 60),
        new THREE.Vector3(-30, 0, 60),
        new THREE.Vector3(-60, 0, 60),
      ],
      14,
      4,
      45,
      'ARTERIAL',
      'HOSPITAL_DISTRICT'
    );

    this.addEdge(
      'E_HOSP_EMERGENCY_BAY',
      'HOSP_MAIN',
      'HOSP_EMERGENCY',
      [
        new THREE.Vector3(-60, 0, 60),
        new THREE.Vector3(-72, 0, 60),
        new THREE.Vector3(-85, 0, 60),
      ],
      10,
      2,
      30,
      'COMMERCIAL',
      'HOSPITAL_DISTRICT'
    );

    this.addEdge(
      'E_HOSP_TO_WEST',
      'HOSP_MAIN',
      'N_WEST',
      [
        new THREE.Vector3(-60, 0, 60),
        new THREE.Vector3(-60, 0, 30),
        new THREE.Vector3(-60, 0, 0),
      ],
      12,
      2,
      40,
      'RESIDENTIAL',
      'HOSPITAL_DISTRICT'
    );

    // -------------------------------------------------------------
    // 5. SCHOOL ZONE & CURVED CRESCENT (North)
    // -------------------------------------------------------------
    this.addEdge(
      'E_NORTH_TO_SCH_GATE',
      'N_NORTH',
      'SCH_GATE',
      [
        new THREE.Vector3(0, 0, -60),
        new THREE.Vector3(0, 0, -72),
        new THREE.Vector3(0, 0, -85),
      ],
      10,
      2,
      30, // Strict 30 km/h
      'RESIDENTIAL',
      'SCHOOL_ZONE'
    );

    this.addEdge(
      'E_NORTH_TO_SCH_WEST',
      'N_NORTH',
      'SCH_WEST',
      [
        new THREE.Vector3(0, 0, -60),
        new THREE.Vector3(-30, 0, -60),
        new THREE.Vector3(-60, 0, -60),
      ],
      12,
      2,
      30, // School Zone speed limit
      'COMMERCIAL',
      'SCHOOL_ZONE'
    );

    this.addEdge(
      'E_SCH_WEST_TO_NW',
      'SCH_WEST',
      'N_WEST',
      [
        new THREE.Vector3(-60, 0, -60),
        new THREE.Vector3(-60, 0, -30),
        new THREE.Vector3(-60, 0, 0),
      ],
      12,
      2,
      40,
      'COMMERCIAL',
      'HERITAGE_QUARTER'
    );

    // -------------------------------------------------------------
    // 6. HERITAGE & WINDING ALLEY DISTRICT (North-West)
    // -------------------------------------------------------------
    // Curved winding lane to temple
    this.addEdge(
      'E_HERIT_TEMPLE_LANE',
      'SCH_WEST',
      'HERIT_TEMPLE',
      [
        new THREE.Vector3(-60, 0, -60),
        new THREE.Vector3(-72, 0, -55),
        new THREE.Vector3(-85, 0, -60),
      ],
      8,
      2,
      25,
      'ALLEY',
      'HERITAGE_QUARTER'
    );

    // Narrow bazaar alley (One-Way)
    this.addEdge(
      'E_HERIT_ALLEY_S',
      'HERIT_TEMPLE',
      'HERIT_ALLEY_S',
      [
        new THREE.Vector3(-85, 0, -60),
        new THREE.Vector3(-90, 0, -40),
        new THREE.Vector3(-85, 0, -20),
      ],
      7,
      1,
      25,
      'ALLEY',
      'HERITAGE_QUARTER',
      true // One-way!
    );

    // -------------------------------------------------------------
    // 7. OUTER RING ROAD / HIGHWAY (Long Sweeping Curve)
    // -------------------------------------------------------------
    this.addEdge(
      'E_HWY_NORTH_ARC',
      'HWY_NW',
      'HWY_N',
      [
        new THREE.Vector3(-60, 0, -120),
        new THREE.Vector3(-30, 0, -132),
        new THREE.Vector3(0, 0, -135),
      ],
      18,
      4,
      50,
      'HIGHWAY',
      'RING_ROAD_HIGHWAY'
    );

    this.addEdge(
      'E_HWY_NE_ARC',
      'HWY_N',
      'HWY_NE',
      [
        new THREE.Vector3(0, 0, -135),
        new THREE.Vector3(45, 0, -132),
        new THREE.Vector3(80, 0, -120),
      ],
      18,
      4,
      50,
      'HIGHWAY',
      'RING_ROAD_HIGHWAY'
    );

    this.addEdge(
      'E_HWY_EAST_ARC',
      'HWY_NE',
      'HWY_E',
      [
        new THREE.Vector3(80, 0, -120),
        new THREE.Vector3(110, 0, -85),
        new THREE.Vector3(120, 0, -40),
      ],
      18,
      4,
      50,
      'HIGHWAY',
      'RING_ROAD_HIGHWAY'
    );

    this.addEdge(
      'E_HWY_SE_ARC',
      'HWY_E',
      'HWY_SE',
      [
        new THREE.Vector3(120, 0, -40),
        new THREE.Vector3(122, 0, 10),
        new THREE.Vector3(120, 0, 60),
      ],
      18,
      4,
      50,
      'HIGHWAY',
      'RING_ROAD_HIGHWAY'
    );

    this.addEdge(
      'E_HWY_SOUTH_ARC',
      'HWY_SE',
      'HWY_S',
      [
        new THREE.Vector3(120, 0, 60),
        new THREE.Vector3(95, 0, 100),
        new THREE.Vector3(60, 0, 120),
      ],
      18,
      4,
      50,
      'HIGHWAY',
      'RING_ROAD_HIGHWAY'
    );

    // Highway connections into inner city
    this.addEdge(
      'E_HWY_FEEDER_E',
      'R_EAST',
      'HWY_SE',
      [
        new THREE.Vector3(76, 0, 60),
        new THREE.Vector3(98, 0, 60),
        new THREE.Vector3(120, 0, 60),
      ],
      14,
      4,
      45,
      'ARTERIAL',
      'IT_PARK'
    );

    this.addEdge(
      'E_HWY_FEEDER_N',
      'SCH_GATE',
      'HWY_N',
      [
        new THREE.Vector3(0, 0, -85),
        new THREE.Vector3(0, 0, -110),
        new THREE.Vector3(0, 0, -135),
      ],
      14,
      4,
      45,
      'ARTERIAL',
      'SCHOOL_ZONE'
    );

    // -------------------------------------------------------------
    // 8. ELEVATED FLYOVER / OVERPASS (Y = 4.5m)
    // -------------------------------------------------------------
    this.addEdge(
      'E_FLYOVER',
      'FLY_START',
      'FLY_END',
      [
        new THREE.Vector3(40, 0, -30),
        new THREE.Vector3(20, 4.5, -30),
        new THREE.Vector3(0, 4.5, -30),
        new THREE.Vector3(-20, 4.5, -30),
        new THREE.Vector3(-40, 0, -30),
      ],
      12,
      2,
      45,
      'BRIDGE',
      'COMMERCIAL_MARKET',
      false,
      true,
      4.5
    );

    // -------------------------------------------------------------
    // 9. INDUSTRIAL FREIGHT & SERVICE ROADS (South Logistics Corridor)
    // -------------------------------------------------------------
    this.addEdge(
      'E_RES_TO_IND',
      'N_SOUTH',
      'IND_JUNCTION',
      [
        new THREE.Vector3(0, 0, 60),
        new THREE.Vector3(0, 0, 75),
        new THREE.Vector3(0, 0, 90),
      ],
      14,
      4,
      40,
      'ARTERIAL',
      'INDUSTRIAL_ZONE'
    );

    this.addEdge(
      'E_IND_DEPOT_SPUR',
      'IND_JUNCTION',
      'IND_DEPOT',
      [
        new THREE.Vector3(0, 0, 90),
        new THREE.Vector3(-18, 0, 90),
        new THREE.Vector3(-35, 0, 90),
      ],
      12,
      2,
      35,
      'COMMERCIAL',
      'INDUSTRIAL_ZONE'
    );

    this.addEdge(
      'E_IND_LOGISTICS_FEEDER',
      'IND_JUNCTION',
      'IND_LOGISTICS',
      [
        new THREE.Vector3(0, 0, 90),
        new THREE.Vector3(18, 0, 90),
        new THREE.Vector3(35, 0, 90),
      ],
      12,
      2,
      40,
      'COMMERCIAL',
      'INDUSTRIAL_ZONE'
    );

    this.addEdge(
      'E_IND_TO_HWY_S',
      'IND_LOGISTICS',
      'HWY_S',
      [
        new THREE.Vector3(35, 0, 90),
        new THREE.Vector3(48, 0, 105),
        new THREE.Vector3(60, 0, 120),
      ],
      14,
      2,
      45,
      'ARTERIAL',
      'INDUSTRIAL_ZONE'
    );
  }

  /**
   * Finds the closest RoadNode to any (x, z) world position.
   */
  public findClosestNode(x: number, z: number): RoadNode {
    let closest: RoadNode | null = null;
    let minDistSq = Infinity;

    for (const node of this.nodes.values()) {
      const dx = node.pos.x - x;
      const dz = node.pos.y - z;
      const distSq = dx * dx + dz * dz;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        closest = node;
      }
    }

    return closest || this.nodes.get('N_CENTER')!;
  }

  /**
   * Finds the closest point on any road edge for legal routing.
   */
  public findClosestRoadPoint(x: number, z: number): { point: THREE.Vector3; edge: RoadEdge } {
    let bestPoint = new THREE.Vector3(x, 0, z);
    let bestEdge = Array.from(this.edges.values())[0];
    let minDistSq = Infinity;

    const testVec = new THREE.Vector3(x, 0, z);

    for (const edge of this.edges.values()) {
      // Sample 12 points along the curve
      const samples = 12;
      for (let i = 0; i <= samples; i++) {
        const pt = edge.curve.getPoint(i / samples);
        const distSq = pt.distanceToSquared(testVec);
        if (distSq < minDistSq) {
          minDistSq = distSq;
          bestPoint = pt;
          bestEdge = edge;
        }
      }
    }

    return { point: bestPoint, edge: bestEdge };
  }

  /**
   * A* (A-Star) Pathfinding between any two world positions.
   * Returns a smooth list of points following the actual roads.
   */
  public findPath(startPos: [number, number], endPos: [number, number]): THREE.Vector3[] {
    try {
      const startNode = this.findClosestNode(startPos[0], startPos[1]);
      const endNode = this.findClosestNode(endPos[0], endPos[1]);

      if (!startNode || !endNode || startNode.id === endNode.id) {
        return [
          new THREE.Vector3(startPos[0], 0, startPos[1]),
          new THREE.Vector3(endPos[0], 0, endPos[1]),
        ];
      }

      // Priority queue / frontier for A*
      const openSet: Set<string> = new Set([startNode.id]);
      const cameFrom: Map<string, { nodeId: string; edgeId: string }> = new Map();

      const gScore: Map<string, number> = new Map();
      gScore.set(startNode.id, 0);

      const fScore: Map<string, number> = new Map();
      fScore.set(startNode.id, startNode.pos.distanceTo(endNode.pos));

      let iterations = 0;
      const maxIterations = 300; // Protect against search stalls

      while (openSet.size > 0 && iterations++ < maxIterations) {
        // Find node with lowest fScore
        let currentId = '';
        let lowestF = Infinity;
        for (const id of openSet) {
          const f = fScore.get(id) ?? Infinity;
          if (f < lowestF) {
            lowestF = f;
            currentId = id;
          }
        }

        if (currentId === endNode.id) {
          // Reconstruct path
          const fullPoints: THREE.Vector3[] = [];
          let curr = endNode.id;
          const segmentEdges: RoadEdge[] = [];

          while (cameFrom.has(curr)) {
            const step = cameFrom.get(curr)!;
            const edge = this.edges.get(step.edgeId);
            if (edge) segmentEdges.unshift(edge);
            curr = step.nodeId;
          }

          fullPoints.push(new THREE.Vector3(startPos[0], 0, startPos[1]));

          for (const edge of segmentEdges) {
            try {
              const pts = edge.curve.getPoints(8);
              fullPoints.push(...pts);
            } catch {
              fullPoints.push(new THREE.Vector3(edge.curve.v0.x, 0, edge.curve.v0.y));
            }
          }

          fullPoints.push(new THREE.Vector3(endPos[0], 0, endPos[1]));
          return fullPoints;
        }

        openSet.delete(currentId);
        const currentNode = this.nodes.get(currentId);
        if (!currentNode) continue;

        const currentG = gScore.get(currentId) ?? Infinity;

        for (const edgeId of currentNode.connections) {
          const edge = this.edges.get(edgeId);
          if (!edge) continue;

          // One-way restriction: cannot traverse against one-way flow
          if (edge.isOneWay && edge.fromNodeId !== currentId) continue;

          const neighborId = edge.fromNodeId === currentId ? edge.toNodeId : edge.fromNodeId;
          const neighborNode = this.nodes.get(neighborId);
          if (!neighborNode) continue;

          const tentativeG = currentG + edge.length;
          if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
            cameFrom.set(neighborId, { nodeId: currentId, edgeId });
            gScore.set(neighborId, tentativeG);
            fScore.set(neighborId, tentativeG + neighborNode.pos.distanceTo(endNode.pos));
            openSet.add(neighborId);
          }
        }
      }
    } catch (e) {
      console.warn('[ROADWISE] Pathfinding note:', e);
    }

    // Fallback: direct line if no graph path found
    return [
      new THREE.Vector3(startPos[0], 0, startPos[1]),
      new THREE.Vector3(endPos[0], 0, endPos[1]),
    ];
  }

  /**
   * Returns current regulatory speed limit for a given position.
   */
  public getSpeedLimitAt(x: number, z: number): number {
    const { edge } = this.findClosestRoadPoint(x, z);
    return edge ? edge.speedLimitKmh : 40;
  }
}
