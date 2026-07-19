import { Metadata } from 'next'
import { MediaGallery } from '@/components/admin/media/MediaGallery'
import { BackButton } from '@/components/ui/BackButton'

export const metadata: Metadata = {
  title: 'Media Management | Gopal Cake Shop Admin',
  description: 'Manage digital assets for products, categories, and settings.'
}

export default function AdminMediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4">
          <BackButton fallback="/admin" label="Back" variant="outline" size="sm" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Digital Asset Management</h1>
        <p className="text-muted-foreground">Upload and manage images across all storefront properties.</p>
      </div>
      
      <MediaGallery folder="gopal-cake-shop" />
    </div>
  )
}
