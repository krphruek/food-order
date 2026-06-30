export type Room = {
  id: string
  room_number: string
  name: string
  status: string
}

export type Category = {
  id: string
  name: string
  sort_order: number
}

export type MenuItem = {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
}

export type CartItem = MenuItem & {
  qty: number
  note: string
}

export type Order = {
  id: string
  room_id: string
  status: string
  payment_method: string
  total: number
}
