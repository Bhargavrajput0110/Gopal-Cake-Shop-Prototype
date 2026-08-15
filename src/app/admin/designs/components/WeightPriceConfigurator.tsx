"use client"

import * as React from "react"
import { MagicStar as Sparkles, Refresh2, TickSquare as Check, InfoCircle } from "iconsax-react"

const ALL_WEIGHT_TIERS: number[] = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.5)

export interface WeightPriceConfig {
  weightKg: number
  price: number
  isCustomOverride?: boolean
}

interface Props {
  initialConfig?: Record<number, { price: number; isCustomOverride?: boolean }>
  onChange?: (config: Record<number, { price: number; isCustomOverride?: boolean }>) => void
}

export function WeightPriceConfigurator({ initialConfig = {}, onChange }: Props) {
  const [enabledWeights, setEnabledWeights] = React.useState<number[]>(() => {
    if (Object.keys(initialConfig).length > 0) return Object.keys(initialConfig).map(Number)
    return [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0]
  })

  const [priceMap, setPriceMap] = React.useState<Record<number, { price: number; isCustomOverride?: boolean }>>(() => {
    if (Object.keys(initialConfig).length > 0) return initialConfig
    return {
      0.5: { price: 450, isCustomOverride: true },
      1.0: { price: 850, isCustomOverride: true },
      1.5: { price: 1250, isCustomOverride: true },
      2.0: { price: 1600, isCustomOverride: true },
      3.0: { price: 2700, isCustomOverride: true }, // Default placeholder in case 3kg becomes starting anchor
    }
  })

  const [showPartyOverrides, setShowPartyOverrides] = React.useState(false)

  const sortedEnabled = React.useMemo(() => [...enabledWeights].sort((a, b) => a - b), [enabledWeights])

  // SMART ANCHOR RESOLUTION:
  // 1. Prefer 2.0 kg if selected.
  // 2. Otherwise, take the highest weight <= 2.0 kg.
  // 3. If ALL selected weights are > 2.0 kg (e.g. 3-tier cake starting at 3kg), take the very first weight!
  const anchorWeight: number = React.useMemo(() => {
    if (sortedEnabled.length === 0) return 2.0
    if (sortedEnabled.includes(2.0)) return 2.0
    const underTwo = sortedEnabled.filter((w) => w <= 2.0)
    if (underTwo.length > 0) return underTwo[underTwo.length - 1]
    return sortedEnabled[0] // e.g. starts at 3.0 kg!
  }, [sortedEnabled])

  const anchorPrice = priceMap[anchorWeight]?.price || 0
  const anchorSteps = anchorWeight / 0.5 // e.g., 2kg = 4 steps, 3kg = 6 steps
  const stepRate = anchorPrice > 0 && anchorSteps > 0 ? Math.round(anchorPrice / anchorSteps) : 0

  const calculateAutoPrice = React.useCallback((weight: number): number => {
    // If it is at or below the anchor weight, always use stored manual price
    if (weight <= anchorWeight) return priceMap[weight]?.price || 0
    if (!anchorPrice) return 0
    const extraSteps = (weight - anchorWeight) / 0.5
    return Math.round(anchorPrice + extraSteps * stepRate)
  }, [anchorWeight, anchorPrice, stepRate, priceMap])

  React.useEffect(() => {
    const activeConfig: Record<number, { price: number; isCustomOverride?: boolean }> = {}
    enabledWeights.forEach((w) => {
      if (w <= anchorWeight) {
        activeConfig[w] = { price: priceMap[w]?.price || 0, isCustomOverride: true }
      } else {
        const existing = priceMap[w]
        if (existing?.isCustomOverride) {
          activeConfig[w] = existing
        } else {
          activeConfig[w] = { price: calculateAutoPrice(w), isCustomOverride: false }
        }
      }
    })
    onChange?.(activeConfig)
  }, [enabledWeights, priceMap, calculateAutoPrice, anchorWeight])

  const toggleWeight = (w: number) => {
    setEnabledWeights((prev) => 
      prev.includes(w) ? prev.filter((item) => item !== w) : [...prev, w].sort((a, b) => a - b)
    )
  }

  const handlePriceChange = (weight: number, val: string) => {
    const numVal = parseInt(val, 10)
    const validVal = isNaN(numVal) ? 0 : numVal
    setPriceMap((prev) => ({
      ...prev,
      [weight]: { price: validVal, isCustomOverride: true },
    }))
  }

  const handleResetToAuto = (weight: number) => {
    const autoP = calculateAutoPrice(weight)
    setPriceMap((prev) => ({
      ...prev,
      [weight]: { price: autoP, isCustomOverride: false },
    }))
  }

  // Base Tiers: all weights up to and including the Anchor Weight
  // If standard (starts <= 2kg), shows 0.5, 1, 1.5, 2
  // If large cake (starts > 2kg), shows just that starting anchor weight!
  const baseTiers = React.useMemo(() => {
    if (anchorWeight > 2.0) return [anchorWeight]
    return [0.5, 1.0, 1.5, 2.0].filter(w => w <= anchorWeight || enabledWeights.includes(w))
  }, [anchorWeight, enabledWeights])

  const largeTiers = React.useMemo(() => {
    return sortedEnabled.filter((w) => w > anchorWeight)
  }, [sortedEnabled, anchorWeight])

  return (
    <div className="space-y-6 pt-2">
      
      {/* 1. Base Manual Pricing Rows */}
      <div className="space-y-3 bg-card border-2 border-border/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-1">
          <label className="font-ui text-xs font-bold uppercase tracking-wider text-foreground">
            1. Base Anchor Pricing {anchorWeight > 2.0 ? `(Starting at ${anchorWeight} kg)` : `(Up to ${anchorWeight} kg)`}
          </label>
          <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
            Manual Input
          </span>
        </div>
        <p className="text-xs text-muted-foreground -mt-1">
          {anchorWeight > 2.0 ? (
            <span>
              Because this large cake starts above 2kg, your starting size (<strong className="text-foreground font-extrabold">{anchorWeight} kg</strong>) automatically serves as the Base Anchor!
            </span>
          ) : (
            <span>
              Enter prices for standard weights. Your <strong className="text-foreground font-extrabold">{anchorWeight} kg</strong> price automatically scales larger party tiers!
            </span>
          )}
        </p>

        <div className="grid grid-cols-2 gap-4 pt-2">
          {baseTiers.map((weight) => {
            const isSelected = enabledWeights.includes(weight)
            return (
              <div 
                key={weight} 
                className={`p-3 rounded-xl border-2 transition-all ${
                  isSelected ? "border-primary/30 bg-background" : "border-muted bg-muted/20 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-ui text-xs font-black text-foreground">{weight.toFixed(1)} kg</span>
                  {weight === anchorWeight && (
                    <span className="text-[10px] font-black text-[var(--brand-deep-rose)] uppercase tracking-tight bg-[var(--brand-deep-rose)]/10 px-1.5 py-0.5 rounded">
                      Anchor ⭐
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-black text-muted-foreground">₹</span>
                  <input
                    type="number"
                    min="0"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    value={priceMap[weight]?.price || ""}
                    placeholder="0"
                    onChange={(e) => handlePriceChange(weight, e.target.value)}
                    className="w-full pl-7 pr-3 h-10 rounded-lg border border-input bg-background text-sm font-black text-foreground focus:border-primary focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Live Auto Calculation Helper Badge */}
        {anchorPrice > 0 && (
          <div className="mt-2 bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-2.5 text-xs">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <span className="text-muted-foreground">
              Tiers larger than {anchorWeight} kg will automatically increase by <strong className="text-foreground font-extrabold">+₹{stepRate} per 500g</strong> (based on ₹{anchorPrice} ÷ {anchorSteps} steps).
            </span>
          </div>
        )}
      </div>

      {/* 2. Weight Availability Selector (Sleek Pills) */}
      <div className="space-y-3 bg-card border-2 border-border/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-1">
          <label className="font-ui text-xs font-bold uppercase tracking-wider text-foreground">
            2. Available Cake Sizes
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (enabledWeights.length === ALL_WEIGHT_TIERS.length) {
                  setEnabledWeights([]);
                } else {
                  setEnabledWeights([...ALL_WEIGHT_TIERS]);
                }
              }}
              className="text-xs font-bold text-[var(--brand-deep-rose)] hover:underline"
            >
              {enabledWeights.length === ALL_WEIGHT_TIERS.length ? "Deselect All" : "Select All"}
            </button>
            <span className="text-xs font-bold text-muted-foreground">
              {enabledWeights.length} sizes available
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground -mt-1">
          Click sizes to toggle what customers can select on your website menu.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {ALL_WEIGHT_TIERS.map((w) => {
            const isSelected = enabledWeights.includes(w)
            return (
              <button
                type="button"
                key={w}
                onClick={() => toggleWeight(w)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all border select-none ${
                  isSelected
                    ? "bg-[var(--brand-deep-rose)] text-white border-[var(--brand-deep-rose)] shadow-sm"
                    : "bg-background text-muted-foreground border-input hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {isSelected && <span className="text-[10px]">✓</span>}
                <span>{w.toFixed(1)} kg</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Expandable Party Cake Overrides */}
      {largeTiers.length > 0 && (
        <div className="space-y-3">
          <button 
            type="button"
            onClick={() => setShowPartyOverrides(!showPartyOverrides)}
            className="w-full flex items-center justify-between bg-primary/5 hover:bg-primary/10 border border-primary/20 p-4 rounded-xl transition-colors text-primary font-ui text-sm font-bold tracking-wide"
          >
            <span>
              {showPartyOverrides ? `− Hide Tiers Above ${anchorWeight} kg` : `+ View & Override Tiers Above ${anchorWeight} kg (${largeTiers.length} sizes active)`}
            </span>
            <span className="text-[11px] bg-primary/20 text-primary px-2 py-0.5 rounded">Optional</span>
          </button>

          {showPartyOverrides && (
            <div className="space-y-2 bg-muted/20 p-4 rounded-xl border border-border animate-in slide-in-from-top-3 fade-in duration-200 max-h-[400px] overflow-y-auto pr-2">
              <p className="text-xs text-muted-foreground pb-2">
                These prices are calculated using your {anchorWeight} kg base anchor (₹{anchorPrice} ÷ {anchorSteps} steps = ₹{stepRate}/500g). Type in any box to override manually!
              </p>
              
              <div className="space-y-2">
                {largeTiers.map((weight) => {
                  const customData = priceMap[weight]
                  const isCustom = customData?.isCustomOverride === true
                  const displayPrice = isCustom ? customData.price : calculateAutoPrice(weight)
                  const extraSteps = (weight - anchorWeight) / 0.5

                  return (
                    <div 
                      key={weight} 
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isCustom ? "bg-amber-500/5 border-amber-500/40" : "bg-background border-input"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-ui text-sm font-black text-foreground w-16">{weight.toFixed(1)} kg</span>
                        {isCustom ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                            ✏️ Customized
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            🤖 Auto (₹{anchorPrice} + {extraSteps} × ₹{stepRate})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => handleResetToAuto(weight)}
                            title="Reset to automatic formula"
                            className="text-[11px] text-muted-foreground underline hover:text-foreground mr-1"
                          >
                            Reset
                          </button>
                        )}
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-2 text-xs font-black text-muted-foreground">₹</span>
                          <input
                            type="number"
                            min="0"
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            value={displayPrice || ""}
                            onChange={(e) => handlePriceChange(weight, e.target.value)}
                            className="w-full pl-7 pr-2.5 h-9 rounded-lg border border-input bg-background text-sm font-black text-foreground focus:border-primary focus:outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Flavour note tag */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/40 border border-border/50 text-[11px] text-muted-foreground">
        <InfoCircle className="w-4 h-4 shrink-0 text-primary" />
        <span>
          <strong>Note:</strong> Customer flavor choices (+₹100 to +₹600 / 500g) are calculated separately during website checkout.
        </span>
      </div>

    </div>
  )
}
