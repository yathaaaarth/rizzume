export type PalSpecies = 'bear' | 'cat' | 'fox' | 'bunny' | 'panda' | 'dino'

export const PAL_SPECIES: { key: PalSpecies; label: string; emoji: string }[] = [
  { key: 'bear', label: 'Bear', emoji: '🐻' },
  { key: 'cat', label: 'Cat', emoji: '🐱' },
  { key: 'fox', label: 'Fox', emoji: '🦊' },
  { key: 'bunny', label: 'Bunny', emoji: '🐰' },
  { key: 'panda', label: 'Panda', emoji: '🐼' },
  { key: 'dino', label: 'Dino', emoji: '🦕' },
]

function Topper({ species, primary, accent }: { species: PalSpecies; primary: string; accent: string }) {
  switch (species) {
    case 'bear':
      return (
        <>
          <circle cx={26} cy={26} r={15} fill={primary} stroke="#2B2140" strokeWidth={3} />
          <circle cx={94} cy={26} r={15} fill={primary} stroke="#2B2140" strokeWidth={3} />
          <circle cx={26} cy={26} r={6} fill={accent} />
          <circle cx={94} cy={26} r={6} fill={accent} />
        </>
      )
    case 'cat':
      return (
        <>
          <path d="M14 34 L28 4 L42 34 Z" fill={primary} stroke="#2B2140" strokeWidth={3} strokeLinejoin="round" />
          <path d="M78 34 L92 4 L106 34 Z" fill={primary} stroke="#2B2140" strokeWidth={3} strokeLinejoin="round" />
          <path d="M20 30 L28 14 L36 30 Z" fill={accent} />
          <path d="M84 30 L92 14 L100 30 Z" fill={accent} />
        </>
      )
    case 'fox':
      return (
        <>
          <path d="M10 36 L30 0 L46 36 Z" fill={primary} stroke="#2B2140" strokeWidth={3} strokeLinejoin="round" />
          <path d="M74 36 L90 0 L110 36 Z" fill={primary} stroke="#2B2140" strokeWidth={3} strokeLinejoin="round" />
          <path d="M18 32 L30 10 L38 32 Z" fill={accent} />
          <path d="M82 32 L90 10 L102 32 Z" fill={accent} />
        </>
      )
    case 'bunny':
      return (
        <>
          <rect x={16} y={-10} width={16} height={48} rx={8} fill={primary} stroke="#2B2140" strokeWidth={3} />
          <rect x={88} y={-10} width={16} height={48} rx={8} fill={primary} stroke="#2B2140" strokeWidth={3} />
          <rect x={20} y={-2} width={8} height={30} rx={4} fill={accent} />
          <rect x={92} y={-2} width={8} height={30} rx={4} fill={accent} />
        </>
      )
    case 'panda':
      return (
        <>
          <circle cx={26} cy={26} r={15} fill="#2B2140" />
          <circle cx={94} cy={26} r={15} fill="#2B2140" />
          <ellipse cx={44} cy={56} rx={12} ry={14} fill="#2B2140" opacity={0.85} />
          <ellipse cx={76} cy={56} rx={12} ry={14} fill="#2B2140" opacity={0.85} />
        </>
      )
    case 'dino':
      return (
        <>
          <path
            d="M30 30 L38 10 L46 30 L54 8 L62 30 L70 8 L78 30 L86 12 L92 30"
            fill={accent}
            stroke="#2B2140"
            strokeWidth={3}
            strokeLinejoin="round"
          />
        </>
      )
  }
}

export function PalAvatar({
  species = 'bear',
  primary = '#8B5CF6',
  accent = '#FFD93D',
  size = 96,
  className = '',
}: {
  species?: string | null
  primary?: string
  accent?: string
  size?: number
  className?: string
}) {
  const s = (PAL_SPECIES.some((p) => p.key === species) ? species : 'bear') as PalSpecies

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`${s} pal avatar`}
    >
      <Topper species={s} primary={primary} accent={accent} />
      <ellipse cx={60} cy={68} rx={44} ry={40} fill={primary} stroke="#2B2140" strokeWidth={3} />
      {s === 'panda' ? (
        <>
          <circle cx={46} cy={62} r={9} fill="#2B2140" opacity={0.85} />
          <circle cx={74} cy={62} r={9} fill="#2B2140" opacity={0.85} />
        </>
      ) : (
        <ellipse cx={60} cy={82} rx={20} ry={18} fill={accent} opacity={0.9} />
      )}
      <circle cx={47} cy={60} r={4.5} fill="#2B2140" />
      <circle cx={73} cy={60} r={4.5} fill="#2B2140" />
      <circle cx={39} cy={70} r={6} fill="#FFB3C6" opacity={0.7} />
      <circle cx={81} cy={70} r={6} fill="#FFB3C6" opacity={0.7} />
      <path d="M52 74 Q60 80 68 74" stroke="#2B2140" strokeWidth={3} fill="none" strokeLinecap="round" />
    </svg>
  )
}
