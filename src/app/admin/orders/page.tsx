'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Clock, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

type OrderItem = { id: string; name: string; qty: number; price: number; note: string | null }
type Order = {
  id: string
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
  payment_method: 'cash' | 'promptpay'
  total: number
  created_at: string
  note: string | null
  rooms: { room_number: string; name: string | null } | null
  order_items: OrderItem[]
  payments: { status: string; method: string }[]
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'รอดำเนินการ',
  preparing: 'กำลังทำ',
  ready: 'พร้อมเสิร์ฟ',
  served: 'เสิร์ฟแล้ว',
  cancelled: 'ยกเลิก',
}
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  ready: 'bg-purple-100 text-purple-800',
  served: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<Order | null>(null)
  const [tab, setTab] = useState('all')

  useEffect(() => {
    fetchOrders()
    const supabase = createClient()
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchOrders() {
    const supabase = createClient()
    const { data } = await supabase
      .from('orders')
      .select(
        `*, rooms (room_number, name), order_items (id, name, qty, price, note), payments (status, method)`
      )
      .order('created_at', { ascending: false })
    setOrders((data as Order[]) || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: Order['status']) {
    const supabase = createClient()
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (error) {
      toast.error('แก้ไขไม่สำเร็จ: ' + error.message)
      return
    }
    toast.success('อัปเดตสถานะแล้ว')
    setDetail(null)
  }

  async function deleteOrder(id: string) {
    if (!confirm('ลบออเดอร์นี้? ข้อมูลจะหายถาวร')) return
    const supabase = createClient()
    await supabase.from('orders').delete().eq('id', id)
    toast.success('ลบออเดอร์แล้ว')
    setDetail(null)
    fetchOrders()
  }

  const filtered = tab === 'all' ? orders : orders.filter((o) => o.status === tab)

  if (loading) return <p className="text-muted-foreground">กำลังโหลด...</p>

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">รายการออเดอร์ทั้งหมด</h2>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="all">ทั้งหมด ({orders.length})</TabsTrigger>
          <TabsTrigger value="pending">
            รอดำเนินการ ({orders.filter((o) => o.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="preparing">
            กำลังทำ ({orders.filter((o) => o.status === 'preparing').length})
          </TabsTrigger>
          <TabsTrigger value="ready">
            พร้อมเสิร์ฟ ({orders.filter((o) => o.status === 'ready').length})
          </TabsTrigger>
          <TabsTrigger value="served">
            เสิร์ฟแล้ว ({orders.filter((o) => o.status === 'served').length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            ยกเลิก ({orders.filter((o) => o.status === 'cancelled').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4 space-y-2">
          {filtered.length === 0 && (
            <p className="text-muted-foreground py-12 text-center">ไม่มีออเดอร์</p>
          )}
          {filtered.map((order) => (
            <Card
              key={order.id}
              className="cursor-pointer transition-colors hover:border-orange-300"
              onClick={() => setDetail(order)}
            >
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      ห้อง {order.rooms?.room_number}
                      {order.rooms?.name ? ` — ${order.rooms.name}` : ''}
                    </p>
                    <Badge className={STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-800'}>
                      {STATUS_LABEL[order.status] || order.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" /> {formatDate(order.created_at)} ·{' '}
                    {order.order_items.length} รายการ
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold">฿{order.total}</p>
                  <p className="text-muted-foreground text-xs">
                    {order.payment_method === 'cash' ? '💵 เงินสด' : '📱 PromptPay'}
                  </p>
                </div>
                <Eye className="text-muted-foreground h-4 w-4 shrink-0" />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* ---- Detail Dialog ---- */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              ห้อง {detail?.rooms?.room_number}
              {detail?.rooms?.name ? ` — ${detail.rooms.name}` : ''}
            </DialogTitle>
          </DialogHeader>

          {detail && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={STATUS_COLOR[detail.status]}>{STATUS_LABEL[detail.status]}</Badge>
                <span className="text-muted-foreground text-xs">
                  {formatDate(detail.created_at)}
                </span>
              </div>

              <Separator />

              <div className="space-y-2">
                {detail.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.name} × {item.qty}
                    </span>
                    <span className="text-muted-foreground">฿{item.price * item.qty}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between font-bold">
                <span>รวม</span>
                <span>฿{detail.total}</span>
              </div>

              <p className="text-muted-foreground text-sm">
                ชำระโดย: {detail.payment_method === 'cash' ? '💵 เงินสด' : '📱 PromptPay'} (
                {detail.payments[0]?.status === 'confirmed' ? 'ยืนยันแล้ว ✅' : 'รอยืนยัน'})
              </p>

              <Separator />

              {/* แก้สถานะ */}
              <div className="space-y-2">
                <p className="text-sm font-medium">เปลี่ยนสถานะ</p>
                <div className="flex flex-wrap gap-2">
                  {(['pending', 'preparing', 'ready', 'served', 'cancelled'] as const).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={detail.status === s ? 'default' : 'outline'}
                      onClick={() => updateStatus(detail.id, s)}
                    >
                      {STATUS_LABEL[s]}
                    </Button>
                  ))}
                </div>
              </div>
              <Separator />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
