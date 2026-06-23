/** Types et constantes — animation étoiles GalaxyButton / avatars Chatbot. */

export type GalaxyStarsOptions = {
  starCount?: number;
  interactive?: boolean;
  baseSpeed?: number;
  /** `avatar` = orbe 32px ; `dock` = bandeau Galaxy (défaut). */
  variant?: "dock" | "avatar";
  /** Profil ultra-léger (56 étoiles) — ex. assistant carte mobile. */
  mobilePowerSave?: boolean;
  powerProfile?: Partial<
    import("@/core/ui/GalaxyButton/galaxyAnimationPowerPolicy").GalaxyAnimationProfile
  >;
};

export type GalaxyStar = {
  radius: number;
  angle: number;
  angularVelocity: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  z: number;
  color: { r: number; g: number; b: number };
};

export const GALAXY_STAR_COLORS = [
  { r: 255, g: 255, b: 255 },
  { r: 255, g: 255, b: 255 },
  { r: 248, g: 250, b: 252 },
  { r: 241, g: 245, b: 249 },
  { r: 224, g: 242, b: 254 },
] as const;

export const GALAXY_TILT = 1.1;
export const GALAXY_ANGLE = 0.3;

export type GalaxyStarsVariant = "dock" | "avatar";
