export interface Phone {
  id: string
  brand: string
  model: string
  storage: string
  color: string
  condition: string
  price: number
  imageUrl: string | null
  description: string | null
  available: boolean
}

export interface RepairService {
  id: string
  brand: string
  model: string
  repairType: string
  basePartCost: number
  laborCost: number
  currency: string
  description: string | null
}

export interface Order {
  id: string
  name: string
  phone: string
  phoneModel: string
  issue: string
  imageUrl: string | null
  status: string
  createdAt: string
}

export interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string | null
  imageUrl: string | null
  author: string
  createdAt: string
}

export interface RepairCase {
  id: string
  title: string
  description: string
  beforeImage: string | null
  afterImage: string | null
  createdAt: string
}

// New types for the price calculator
export type PartQuality = 'copy' | 'original' | 'original_with_frame'

export interface PartVariant {
  quality: PartQuality
  label: string
  partCost: number
  laborCost: number
}

export interface PartCategory {
  id: string
  name: string
  icon: string
  description: string
  hasFrameVariant: boolean
}

export interface PhonePartEntry {
  modelCode: string
  modelName: string
  parts: Record<string, PartVariant[]>
}

export interface BrandParts {
  id: string
  name: string
  logo: string
  models: PhonePartEntry[]
}

export const PART_CATEGORIES: PartCategory[] = [
  { id: 'display', name: 'Дисплей', icon: '📱', description: 'Екран/дисплей в зборі', hasFrameVariant: true },
  { id: 'battery', name: 'Акумулятор', icon: '🔋', description: 'Батарея/АКБ', hasFrameVariant: false },
  { id: 'back_cover', name: 'Задня кришка', icon: '🔧', description: 'Задня кришка + рамки', hasFrameVariant: false },
  { id: 'speaker', name: 'Динамік/Дзвінок', icon: '🔊', description: 'Динаміки та дзвінки', hasFrameVariant: false },
  { id: 'glass', name: 'Скло екрану', icon: '🪟', description: 'Скло екрану + скло камери', hasFrameVariant: false },
  { id: 'charging_flex', name: 'Шлейф зарядки', icon: '🔌', description: 'Шлейфи + конектори', hasFrameVariant: false },
  { id: 'camera', name: 'Камера', icon: '📷', description: 'Основна/фронтальна камера', hasFrameVariant: false },
  { id: 'microphone', name: 'Мікрофон', icon: '🎤', description: 'Мікрофон', hasFrameVariant: false },
  { id: 'buttons', name: 'Кнопки', icon: '🔘', description: 'Кнопки живлення/гучності', hasFrameVariant: false },
  { id: 'connector', name: 'Конектори/SIM', icon: '🔲', description: 'Конектори, утримувачі SIM', hasFrameVariant: false },
]
