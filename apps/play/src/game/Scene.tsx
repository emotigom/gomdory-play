import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  type RapierRigidBody,
} from '@react-three/rapier';
import { useEffect, useRef } from 'react';
import { Quaternion, Vector3, type Group } from 'three';

import {
  calculateTiltRadians,
  decideRoundOutcome,
  type GameStatus,
} from './state';
import type { ThrowVector } from './throwing';

type DebugStats = Readonly<{
  calls: number;
  fps: number;
  triangles: number;
}>;

type SceneProps = Readonly<{
  debug: boolean;
  onDebugStats: (stats: DebugStats) => void;
  onRoundFinished: (status: 'success' | 'failure') => void;
  status: GameStatus;
  throwVector: ThrowVector;
}>;

function CameraAim() {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.lookAt(0, 0.45, -0.7);
  }, [camera]);

  return null;
}

function DebugMonitor({ onDebugStats }: Pick<SceneProps, 'onDebugStats'>) {
  const elapsed = useRef(0);
  const frames = useRef(0);
  const gl = useThree((state) => state.gl);

  useFrame((_, delta) => {
    elapsed.current += delta;
    frames.current += 1;

    if (elapsed.current >= 0.5) {
      onDebugStats({
        calls: gl.info.render.calls,
        fps: Math.round(frames.current / elapsed.current),
        triangles: gl.info.render.triangles,
      });
      elapsed.current = 0;
      frames.current = 0;
    }
  });

  return null;
}

function RoundWatcher({
  onRoundFinished,
  status,
  stone,
  target,
}: {
  onRoundFinished: SceneProps['onRoundFinished'];
  status: GameStatus;
  stone: React.RefObject<RapierRigidBody | null>;
  target: React.RefObject<RapierRigidBody | null>;
}) {
  const elapsed = useRef(0);
  const finished = useRef(false);
  const targetRotation = useRef(new Quaternion());
  const targetUp = useRef(new Vector3());

  useEffect(() => {
    elapsed.current = 0;
    finished.current = false;
  }, [status]);

  useFrame((_, delta) => {
    if (
      status !== 'flying' ||
      finished.current ||
      !stone.current ||
      !target.current
    ) {
      return;
    }

    elapsed.current += delta;
    const rotation = target.current.rotation();
    const tilt = calculateTiltRadians(
      targetUp.current
        .set(0, 1, 0)
        .applyQuaternion(
          targetRotation.current.set(
            rotation.x,
            rotation.y,
            rotation.z,
            rotation.w,
          ),
        ),
    );
    const outcome = decideRoundOutcome({
      elapsedSeconds: elapsed.current,
      stoneHeight: stone.current.translation().y,
      targetTiltRadians: tilt,
    });

    if (outcome) {
      finished.current = true;
      onRoundFinished(outcome);
    }
  });

  return null;
}

function Ground() {
  return (
    <RigidBody colliders={false} type="fixed">
      <mesh receiveShadow position={[0, -0.16, 0]}>
        <boxGeometry args={[12, 0.3, 12]} />
        <meshStandardMaterial color="#b99867" roughness={0.95} />
      </mesh>
      <CuboidCollider args={[6, 0.15, 6]} position={[0, -0.16, 0]} />
    </RigidBody>
  );
}

function Biseok({
  bodyRef,
}: {
  bodyRef: React.RefObject<RapierRigidBody | null>;
}) {
  return (
    <RigidBody
      ref={bodyRef}
      angularDamping={1.2}
      colliders={false}
      friction={0.9}
      position={[0, 0.88, -2.25]}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.48, 1.76, 0.46]} />
        <meshStandardMaterial color="#58514b" roughness={0.88} />
      </mesh>
      <CuboidCollider args={[0.24, 0.88, 0.23]} />
    </RigidBody>
  );
}

function ThrowingStone({
  bodyRef,
  status,
  throwVector,
}: {
  bodyRef: React.RefObject<RapierRigidBody | null>;
  status: GameStatus;
  throwVector: ThrowVector;
}) {
  const thrown = useRef(false);

  useEffect(() => {
    if (status !== 'flying' || thrown.current || !bodyRef.current) {
      return;
    }

    bodyRef.current.wakeUp();
    bodyRef.current.applyImpulse(throwVector.impulse, true);
    thrown.current = true;
  }, [bodyRef, status, throwVector]);

  return (
    <RigidBody
      ref={bodyRef}
      angularDamping={0.3}
      ccd
      colliders={false}
      friction={0.8}
      linearDamping={0.08}
      position={[0, 0.3, 2.2]}
      restitution={0.12}
    >
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.3, 24, 16]} />
        <meshStandardMaterial color="#7b6650" roughness={0.9} />
      </mesh>
      <BallCollider args={[0.3]} />
    </RigidBody>
  );
}

function ThrowLine() {
  return (
    <group position={[0, 0.025, 1.55]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh receiveShadow>
        <planeGeometry args={[3.6, 0.08]} />
        <meshStandardMaterial color="#efe1bd" />
      </mesh>
    </group>
  );
}

function AlleyDetails() {
  const fence = useRef<Group>(null);

  return (
    <group ref={fence}>
      <mesh castShadow position={[-3.8, 0.72, -2.4]}>
        <boxGeometry args={[0.18, 1.44, 4.5]} />
        <meshStandardMaterial color="#86664f" roughness={1} />
      </mesh>
      <mesh castShadow position={[3.8, 0.72, -2.4]}>
        <boxGeometry args={[0.18, 1.44, 4.5]} />
        <meshStandardMaterial color="#86664f" roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 0.9, -5.1]}>
        <boxGeometry args={[7.7, 1.8, 0.2]} />
        <meshStandardMaterial color="#70584b" roughness={1} />
      </mesh>
    </group>
  );
}

function World({
  debug,
  onDebugStats,
  onRoundFinished,
  status,
  throwVector,
}: SceneProps) {
  const stone = useRef<RapierRigidBody>(null);
  const target = useRef<RapierRigidBody>(null);

  return (
    <>
      <CameraAim />
      <ambientLight intensity={1.05} />
      <directionalLight
        castShadow
        intensity={2.2}
        position={[3.5, 6, 4]}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
      />
      <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
        <Ground />
        <ThrowLine />
        <Biseok bodyRef={target} />
        <ThrowingStone
          bodyRef={stone}
          status={status}
          throwVector={throwVector}
        />
      </Physics>
      <AlleyDetails />
      <RoundWatcher
        onRoundFinished={onRoundFinished}
        status={status}
        stone={stone}
        target={target}
      />
      {debug ? <DebugMonitor onDebugStats={onDebugStats} /> : null}
    </>
  );
}

export function BiseokScene(props: SceneProps) {
  return (
    <Canvas
      camera={{ fov: 42, position: [6.6, 4.6, 7.3] }}
      dpr={[1, 1.5]}
      shadows
    >
      <color args={['#c9d5d6']} attach="background" />
      <World {...props} />
    </Canvas>
  );
}
