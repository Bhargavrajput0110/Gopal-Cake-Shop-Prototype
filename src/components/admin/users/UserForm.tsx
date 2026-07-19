import * as React from "react"
import { Save2, Send } from "iconsax-react"
import { Role } from "@prisma/client"
import { InviteUserDTO } from "@/dtos/UserSchemas"

interface UserFormProps {
  formData: InviteUserDTO
  setFormData: React.Dispatch<React.SetStateAction<InviteUserDTO>>
  onSubmit: (e: React.FormEvent) => void
  isSaving: boolean
  isEditing: boolean
}

export function UserForm({ formData, setFormData, onSubmit, isSaving, isEditing }: UserFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-8 pb-8">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">
          {isEditing ? 'Role & Assignment' : 'Invite New User'}
        </h3>
        
        {!isEditing && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Full Name *</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                placeholder="e.g., Jane Doe" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Email Address *</label>
              <input 
                required
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                placeholder="e.g., jane@example.com" 
              />
              <p className="text-xs text-muted-foreground mt-1">An invite link will be sent to this email to set a password.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Phone Number</label>
              <input 
                type="tel" 
                value={formData.phone || ''}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                placeholder="e.g., 9876543210" 
              />
            </div>
          </>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">System Role *</label>
          <select 
            required
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value as Role})}
            className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
          >
            <option value="SALESPERSON">Salesperson (Branch Orders)</option>
            <option value="MANAGER">Manager (Branch Operations)</option>
            <option value="CHEF">Chef (Branch Kitchen)</option>
            <option value="DELIVERY">Delivery Driver</option>
            <option value="VENDOR_FLORIST">Vendor / Florist</option>
            <option value="ADMIN">Administrator (Global Access)</option>
          </select>
        </div>

        {formData.role !== 'ADMIN' && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Assigned Branch (Scope)</label>
            <input 
              type="text" 
              value={formData.branchId || ''}
              onChange={e => setFormData({...formData, branchId: e.target.value})}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
              placeholder="Branch ID" 
            />
            <p className="text-xs text-destructive font-bold mt-1">If unassigned, the user will have NO ACCESS to branch-scoped capabilities.</p>
          </div>
        )}
      </div>

      <div className="pt-6 mt-8 flex gap-3">
        <button 
          type="submit" 
          disabled={isSaving}
          className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-md font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? "Processing..." : (
            isEditing ? <><Save2 className="w-4 h-4" /> Save Role</> : <><Send className="w-4 h-4" /> Send Invite</>
          )}
        </button>
      </div>
    </form>
  )
}
