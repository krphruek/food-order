'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShoppingCart, Plus, Minus, ChevronLeft, Banknote, Smartphone } from 'lucide-react'
import type { Room, Category, MenuItem, CartItem } from '@/types'

// Cart Sheet
function CartSheet({
  open,
  cart,
  room,
  totalPrice,
  onClose,
  onAdd,
  onRemove,
  onPlaceOrder,
}: {
  open: boolean
  cart: CartItem[]
  room: Room
  totalPrice: number
  onClose: () => void
  onAdd: (item: MenuItem) => void
  onRemove: (id: string) => void
  onPlaceOrder: (method: 'cash' | 'promptpay') => Promise<void>
}) {
  const [step, setStep] = useState<'cart' | 'payment'>('cart')
  const [loading, setLoading] = useState(false)

  async function handleOrder(method: 'cash' | 'promptpay') {
    setLoading(true)
    await onPlaceOrder(method)
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="flex h-[85vh] flex-col rounded-t-2xl px-0">
        <SheetHeader className="px-4 pb-2">
          {step === 'payment' && (
            <Button
              variant="ghost"
              size="sm"
              className="mb-1 -ml-2 w-fit"
              onClick={() => setStep('cart')}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> กลับ
            </Button>
          )}
          <SheetTitle>{step === 'cart' ? 'ตะกร้าของคุณ' : 'เลือกวิธีชำระเงิน'}</SheetTitle>
          <p className="text-muted-foreground text-sm">ห้อง {room.room_number}</p>
        </SheetHeader>

        <Separator />

        {step === 'cart' ? (
          <>
            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-sm text-orange-500">
                        ฿{item.price} × {item.qty} = ฿{item.price * item.qty}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-full"
                        onClick={() => onRemove(item.id)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-5 text-center text-sm font-medium">{item.qty}</span>
                      <Button
                        size="icon"
                        className="h-7 w-7 rounded-full bg-orange-500 hover:bg-orange-600"
                        onClick={() => onAdd(item)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator />
            <div className="space-y-3 px-4 py-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">รวมทั้งหมด</span>
                <span className="text-lg font-bold">฿{totalPrice}</span>
              </div>
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={() => setStep('payment')}
              >
                เลือกวิธีชำระเงิน →
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 space-y-3 px-4 py-6">
            <p className="text-muted-foreground mb-4 text-center">
              ยอดรวม <span className="text-xl font-bold text-orange-500">฿{totalPrice}</span>
            </p>

            <Card
              className="cursor-pointer transition-colors hover:border-orange-400"
              onClick={() => !loading && handleOrder('cash')}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <Banknote className="h-8 w-8 shrink-0 text-green-500" />
                <div>
                  <p className="font-bold">เก็บเงินปลายทาง</p>
                  <p className="text-muted-foreground text-sm">ชำระเงินสดกับพนักงาน</p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer transition-colors hover:border-orange-400"
              onClick={() => !loading && handleOrder('promptpay')}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <Smartphone className="h-8 w-8 shrink-0 text-blue-500" />
                <div>
                  <p className="font-bold">PromptPay</p>
                  <p className="text-muted-foreground text-sm">สแกน QR โอนเงิน + แนบสลิป</p>
                </div>
              </CardContent>
            </Card>

            {loading && (
              <p className="text-muted-foreground text-center text-sm">กำลังส่งออเดอร์...</p>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

//Menu Item Card
function MenuCard({
  item,
  qty,
  onAdd,
  onRemove,
}: {
  item: MenuItem
  qty: number
  onAdd: () => void
  onRemove: () => void
}) {
  return (
    <Card>
      <CardContent className="flex gap-4 overflow-hidden p-0">
        {/* รูปอาหาร */}
        {item.image_url && (
          <img src={item.image_url} alt={item.name} className="h-24 w-24 shrink-0 object-cover" />
        )}

        {/* ข้อมูล + ปุ่ม */}
        <div className="flex flex-1 items-center gap-2 py-3 pr-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{item.name}</p>
            {item.description && (
              <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
                {item.description}
              </p>
            )}
            <p className="mt-1 font-bold text-orange-500">฿{item.price}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {qty > 0 ? (
              <>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-full"
                  onClick={onRemove}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center font-medium">{qty}</span>
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full bg-orange-500 hover:bg-orange-600"
                  onClick={onAdd}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <Button
                size="icon"
                className="h-8 w-8 rounded-full bg-orange-500 hover:bg-orange-600"
                onClick={onAdd}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const STATUS_STEPS = [
  { key: 'pending', label: 'รอครัวรับออเดอร์', icon: '📝' },
  { key: 'preparing', label: 'กำลังปรุงอาหาร', icon: '👨‍🍳' },
  { key: 'ready', label: 'อาหารพร้อมแล้ว', icon: '🍽️' },
  { key: 'served', label: 'ได้รับอาหารแล้ว', icon: '✅' },
]

function OrderStatusTracker({ status }: { status: string }) {
  if (status === 'cancelled') {
    return (
      <Card className="w-full max-w-sm border-red-200 bg-red-50">
        <CardContent className="space-y-1 p-4 text-center">
          <p className="font-medium text-red-700">❌ ออเดอร์นี้ถูกยกเลิก</p>
          <p className="text-xs text-red-500">กำลังกลับไปหน้าสั่งอาหาร...</p>
        </CardContent>
      </Card>
    )
  }

  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === status)

  return (
    <div className="w-full max-w-sm">
      {STATUS_STEPS.map((step, i) => {
        const isDone = i < currentIndex
        const isCurrent = i === currentIndex
        const isUpcoming = i > currentIndex

        return (
          <div key={step.key} className="flex gap-3">
            {/* เส้น + จุด */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                  isDone
                    ? 'bg-orange-500 text-white'
                    : isCurrent
                      ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-400'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isDone ? '✓' : step.icon}
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div
                  className={`min-h-6 w-0.5 flex-1 ${isDone ? 'bg-orange-400' : 'bg-gray-200'}`}
                />
              )}
            </div>

            {/* ข้อความ */}
            <div className={`pb-6 ${isUpcoming ? 'opacity-40' : ''}`}>
              <p
                className={`text-sm font-medium ${isCurrent ? 'text-orange-600' : 'text-foreground'}`}
              >
                {step.label}
              </p>
              {isCurrent && i !== STATUS_STEPS.length - 1 && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-orange-500">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
                  กำลังดำเนินการ
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Order Success
function OrderSuccess({
  room,
  method,
  status,
  shopPhone,
}: {
  room: Room
  method: 'cash' | 'promptpay'
  status: string
  shopPhone: string
}) {
  return (
    <div className="flex min-h-screen flex-col items-center gap-6 px-4 pt-12 pb-8">
      <div className="text-center">
        <div className="mb-2 text-5xl">✅</div>
        <h1 className="text-xl font-bold">สั่งอาหารสำเร็จ!</h1>
        <p className="text-muted-foreground text-sm">ห้อง {room.room_number}</p>
      </div>

      <OrderStatusTracker status={status} />

      <Card className="w-full max-w-sm">
        <CardContent className="p-4">
          {method === 'cash' ? (
            <>
              <p className="text-sm font-medium">💵 ชำระเงินสดกับพนักงาน</p>
              <p className="text-muted-foreground mt-1 text-xs">
                พนักงานจะมาเก็บเงินเมื่ออาหารพร้อม
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">📱 รอ QR PromptPay จากพนักงาน</p>
              <p className="text-muted-foreground mt-1 text-xs">พนักงานจะส่ง QR สำหรับโอนเงินให้</p>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-sm border-orange-200 bg-orange-50">
        <CardContent className="space-y-1 p-4 text-sm">
          <p className="font-medium text-orange-700">ต้องการยกเลิกออเดอร์?</p>
          <p className="text-muted-foreground">
            กรุณาโทรแจ้งร้านที่{' '}
            {shopPhone && (
              <a href={`tel:${shopPhone}`} className="font-medium text-orange-600 underline">
                {shopPhone}
              </a>
            )}
          </p>
          <p className="text-muted-foreground text-xs">
            หากชำระเงินแล้ว ทางร้านขอสงวนสิทธิ์ไม่คืนเงินทุกกรณี
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
// เก็บ key แยกตามห้อง กันข้ามห้องสับสน
function getStorageKey(room: string) {
  return `active_order_${room}`
}

// ---------- Main ----------
function OrderContent() {
  const searchParams = useSearchParams()
  const roomNumber = searchParams.get('room')

  // ----- State -----
  const [room, setRoom] = useState<Room | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeCategory, setActiveCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderMethod, setOrderMethod] = useState<'cash' | 'promptpay' | null>(null)
  const [shopPhone, setShopPhone] = useState('')
  const [liveStatus, setLiveStatus] = useState('pending')

  // ----- Effects -----
  // โหลดข้อมูลห้อง + เมนู เมื่อรู้หมายเลขห้อง
  useEffect(() => {
    if (!roomNumber) {
      setError('ไม่พบหมายเลขห้อง กรุณาสแกน QR Code ใหม่')
      setLoading(false)
      return
    }
    fetchData()
  }, [roomNumber])

  // เช็คว่ามีออเดอร์ค้างอยู่ใน localStorage ไหม
  useEffect(() => {
    if (!roomNumber) return
    const saved = localStorage.getItem(getStorageKey(roomNumber))
    if (saved) {
      try {
        const { orderId: savedId, method } = JSON.parse(saved)
        checkExistingOrder(savedId, method)
      } catch {}
    }
  }, [roomNumber])

  // ฟังสถานะออเดอร์แบบเรียลไทม์
  useEffect(() => {
    if (!orderId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload: any) => {
          setLiveStatus(payload.new.status)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  // เคลียร์ออเดอร์อัตโนมัติเมื่อเสิร์ฟแล้วหรือถูกยกเลิก
  useEffect(() => {
    if (liveStatus !== 'served' && liveStatus !== 'cancelled') return
    const delay = liveStatus === 'cancelled' ? 4000 : 3500
    const timer = setTimeout(() => {
      if (roomNumber) localStorage.removeItem(getStorageKey(roomNumber))
      setOrderId(null)
      setOrderMethod(null)
      setLiveStatus('pending')
    }, delay)
    return () => clearTimeout(timer)
  }, [liveStatus, roomNumber])

  // ----- Data -----
  async function fetchData() {
    const supabase = createClient()

    const { data: roomData } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_number', roomNumber)
      .eq('status', 'active')
      .single()
    if (!roomData) {
      setError('ไม่พบห้องนี้ในระบบ')
      setLoading(false)
      return
    }
    setRoom(roomData)

    const { data: phoneSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'shop_phone')
      .single()
    setShopPhone(phoneSetting?.value || '')

    const [{ data: cats }, { data: items }] = await Promise.all([
      supabase.from('menu_categories').select('*').order('sort_order'),
      supabase.from('menu_items').select('*').eq('is_available', true).order('sort_order'),
    ])
    setCategories(cats || [])
    setMenuItems(items || [])
    if (cats?.length) setActiveCategory(cats[0].id)
    setLoading(false)
  }

  async function checkExistingOrder(savedId: string, method: 'cash' | 'promptpay') {
    const supabase = createClient()
    const { data } = await supabase.from('orders').select('status').eq('id', savedId).single()

    if (data && !['served', 'cancelled'].includes(data.status)) {
      setOrderId(savedId)
      setOrderMethod(method)
      setLiveStatus(data.status)
    } else {
      // ออเดอร์จบไปแล้วหรือถูกยกเลิก ลบทิ้ง
      if (roomNumber) localStorage.removeItem(getStorageKey(roomNumber))
    }
  }

  // ----- Cart -----
  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id)
      if (existing) return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
      return [...prev, { ...item, qty: 1, note: '' }]
    })
  }

  function removeFromCart(id: string) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === id)
      if (existing?.qty === 1) return prev.filter((c) => c.id !== id)
      return prev.map((c) => (c.id === id ? { ...c, qty: c.qty - 1 } : c))
    })
  }

  async function placeOrder(method: 'cash' | 'promptpay') {
    if (!room) return
    const supabase = createClient()
    const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ room_id: room.id, payment_method: method, total, status: 'pending' })
      .select()
      .single()
    if (orderError || !order) {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
      return
    }

    await supabase.from('order_items').insert(
      cart.map((c) => ({
        order_id: order.id,
        menu_item_id: c.id,
        name: c.name,
        price: c.price,
        qty: c.qty,
      }))
    )
    await supabase.from('payments').insert({
      order_id: order.id,
      method,
      amount: total,
      status: method === 'cash' ? 'confirmed' : 'pending',
    })

    setOrderId(order.id)
    setOrderMethod(method)
    setShowCart(false)
    setCart([])
    if (roomNumber) {
      localStorage.setItem(getStorageKey(roomNumber), JSON.stringify({ orderId: order.id, method }))
    }
  }

  // ----- Derived -----
  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0)
  const totalPrice = cart.reduce((sum, c) => sum + c.price * c.qty, 0)
  const filteredItems = menuItems.filter((i) => i.category_id === activeCategory)

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    )

  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-destructive text-center">{error}</p>
      </div>
    )

  if (orderId && room && orderMethod) {
    return (
      <OrderSuccess room={room} method={orderMethod} status={liveStatus} shopPhone={shopPhone} />
    )
  }
  return (
    <div className="bg-background min-h-screen pb-32">
      {/* Header */}
      <div className="bg-background sticky top-0 z-10 border-b">
        <div className="mx-auto max-w-lg px-4 py-3">
          <h1 className="text-lg font-bold">🍽️ สั่งอาหาร</h1>
          <p className="text-muted-foreground text-sm">
            ห้อง {room?.room_number}
            {room?.name ? ` — ${room.name}` : ''}
          </p>
        </div>

        {/* Category Tabs */}
        <ScrollArea className="w-full border-t">
          <div className="flex px-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`border-b-2 px-4 py-2 text-sm whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'border-orange-500 font-medium text-orange-500'
                    : 'text-muted-foreground border-transparent'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Menu List */}
      <div className="mx-auto max-w-lg space-y-3 px-4 py-4">
        {filteredItems.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center">ไม่มีเมนูในหมวดนี้</p>
        ) : (
          filteredItems.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              qty={cart.find((c) => c.id === item.id)?.qty ?? 0}
              onAdd={() => addToCart(item)}
              onRemove={() => removeFromCart(item.id)}
            />
          ))
        )}
      </div>

      {/* Cart Button */}
      {totalItems > 0 && (
        <div className="bg-background fixed right-0 bottom-0 left-0 border-t p-4">
          <div className="mx-auto max-w-lg">
            <Button
              className="h-12 w-full bg-orange-500 hover:bg-orange-600"
              onClick={() => setShowCart(true)}
            >
              <div className="flex w-full items-center justify-between">
                <Badge variant="secondary" className="bg-orange-600 text-white">
                  {totalItems} รายการ
                </Badge>
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" /> ดูตะกร้า
                </span>
                <span>฿{totalPrice}</span>
              </div>
            </Button>
          </div>
        </div>
      )}

      {/* Cart Sheet */}
      {room && (
        <CartSheet
          open={showCart}
          cart={cart}
          room={room}
          totalPrice={totalPrice}
          onClose={() => setShowCart(false)}
          onAdd={addToCart}
          onRemove={removeFromCart}
          onPlaceOrder={placeOrder}
        />
      )}
    </div>
  )
}

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      }
    >
      <OrderContent />
    </Suspense>
  )
}
