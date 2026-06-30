'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Plus, Pencil, Trash2, QrCode, Printer } from 'lucide-react'
import { toast } from 'sonner'

type Room = {
  id: string
  room_number: string
  name: string | null
  status: 'active' | 'inactive'
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  const [dialog, setDialog] = useState(false)
  const [form, setForm] = useState({ room_number: '', name: '' })
  const [editRoom, setEditRoom] = useState<Room | null>(null)

  const [qrRoom, setQrRoom] = useState<Room | null>(null)
  const [baseUrl, setBaseUrl] = useState('')

  useEffect(() => {
    fetchRooms()
    setBaseUrl(window.location.origin)
  }, [])

  async function fetchRooms() {
    const supabase = createClient()
    const { data } = await supabase.from('rooms').select('*').order('room_number')
    setRooms(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditRoom(null)
    setForm({ room_number: '', name: '' })
    setDialog(true)
  }

  function openEdit(room: Room) {
    setEditRoom(room)
    setForm({ room_number: room.room_number, name: room.name || '' })
    setDialog(true)
  }

  async function saveRoom() {
    if (!form.room_number) {
      toast.error('กรุณากรอกหมายเลขห้อง')
      return
    }
    const supabase = createClient()
    if (editRoom) {
      const { error } = await supabase.from('rooms').update(form).eq('id', editRoom.id)
      if (error) {
        toast.error('เกิดข้อผิดพลาด: ' + error.message)
        return
      }
      toast.success('แก้ไขห้องสำเร็จ')
    } else {
      const { error } = await supabase.from('rooms').insert(form)
      if (error) {
        toast.error('เกิดข้อผิดพลาด: ' + error.message)
        return
      }
      toast.success('เพิ่มห้องสำเร็จ')
    }
    setDialog(false)
    fetchRooms()
  }

  async function deleteRoom(id: string) {
    if (!confirm('ลบห้องนี้?')) return
    const supabase = createClient()
    await supabase.from('rooms').delete().eq('id', id)
    toast.success('ลบห้องแล้ว')
    fetchRooms()
  }

  async function toggleStatus(room: Room) {
    const supabase = createClient()
    const newStatus = room.status === 'active' ? 'inactive' : 'active'
    await supabase.from('rooms').update({ status: newStatus }).eq('id', room.id)
    fetchRooms()
  }

  function orderUrl(roomNumber: string) {
    return `${baseUrl}/order?room=${roomNumber}`
  }

  function printQr() {
    window.print()
  }

  if (loading) return <p className="text-muted-foreground">กำลังโหลด...</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">จัดการห้อง</h2>
        <Button size="sm" onClick={openAdd}>
          <Plus className="mr-1 h-4 w-4" /> เพิ่มห้อง
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>หมายเลขห้อง</TableHead>
            <TableHead>ชื่อ</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead className="text-right">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground text-center">
                ยังไม่มีห้อง
              </TableCell>
            </TableRow>
          )}
          {rooms.map((room) => (
            <TableRow key={room.id}>
              <TableCell className="font-medium">{room.room_number}</TableCell>
              <TableCell>{room.name || '-'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={room.status === 'active'}
                    onCheckedChange={() => toggleStatus(room)}
                  />
                  <Badge variant={room.status === 'active' ? 'default' : 'outline'}>
                    {room.status === 'active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="icon" variant="ghost" onClick={() => setQrRoom(room)}>
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(room)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => deleteRoom(room.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* ---- Add/Edit Dialog ---- */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRoom ? 'แก้ไขห้อง' : 'เพิ่มห้อง'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>หมายเลขห้อง</Label>
              <Input
                value={form.room_number}
                onChange={(e) => setForm((p) => ({ ...p, room_number: e.target.value }))}
                placeholder="เช่น 101"
              />
            </div>
            <div className="space-y-1">
              <Label>ชื่อห้อง (ถ้ามี)</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="เช่น VIP 1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={saveRoom}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- QR Dialog ---- */}
      <Dialog open={!!qrRoom} onOpenChange={() => setQrRoom(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code — ห้อง {qrRoom?.room_number}</DialogTitle>
          </DialogHeader>
          {qrRoom && (
            <div id="qr-print-area" className="flex flex-col items-center gap-4 py-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(orderUrl(qrRoom.room_number))}`}
                alt="QR Code"
                className="h-64 w-64 rounded-lg border"
              />
              <p className="text-center text-lg font-bold">
                ห้อง {qrRoom.room_number}
                {qrRoom.name ? ` — ${qrRoom.name}` : ''}
              </p>
              <p className="text-muted-foreground text-center text-xs break-all">
                {orderUrl(qrRoom.room_number)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrRoom(null)}>
              ปิด
            </Button>
            <Button onClick={printQr}>
              <Printer className="mr-1 h-4 w-4" /> พิมพ์
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
