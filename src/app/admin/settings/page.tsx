'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Save } from 'lucide-react'
import { toast } from 'sonner'

type SettingsForm = {
  shop_name: string
  shop_phone: string
  promptpay_id: string
  logo_url: string
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SettingsForm>({
    shop_name: '',
    shop_phone: '',
    promptpay_id: '',
    logo_url: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    const supabase = createClient()
    const { data } = await supabase.from('settings').select('key, value')
    if (data) {
      const map: Record<string, string> = {}
      data.forEach((row) => {
        map[row.key] = row.value || ''
      })
      setForm({
        shop_name: map.shop_name || '',
        shop_phone: map.shop_phone || '',
        promptpay_id: map.promptpay_id || '',
        logo_url: map.logo_url || '',
      })
    }
    setLoading(false)
  }

  async function saveSettings() {
    setSaving(true)
    const supabase = createClient()

    const updates = Object.entries(form).map(([key, value]) =>
      supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
    )

    const results = await Promise.all(updates)
    const hasError = results.some((r) => r.error)

    if (hasError) {
      toast.error('บันทึกไม่สำเร็จ')
    } else {
      toast.success('บันทึกการตั้งค่าสำเร็จ')
    }
    setSaving(false)
  }

  if (loading) return <p className="text-muted-foreground">กำลังโหลด...</p>

  return (
    <div className="max-w-md space-y-6">
      <h2 className="text-lg font-bold">ตั้งค่าร้าน</h2>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1">
            <Label>ชื่อร้าน</Label>
            <Input
              value={form.shop_name}
              onChange={(e) => setForm((p) => ({ ...p, shop_name: e.target.value }))}
              placeholder="เช่น ร้านอาหารตัวอย่าง"
            />
          </div>

          <div className="space-y-1">
            <Label>เบอร์โทรร้าน (สำหรับลูกค้าโทรยกเลิกออเดอร์)</Label>
            <Input
              value={form.shop_phone}
              onChange={(e) => setForm((p) => ({ ...p, shop_phone: e.target.value }))}
              placeholder="เช่น 0812345678"
            />
          </div>

          <div className="space-y-1">
            <Label>PromptPay ID (เบอร์มือถือ/เลขบัตรประชาชน)</Label>
            <Input
              value={form.promptpay_id}
              onChange={(e) => setForm((p) => ({ ...p, promptpay_id: e.target.value }))}
              placeholder="เช่น 0812345678"
            />
          </div>

          <div className="space-y-1">
            <Label>โลโก้ร้าน (URL รูปภาพ)</Label>
            <Input
              value={form.logo_url}
              onChange={(e) => setForm((p) => ({ ...p, logo_url: e.target.value }))}
              placeholder="https://..."
            />
            {form.logo_url && (
              <img
                src={form.logo_url}
                alt="logo preview"
                className="mt-2 h-20 w-20 rounded-lg object-cover"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Button onClick={saveSettings} disabled={saving} className="w-full">
        <Save className="mr-1 h-4 w-4" /> {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
      </Button>
    </div>
  )
}
