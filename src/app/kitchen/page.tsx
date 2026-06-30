'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChefHat, CheckCircle, Clock, Ban } from 'lucide-react'

type OrderItem = {
  id: string
  name: string
  qty: number
  note: string | null
}

type Order = {
  id: string
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
  payment_method: 'cash' | 'promptpay'
  total: number
  created_at: string
  note: string | null
  rooms: { room_number: string; name: string } | null
  order_items: OrderItem[]
  payments: { status: string }[]
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

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff} วินาทีที่แล้ว`
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`
  return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`
}

function OrderCard({
  order,
  onUpdateStatus,
}: {
  order: Order
  onUpdateStatus: (id: string, status: Order['status']) => void
}) {
  const paymentStatus = order.payments[0]?.status ?? 'pending'

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              ห้อง {order.rooms?.room_number}
              {order.rooms?.name ? ` — ${order.rooms.name}` : ''}
            </CardTitle>
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" /> {timeAgo(order.created_at)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={STATUS_COLOR[order.status]}>{STATUS_LABEL[order.status]}</Badge>
            <span className="text-muted-foreground text-xs">
              {order.payment_method === 'cash' ? '💵 เงินสด' : '📱 PromptPay'}
              {paymentStatus === 'confirmed' ? ' ✅' : ''}
            </span>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-1 pt-3 pb-3">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.name}</span>
            <span className="text-muted-foreground">× {item.qty}</span>
          </div>
        ))}
        {order.note && (
          <p className="text-muted-foreground mt-2 border-l-2 border-orange-300 pl-2 text-xs">
            หมายเหตุ: {order.note}
          </p>
        )}
      </CardContent>

      <Separator />

      <CardContent className="pt-3 pb-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-muted-foreground text-sm">รวม</span>
          <span className="font-bold">฿{order.total}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {order.status === 'pending' && (
            <>
              <Button
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                onClick={() => onUpdateStatus(order.id, 'preparing')}
              >
                <ChefHat className="mr-1 h-4 w-4" /> รับออเดอร์
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-500 hover:bg-red-50"
                onClick={() => onUpdateStatus(order.id, 'cancelled')}
              >
                <Ban className="h-4 w-4" />
              </Button>
            </>
          )}
          {order.status === 'preparing' && (
            <Button
              className="flex-1 bg-purple-500 hover:bg-purple-600"
              onClick={() => onUpdateStatus(order.id, 'ready')}
            >
              <CheckCircle className="mr-1 h-4 w-4" /> ทำเสร็จแล้ว
            </Button>
          )}
          {order.status === 'ready' && (
            <Button
              className="flex-1 bg-green-500 hover:bg-green-600"
              onClick={() => onUpdateStatus(order.id, 'served')}
            >
              <CheckCircle className="mr-1 h-4 w-4" /> ส่งให้ลูกค้าแล้ว
            </Button>
          )}
          {order.status === 'served' && (
            <p className="w-full text-center text-sm font-medium text-green-600">
              ✅ เสิร์ฟเรียบร้อย
            </p>
          )}
          {order.status === 'cancelled' && (
            <p className="w-full text-center text-sm font-medium text-red-500">❌ ยกเลิกแล้ว</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
    subscribeRealtime()
  }, [])

  async function fetchOrders() {
    const supabase = createClient()
    const { data } = await supabase
      .from('orders')
      .select(`*, rooms (room_number, name), order_items (id, name, qty, note), payments (status)`)
      .not('status', 'in', '(served,cancelled)')
      .order('created_at', { ascending: true })

    setOrders((data as Order[]) || [])
    setLoading(false)
  }

  function subscribeRealtime() {
    const supabase = createClient()
    supabase
      .channel('kitchen')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        fetchOrders()
      })
      .subscribe()
  }

  async function updateStatus(id: string, status: Order['status']) {
    const supabase = createClient()
    await supabase.from('orders').update({ status }).eq('id', id)
  }

  const pending = orders.filter((o) => o.status === 'pending')
  const preparing = orders.filter((o) => o.status === 'preparing')
  const ready = orders.filter((o) => o.status === 'ready')

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    )

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-background sticky top-0 z-10 border-b">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-orange-500" />
            <h1 className="text-lg font-bold">หน้าครัว</h1>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-yellow-100 text-yellow-800">{pending.length} รอ</Badge>
            <Badge className="bg-blue-100 text-blue-800">{preparing.length} กำลังทำ</Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto max-w-2xl px-4 py-4">
        <Tabs defaultValue="pending">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="pending" className="flex-1">
              รอ{' '}
              {pending.length > 0 && (
                <Badge className="ml-1 bg-yellow-500 text-xs text-white">{pending.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preparing" className="flex-1">
              กำลังทำ{' '}
              {preparing.length > 0 && (
                <Badge className="ml-1 bg-blue-500 text-xs text-white">{preparing.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready" className="flex-1">
              พร้อมเสิร์ฟ{' '}
              {ready.length > 0 && (
                <Badge className="ml-1 bg-purple-500 text-xs text-white">{ready.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="space-y-3 pr-2">
                {pending.length === 0 ? (
                  <p className="text-muted-foreground py-12 text-center">ไม่มีออเดอร์ที่รออยู่</p>
                ) : (
                  pending.map((order) => (
                    <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preparing">
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="space-y-3 pr-2">
                {preparing.length === 0 ? (
                  <p className="text-muted-foreground py-12 text-center">ไม่มีออเดอร์ที่กำลังทำ</p>
                ) : (
                  preparing.map((order) => (
                    <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="ready">
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="space-y-3 pr-2">
                {ready.length === 0 ? (
                  <p className="text-muted-foreground py-12 text-center">
                    ไม่มีออเดอร์ที่พร้อมเสิร์ฟ
                  </p>
                ) : (
                  ready.map((order) => (
                    <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
