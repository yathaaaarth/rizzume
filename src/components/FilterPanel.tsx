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
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-paper p-6 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Filters</h2>
          <button onClick={onClose} className="text-ink/50 hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold">Age range</p>
          <div className="mt-2 flex items-center gap-3 text-sm">
            <input
              type="number"
              min={18}
              max={filters.ageMax}
              value={filters.ageMin}
              onChange={(e) => onChange({ ...filters, ageMin: Number(e.target.value) })}
              className="w-20 rounded-xl border border-ink/15 px-3 py-2 outline-none focus:border-rizz-purple"
            />
            <span className="text-ink/50">to</span>
            <input
              type="number"
              min={filters.ageMin}
              max={99}
              value={filters.ageMax}
              onChange={(e) => onChange({ ...filters, ageMax: Number(e.target.value) })}
              className="w-20 rounded-xl border border-ink/15 px-3 py-2 outline-none focus:border-rizz-purple"
            />
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold">Industry</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {INDUSTRIES.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChange({ ...filters, industries: toggle(filters.industries, i) })}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  filters.industries.includes(i)
                    ? 'border-rizz-purple bg-rizz-purple text-white'
                    : 'border-ink/15 text-ink/70'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold">Seniority</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SENIORITIES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ ...filters, seniorities: toggle(filters.seniorities, s) })}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  filters.seniorities.includes(s)
                    ? 'border-rizz-purple bg-rizz-purple text-white'
                    : 'border-ink/15 text-ink/70'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <label className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white p-4 text-sm font-medium">
          <span>
            Verified professionals only
            <span className="block text-xs font-normal text-ink/50">Confirmed work email, no personal inboxes.</span>
          </span>
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => onChange({ ...filters, verifiedOnly: e.target.checked })}
            className="h-5 w-5 accent-rizz-purple"
          />
        </label>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="flex-1 rounded-full border border-ink/20 px-4 py-2.5 text-sm font-semibold text-ink"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper"
          >
            Show results
          </button>
        </div>
      </div>
    </div>
  )
}
