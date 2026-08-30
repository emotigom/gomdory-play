export type Aim = Readonly<{
  x: number;
  y: number;
}>;

export type ThrowVector = Readonly<{
  impulse: Readonly<{ x: number; y: number; z: number }>;
  strength: number;
}>;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

export function clampAim(aim: Aim): Aim {
  return {
    x: clamp(aim.x, -180, 180),
    y: clamp(aim.y, -180, 180),
  };
}

export function calculateThrow(aim: Aim, power: number): ThrowVector {
  const strength = power * 1.4;
  const sideways = clamp(aim.x / 180, -0.55, 0.55);
  const lift = 0.28 + clamp(-aim.y / 180, -0.12, 0.42);
  const forward = Math.sqrt(Math.max(0.2, 1 - sideways ** 2));

  return {
    impulse: {
      x: sideways * strength,
      y: lift * strength,
      z: -forward * strength,
    },
    strength,
  };
}

export function nudgeAim(aim: Aim, direction: Aim): Aim {
  return clampAim({
    x: aim.x + direction.x,
    y: aim.y + direction.y,
  });
}
