"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, BoxSearch, Car, Warning2, CardTick, Setting2, Danger, MagicStar, TruckFast, GlobalSearch, Moneys, Add } from "iconsax-react";
import { BackButton } from "@/components/ui/BackButton";
import { DashboardSection } from "@/components/ui/dashboard-widgets";
import { useSettings } from "@/hooks/useSettings";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/admin/settings/columns";
import { SettingsFilters } from "@/components/admin/settings/SettingsFilters";
import { SettingsForm, type SettingsFormData } from "@/components/admin/settings/SettingsForm";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Button } from "@/components/ui/button";

export default function AdminSettings() {
  const { settings, isLoading, createSetting, updateSetting, deleteSetting } = useSettings();
  
  const [activeTab, setActiveTab] = useState<"operations" | "logistics" | "business" | "advanced">("operations");

  // For Advanced Tab
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<any>(null);
  const [formData, setFormData] = useState<SettingsFormData>({ key: "", value: "", description: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper to read setting
  const getSetting = (key: string, fallback: string) => {
    const s = settings.find(s => s.key === key);
    return s ? s.value : fallback;
  };

  // Helper to save setting
  const saveSetting = async (key: string, value: string, description: string) => {
    const existing = settings.find(s => s.key === key);
    if (existing) {
      await updateSetting(existing.id, { key, value, description });
    } else {
      await createSetting({ key, value, description });
    }
  };

  // Toggles
  const handleToggle = async (key: string, currentValStr: string, description: string) => {
    const isCurrentlyTrue = currentValStr === "true";
    await saveSetting(key, isCurrentlyTrue ? "false" : "true", description);
  };

  // Inputs
  const handleInputBlur = async (key: string, value: string, description: string) => {
    await saveSetting(key, value, description);
  };

  // Advanced Tab logic
  const filteredSettings = useMemo(() => {
    return settings.filter(s => 
      s.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [settings, searchQuery]);

  const handleOpenModal = (setting?: any) => {
    if (setting) {
      setEditingSetting(setting);
      setFormData({ key: setting.key, value: setting.value, description: setting.description || "" });
    } else {
      setEditingSetting(null);
      setFormData({ key: "", value: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const handleAdvancedSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingSetting) {
        await updateSetting(editingSetting.id, formData);
      } else {
        await createSetting(formData);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message || "Error saving setting.");
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSetting(itemToDelete);
    } catch (error) {
      // ignore
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  // Component Building Blocks
  const SettingToggle = ({ title, description, settingKey, icon: Icon, destructive = false }: any) => {
    const val = getSetting(settingKey, "false");
    const isActive = val === "true";
    
    return (
      <div className={`p-6 rounded-[1.5rem] border backdrop-blur-sm transition-all flex items-center justify-between gap-4 ${isActive ? (destructive ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200') : 'bg-white/60 border-[var(--border)]'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl flex-shrink-0 ${isActive ? (destructive ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600') : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-[var(--foreground)] text-lg">{title}</h4>
            <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
          </div>
        </div>
        <button 
          onClick={() => handleToggle(settingKey, val, description)}
          className={`w-14 h-8 rounded-full p-1 transition-colors relative flex-shrink-0 ${isActive ? (destructive ? 'bg-rose-500' : 'bg-emerald-500') : 'bg-gray-300'}`}
        >
          <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
        </button>
      </div>
    )
  }

  const SettingInput = ({ title, description, settingKey, fallback, type = "number", prefix, suffix, icon: Icon }: any) => {
    const [localVal, setLocalVal] = useState(getSetting(settingKey, fallback));
    
    return (
      <div className="p-6 rounded-[1.5rem] border border-[var(--border)] bg-white/60 backdrop-blur-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[var(--muted)] text-[var(--muted-foreground)] flex-shrink-0">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-[var(--foreground)] text-lg">{title}</h4>
            <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {prefix && <span className="font-bold text-[var(--muted-foreground)]">{prefix}</span>}
          <input 
            type={type}
            value={localVal}
            onChange={(e) => setLocalVal(e.target.value)}
            onBlur={() => handleInputBlur(settingKey, localVal, description)}
            className="w-24 p-2 text-center font-bold text-lg border border-[var(--border)] rounded-xl bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {suffix && <span className="font-bold text-[var(--muted-foreground)]">{suffix}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16 min-h-screen bg-[var(--background)] relative">
      <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
      
      <div className="relative z-10 space-y-8 p-6 md:p-10 max-w-[1200px] mx-auto animate-in fade-in duration-500">
        
        <DashboardSection 
          title="System Settings"
          description="Manage global application configuration variables and operations."
          action={
            <BackButton fallback="/admin" label="Back to Admin" variant="outline" />
          }
        />

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-[var(--muted)]/50 rounded-2xl border border-[var(--border)] w-fit mb-8">
          <button onClick={() => setActiveTab("operations")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'operations' ? 'bg-white shadow-sm text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}>
            <Setting2 className="w-4 h-4" /> Store Operations
          </button>
          <button onClick={() => setActiveTab("logistics")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'logistics' ? 'bg-white shadow-sm text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}>
            <TruckFast className="w-4 h-4" /> Logistics & Delivery
          </button>
          <button onClick={() => setActiveTab("business")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'business' ? 'bg-white shadow-sm text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}>
            <Moneys className="w-4 h-4" /> Business & Payments
          </button>
          <button onClick={() => setActiveTab("advanced")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'advanced' ? 'bg-white shadow-sm text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}>
            <BoxSearch className="w-4 h-4" /> Advanced (Raw Data)
          </button>
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-[var(--brand-champagne)] border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="space-y-6">
            
            {/* OPERATIONS TAB */}
            {activeTab === 'operations' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SettingToggle 
                    title="Maintenance Mode" 
                    description="Instantly stop accepting all new online orders." 
                    settingKey="maintenance_mode" 
                    icon={Warning2} 
                    destructive={true}
                  />
                  <SettingToggle 
                    title="Auto-Assign Drivers" 
                    description="Automatically dispatch available drivers when order is Ready." 
                    settingKey="auto_assign_drivers" 
                    icon={Car} 
                  />
                  <SettingToggle 
                    title="Mango Fusion Active" 
                    description="Enable the Summer Exclusive Mango Flavours menu." 
                    settingKey="mango_fusion_active" 
                    icon={MagicStar} 
                  />
                  <SettingToggle 
                    title="Strawberry Fusion Active" 
                    description="Enable the Winter Exclusive Strawberry Flavours menu." 
                    settingKey="strawberry_fusion_active" 
                    icon={MagicStar} 
                  />
                </div>
              </div>
            )}

            {/* LOGISTICS TAB */}
            {activeTab === 'logistics' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-w-3xl">
                <SettingInput
                  title="Max Delivery Radius"
                  description="Maximum distance allowed for home delivery."
                  settingKey="delivery_radius_km"
                  fallback="10"
                  suffix="km"
                  icon={GlobalSearch}
                />
                <SettingInput
                  title="Flat Delivery Fee"
                  description="Base delivery charge applied to orders under the threshold."
                  settingKey="flat_delivery_fee"
                  fallback="50"
                  prefix="₹"
                  icon={Moneys}
                />
                <SettingInput
                  title="Free Delivery Threshold"
                  description="Orders above this amount get free delivery."
                  settingKey="free_delivery_threshold"
                  fallback="1500"
                  prefix="₹"
                  icon={CardTick}
                />
              </div>
            )}

            {/* BUSINESS TAB */}
            {activeTab === 'business' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-w-3xl">
                <SettingToggle 
                  title="Accept Cash on Delivery" 
                  description="Allow customers to pay upon delivery." 
                  settingKey="accept_cod" 
                  icon={Moneys} 
                />
                <SettingInput
                  title="Advance Payment Percentage"
                  description="Percentage of grand total required upfront for custom orders."
                  settingKey="advance_payment_percentage"
                  fallback="50"
                  suffix="%"
                  icon={Danger}
                />
              </div>
            )}

            {/* ADVANCED TAB */}
            {activeTab === 'advanced' && (
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-300">
                <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-foreground">Raw Data Editor</h3>
                    <p className="text-xs text-muted-foreground">Manage raw keys and values directly in the database.</p>
                  </div>
                  <Button onClick={() => handleOpenModal()} size="sm">
                    <Add className="w-4 h-4 mr-2" /> Add Key
                  </Button>
                </div>
                <DataTable
                  label="Raw Settings"
                  columns={columns}
                  data={filteredSettings}
                  isLoading={isLoading}
                  persistState={true}
                  toolbar={
                    <SettingsFilters 
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                    />
                  }
                  rowActions={[
                    {
                      label: "Edit",
                      onClick: (row) => handleOpenModal(row)
                    },
                    {
                      label: "Delete",
                      variant: "destructive",
                      onClick: (row) => setItemToDelete(row.id)
                    }
                  ]}
                />
              </div>
            )}

          </div>
        )}

        {/* Edit Modal (For Advanced Tab) */}
        <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
          <SheetContent className="sm:max-w-md w-full overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>{editingSetting ? "Edit Raw Setting" : "New Raw Setting"}</SheetTitle>
            </SheetHeader>
            <SettingsForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleAdvancedSave}
              isSaving={isSaving}
              isEditing={!!editingSetting}
            />
          </SheetContent>
        </Sheet>

        <ConfirmationDialog 
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={executeDelete}
          title="Delete Setting"
          description="Are you sure you want to delete this configuration key? Missing keys might cause application errors. This action cannot be undone."
          confirmText="Delete Setting"
          variant="danger"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}
