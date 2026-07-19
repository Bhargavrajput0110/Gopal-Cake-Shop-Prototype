import * as React from "react"
import { Save2 } from "iconsax-react"

export type SettingsFormData = {
  key: string
  value: string
  description: string
}

interface SettingsFormProps {
  formData: SettingsFormData
  setFormData: React.Dispatch<React.SetStateAction<SettingsFormData>>
  onSubmit: (e: React.FormEvent) => void
  isSaving: boolean
  isEditing: boolean
}

export function SettingsForm({ formData, setFormData, onSubmit, isSaving, isEditing }: SettingsFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-8 pb-8">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Configuration Detail</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Setting Key *</label>
          <input 
            required
            type="text" 
            value={formData.key}
            onChange={e => setFormData({...formData, key: e.target.value})}
            disabled={isEditing}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono disabled:opacity-50 disabled:bg-muted" 
            placeholder="e.g., SITE_NAME" 
          />
          {isEditing && (
            <p className="text-xs text-muted-foreground">Keys cannot be changed once created. Create a new setting instead.</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Value *</label>
          <textarea 
            required
            rows={4}
            value={formData.value}
            onChange={e => setFormData({...formData, value: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono" 
            placeholder="Configuration value" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Description</label>
          <textarea 
            rows={2}
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" 
            placeholder="What does this setting control?" 
          />
        </div>
      </div>

      <div className="pt-6 mt-8 flex gap-3">
        <button 
          type="submit" 
          disabled={isSaving}
          className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : <><Save2 className="w-4 h-4" /> Save Setting</>}
        </button>
      </div>
    </form>
  )
}
