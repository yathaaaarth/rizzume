import { INDUSTRIES, SENIORITIES } from '../lib/constants'

export type Filters = {
  industries: string[]
  seniorities: string[]
  ageMin: number
  ageMax: number
  verifiedOnly: boolean
}

export const DEFAULT_FILTERS: Filters = {
  industries: [],
  seniorities: [],
  ageMin: 21,
  ageMax: 65,
  verifiedOnly: false,
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export function FilterPanel({
  filters,
  onChange,
  onClose,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50 sm:items-center">
      <div className="sticker-card animate-pop-in max-h-[85vh] w-full max-w-md overflow-y-auto bg-cream p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Playground rules 🎛️</h2>
          <button onClick={onClose} className="text-ink/50 hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mt-5">
          <p className="text-sm font-bold">Age range</p>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <input
              type="number"
              min={18}
              max={filters.ageMax}
              value={filters.ageMin}
              onChange={(e) => onChange({ ...filters, ageMin: Number(e.target.value) })}
              className="w-20 rounded-2xl border-3 border-ink bg-white px-3 py-2 outline-none focus:border-grape"
            />
            <span className="text-ink/50">to</span>
            <input
              type="number"
              min={filters.ageMin}
              max={99}
              value={filters.ageMax}
              onChange={(e) => onChange({ ...filters, ageMax: Number(e.target.value) })}
              className="w-20 rounded-2xl border-3 border-ink bg-white px-3 py-2 outline-none focus:border-grape"
            />
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-bold">Industry</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {INDUSTRIES.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChange({ ...filters, industries: toggle(filters.industries, i) })}
                className={`sticker-btn px-3 py-1.5 text-xs font-bold ${
                  filters.industries.includes(i) ? 'bg-sunshine' : 'bg-white'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-bold">Seniority</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SENIORITIES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ ...filters, seniorities: toggle(filters.seniorities, s) })}
                className={`sticker-btn px-3 py-1.5 text-xs font-bold ${
                  filters.seniorities.includes(s) ? 'bg-sunshine' : 'bg-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <label className="sticker-card mt-5 flex items-center justify-between gap-4 bg-white p-4 text-sm font-bold">
          <span>
            Verified professionals only
            <span className="block text-xs font-normal text-ink/50">Confirmed work email, no personal inboxes.</span>
          </span>
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => onChange({ ...filters, verifiedOnly: e.target.checked })}
            className="h-5 w-5 accent-grape"
          />
        </label>

        <div className="mt-6 flex gap-3">
          <button onClick={() => onChange(DEFAULT_FILTERS)} className="sticker-btn flex-1 bg-white py-2.5 text-sm font-bold">
            Reset
          </button>
          <button onClick={onClose} className="sticker-btn flex-1 bg-grape py-2.5 text-sm font-bold text-white">
            Show pals
          </button>
        </div>
      </div>
    </div>
  )
}
