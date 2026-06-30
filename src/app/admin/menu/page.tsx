'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Plus, Pencil, Trash2, FolderPlus } from 'lucide-react'
import { toast } from 'sonner'
import { ImagePlus, X } from 'lucide-react'
import { useRef } from 'react'

type Category = { id: string; name: string; sort_order: number }
type MenuItem = {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  sort_order: number
}

const EMPTY_ITEM: Omit<MenuItem, 'id'> = {
  category_id: '',
  name: '',
  description: '',
  price: 0,
  image_url: '',
  is_available: true,
  sort_order: 0,
}

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  // Category dialog
  const [catDialog, setCatDialog] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', sort_order: 0 })
  const [editCat, setEditCat] = useState<Category | null>(null)

  // Menu dialog
  const [menuDialog, setMenuDialog] = useState(false)
  const [menuForm, setMenuForm] = useState<Omit<MenuItem, 'id'>>(EMPTY_ITEM)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    const supabase = createClient()
    const [{ data: cats }, { data: menuItems }] = await Promise.all([
      supabase.from('menu_categories').select('*').order('sort_order'),
      supabase.from('menu_items').select('*').order('sort_order'),
    ])
    setCategories(cats || [])
    setItems(menuItems || [])
    setLoading(false)
  }

  // ---- Category CRUD ----
  function openAddCat() {
    setEditCat(null)
    setCatForm({ name: '', sort_order: categories.length })
    setCatDialog(true)
  }

  function openEditCat(cat: Category) {
    setEditCat(cat)
    setCatForm({ name: cat.name, sort_order: cat.sort_order })
    setCatDialog(true)
  }

  async function saveCat() {
    const supabase = createClient()
    if (editCat) {
      await supabase.from('menu_categories').update(catForm).eq('id', editCat.id)
      toast.success('แก้ไขหมวดหมู่สำเร็จ')
    } else {
      await supabase.from('menu_categories').insert(catForm)
      toast.success('เพิ่มหมวดหมู่สำเร็จ')
    }
    setCatDialog(false)
    fetchAll()
  }

 async function deleteCat(id: string) {
  if (!confirm('ลบหมวดหมู่นี้? เมนูในหมวดนี้จะไม่มีหมวดหมู่')) return
  const supabase = createClient()
  const { error } = await supabase.from('menu_categories').delete().eq('id', id)
  if (error) { toast.error('ลบไม่สำเร็จ: ' + error.message); return }
  toast.success('ลบหมวดหมู่แล้ว')
  setCategories(prev => prev.filter(c => c.id !== id))
}

  // ---- Menu Item CRUD ----
  function openAddItem(categoryId?: string) {
    setEditItem(null)
    setMenuForm({
      ...EMPTY_ITEM,
      category_id: categoryId || categories[0]?.id || '',
      sort_order: items.length,
    })
    setMenuDialog(true)
  }

  function openEditItem(item: MenuItem) {
    setEditItem(item)
    setMenuForm({
      category_id: item.category_id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      image_url: item.image_url || '',
      is_available: item.is_available,
      sort_order: item.sort_order,
    })
    setMenuDialog(true)
  }

  async function saveItem() {
    if (!menuForm.name || !menuForm.price) {
      toast.error('กรุณากรอกชื่อและราคา')
      return
    }
    const supabase = createClient()
    const payload = { ...menuForm, price: Number(menuForm.price) }
    if (editItem) {
      await supabase.from('menu_items').update(payload).eq('id', editItem.id)
      toast.success('แก้ไขเมนูสำเร็จ')
    } else {
      await supabase.from('menu_items').insert(payload)
      toast.success('เพิ่มเมนูสำเร็จ')
    }
    setMenuDialog(false)
    fetchAll()
  }

  async function deleteItem(id: string) {
    if (!confirm('ลบเมนูนี้?')) return
      const supabase = createClient()
      const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (error) { toast.error('ลบไม่สำเร็จ: ' + error.message); return }
      toast.success('ลบเมนูแล้ว')
      setItems(prev => prev.filter(i => i.id !== id))
  }

  async function toggleAvailable(item: MenuItem) {
    const supabase = createClient()
    await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id)
    fetchAll()
  }

  async function handleFileUpload(file: File) {
    const supabase = createClient()
    const fileName = `${Date.now()}-${file.name}`

    const { error } = await supabase.storage.from('menu-images').upload(fileName, file)
    if (error) {
      toast.error('อัปโหลดรูปไม่สำเร็จ: ' + error.message)
      return
    }

    const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(fileName)
    setMenuForm((p) => ({ ...p, image_url: urlData.publicUrl }))
    toast.success('อัปโหลดรูปสำเร็จ')
  }

  if (loading) return <p className="text-muted-foreground">กำลังโหลด...</p>

  return (
    <div className="space-y-8">
      {/* ---- หมวดหมู่ ---- */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">หมวดหมู่</h2>
          <Button size="sm" onClick={openAddCat}>
            <FolderPlus className="mr-1 h-4 w-4" /> เพิ่มหมวดหมู่
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อหมวดหมู่</TableHead>
              <TableHead>ลำดับ</TableHead>
              <TableHead>จำนวนเมนู</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground text-center">
                  ยังไม่มีหมวดหมู่
                </TableCell>
              </TableRow>
            )}
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell>{cat.sort_order}</TableCell>
                <TableCell>{items.filter((i) => i.category_id === cat.id).length}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEditCat(cat)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => deleteCat(cat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <Separator />

      {/* ---- เมนู ---- */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">รายการเมนู</h2>
          <Button size="sm" onClick={() => openAddItem()}>
            <Plus className="mr-1 h-4 w-4" /> เพิ่มเมนู
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>รูป</TableHead>
              <TableHead>ชื่อเมนู</TableHead>
              <TableHead>หมวดหมู่</TableHead>
              <TableHead>ราคา</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  ยังไม่มีเมนู
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-md text-xs">
                      ไม่มีรูป
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <p className="font-medium">{item.name}</p>
                  {item.description && (
                    <p className="text-muted-foreground max-w-[200px] truncate text-xs">
                      {item.description}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {categories.find((c) => c.id === item.category_id)?.name ?? '-'}
                  </Badge>
                </TableCell>
                <TableCell>฿{item.price}</TableCell>
                <TableCell>
                  <Switch
                    checked={item.is_available}
                    onCheckedChange={() => toggleAvailable(item)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEditItem(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* ---- Category Dialog ---- */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editCat ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>ชื่อหมวดหมู่</Label>
              <Input
                value={catForm.name}
                onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="เช่น อาหารจานหลัก"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={saveCat}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Menu Item Dialog ---- */}
      <Dialog open={menuDialog} onOpenChange={setMenuDialog}>
        <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'แก้ไขเมนู' : 'เพิ่มเมนู'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>หมวดหมู่</Label>
              <select
                className="bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={menuForm.category_id}
                onChange={(e) => setMenuForm((p) => ({ ...p, category_id: e.target.value }))}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>ชื่อเมนู</Label>
              <Input
                value={menuForm.name}
                onChange={(e) => setMenuForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="เช่น ข้าวผัดกุ้ง"
              />
            </div>
            <div className="space-y-1">
              <Label>คำอธิบาย</Label>
              <Textarea
                value={menuForm.description || ''}
                onChange={(e) => setMenuForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="รายละเอียดเมนู (ถ้ามี)"
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <Label>ราคา (บาท)</Label>
              <Input
                type="number"
                value={menuForm.price}
                onChange={(e) => setMenuForm((p) => ({ ...p, price: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <Label>รูปภาพเมนู</Label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
              />

              {menuForm.image_url ? (
                <div className="relative">
                  <img
                    src={menuForm.image_url}
                    alt="preview"
                    className="h-40 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setMenuForm((p) => ({ ...p, image_url: '' }))}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                  className="border-muted-foreground/30 flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors hover:border-orange-400 hover:bg-orange-50/50"
                >
                  <ImagePlus className="text-muted-foreground h-8 w-8" />
                  <p className="text-muted-foreground text-sm">คลิกหรือลากรูปมาวางที่นี่</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={menuForm.is_available}
                onCheckedChange={(v) => setMenuForm((p) => ({ ...p, is_available: v }))}
              />
              <Label>เปิดขาย</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMenuDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={saveItem}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
