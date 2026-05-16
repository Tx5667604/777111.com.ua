'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ShoppingCart, ChevronDown, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import OrderFormDialog from './OrderFormDialog'
import { brandPartsData } from '@/app/phone-parts-data'
import { PART_CATEGORIES } from '@/app/types'
import type { PartVariant, BrandParts, PartCategory } from '@/app/types'
import { useCart } from '@/lib/cart-context'

const brands: { id: string; name: string; logo: string }[] = brandPartsData.map((b) => ({
  id: b.name,
  name: b.name,
  logo: b.logo,
}))

// Map part categories to images (real for Apple, placeholders for others)
function getPartImage(brandId: string, partId: string): string {
  const isApple = brandId === 'Apple'
  return isApple
    ? `/part-images/iphone/${partId}.jpg`
    : `/part-images/generic/${partId}.jpg`
}

export default function PriceCalculator() {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<PartVariant | null>(null)
  const [step, setStep] = useState(1)
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [modelSearch, setModelSearch] = useState("")
  const [brandSearch, setBrandSearch] = useState("")
  const [showAllBrands, setShowAllBrands] = useState(false)
  const { addItem } = useCart()

  const brandData: BrandParts | undefined = useMemo(
    () => brandPartsData.find((b) => b.name === selectedBrand),
    [selectedBrand]
  )

  const models = brandData?.models ?? []

  // Get categories that have parts available for the selected model
  const availableCategories: PartCategory[] = useMemo(() => {
    if (!selectedModel || !brandData) return []
    const model = brandData.models.find((m) => m.modelCode === selectedModel)
    if (!model) return []
    return PART_CATEGORIES.filter((cat) => model.parts[cat.id] && model.parts[cat.id].length > 0)
  }, [selectedModel, brandData])

  const selectedModelData = useMemo(() => {
    if (!selectedModel || !brandData) return null
    return brandData.models.find((m) => m.modelCode === selectedModel) ?? null
  }, [selectedModel, brandData])

  const variants: PartVariant[] = useMemo(() => {
    if (!selectedCategory || !selectedModelData) return []
    return selectedModelData.parts[selectedCategory] ?? []
  }, [selectedCategory, selectedModelData])

  const totalPrice = selectedVariant
    ? selectedVariant.partCost + selectedVariant.laborCost
    : null

  const handleBrandSelect = (brandId: string) => {
    setSelectedBrand(brandId)
    setSelectedModel(null)
    setSelectedCategory(null)
    setSelectedVariant(null)
    setStep(2)
  }

  const handleModelSelect = (code: string) => {
    setSelectedModel(code)
    setSelectedCategory(null)
    setSelectedVariant(null)
    setStep(3)
  }

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId)
    setSelectedVariant(null)
    setStep(4)
  }

  const handleVariantSelect = (v: PartVariant) => {
    setSelectedVariant(v)
  }

  const handleReset = () => {
    setSelectedBrand(null)
    setSelectedModel(null)
    setSelectedCategory(null)
    setSelectedVariant(null)
    setStep(1)
  }

  const steps = [
    { num: 1, label: 'Бренд' },
    { num: 2, label: 'Модель' },
    { num: 3, label: 'Запчастина' },
    { num: 4, label: 'Варіант' },
  ]

  const modelFullName = selectedModelData
    ? `${selectedBrand} ${selectedModelData.modelName}`
    : ''

  return (
    <section id="calculator" className="py-20 sm:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Вартість ремонту
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3">
            Підбір запчастин та ціна
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
            Оберіть бренд, модель телефону, потрібну запчастину та якість — дізнайтеся вартість ремонту
          </p>
        </motion.div>

        {/* Steps indicator - 4 steps now */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 ${
                  step >= s.num
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className={`hidden sm:block text-xs font-medium ${
                step >= s.num ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={`w-8 sm:w-16 h-0.5 transition-all duration-300 ${
                    step > s.num ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Brand Selection */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-center mb-6">
                  1. Оберіть бренд пристрою
                </h3>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Пошук бренду..."
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {brands
                    .filter(b => !brandSearch || b.name.toLowerCase().includes(brandSearch.toLowerCase()))
                    .slice(0, showAllBrands ? brands.length : 4).map((brand) => (
                    <motion.button
                      key={brand.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleBrandSelect(brand.id)}
                      className={`p-6 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-3 ${
                        selectedBrand === brand.id
                          ? 'border-primary bg-primary/5 shadow-lg'
                          : 'border-border hover:border-primary/50 bg-card'
                      }`}
                    >
                      {brand.logo.startsWith('/') ? (
                        <img src={brand.logo} alt="" className="w-full max-w-[100px] h-8 object-contain" />
                      ) : (
                        <span className="text-3xl">{brand.logo}</span>
                      )}
                      <span className="font-medium text-foreground">{brand.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {brandPartsData.find(b => b.name === brand.id)?.models.length ?? 0} моделей
                      </span>
                    </motion.button>
                  ))}
                </div>
                {!showAllBrands && brands.length > 4 && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => setShowAllBrands(true)}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Розгорнути ({brands.length - 4} брендів)
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Model Selection */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Назад
                  </Button>
                  <h3 className="text-lg font-semibold">
                    2. Оберіть модель {selectedBrand}
                  </h3>
                  <div className="w-20" />
                </div>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Пошук моделі..."
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-[400px] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 pr-2">
                  {models.filter(m => 
                    !modelSearch || 
                    m.modelName.toLowerCase().includes(modelSearch.toLowerCase()) ||
                    m.modelCode.toLowerCase().includes(modelSearch.toLowerCase())
                  ).map((m) => (
                    <motion.button
                      key={m.modelCode}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleModelSelect(m.modelCode)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedModel === m.modelCode
                          ? 'border-primary bg-primary/5 shadow-lg'
                          : 'border-border hover:border-primary/50 bg-card'
                      }`}
                    >
                      <span className="font-medium text-foreground text-sm block leading-tight">
                        {m.modelName}
                      </span>
                      <span className="text-xs text-muted-foreground/70">
                        {Object.keys(m.parts).length} типів запчастин
                      </span>
                    </motion.button>
                  ))}
                  {models.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      Немає доступних моделей для цього бренду
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Part Category Selection */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(2)}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Назад
                  </Button>
                  <h3 className="text-lg font-semibold text-center">
                    3. Оберіть запчастину
                  </h3>
                  <div className="w-20" />
                </div>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Для {modelFullName}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableCategories.map((cat) => (
                    <motion.button
                      key={cat.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedCategory === cat.id
                          ? 'border-primary bg-primary/5 shadow-lg'
                          : 'border-border hover:border-primary/50 bg-card'
                      }`}
                    >
                      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-black/20 mb-2">
                        <img
                          src={getPartImage(selectedBrand || '', cat.id)}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{cat.icon}</span>
                        <span className="font-medium text-foreground text-sm">{cat.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{cat.description}</span>
                    </motion.button>
                  ))}
                  {availableCategories.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      Немає запчастин для цієї моделі
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 4: Variant Selection + Price */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(3)}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Назад
                  </Button>
                  <h3 className="text-lg font-semibold text-center">
                    4. Виберіть якість
                  </h3>
                  <div className="w-20" />
                </div>

                <div className="space-y-4 mb-8">
                  {variants.map((v) => {
                    const isSelected = selectedVariant?.quality === v.quality
                    return (
                      <motion.button
                        key={v.quality}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleVariantSelect(isSelected ? null! : v)}
                        className={`w-full p-5 rounded-xl border-2 transition-all duration-200 text-left ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50 bg-card'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground text-base">
                              {v.label}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span>Деталь: <span className="text-muted-foreground">спросить у адміна</span></span>
                              <span>•</span>
                              <span>Робота: <span className="text-muted-foreground">спросить у адміна</span></span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary">
                              {(v.partCost + v.laborCost).toLocaleString('uk-UA')} ₴
                            </p>
                            <p className="text-xs text-muted-foreground">всього</p>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>

                {/* Selected result */}
                {selectedVariant && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="border-primary/20 bg-gradient-to-br from-orange-50 to-amber-50">
                      <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <Check className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {modelFullName} — {PART_CATEGORIES.find(c => c.id === selectedCategory)?.name}
                        </p>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          {selectedVariant.label}
                        </p>
                        <p className="text-lg font-semibold text-primary mb-2">
                          <span className="text-muted-foreground font-normal">Ціну уточнюйте</span>
                        </p>
                        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-6">
                          <span>Деталь + робота: <span className="text-muted-foreground">спросить у адміна</span></span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                          <Button
                            onClick={() => {
                              if (selectedBrand && selectedModelData && selectedCategory && selectedVariant) {
                                addItem({
                                  brand: selectedBrand,
                                  modelCode: selectedModelData.modelCode,
                                  modelName: selectedModelData.modelName,
                                  partCategory: selectedCategory,
                                  partName: PART_CATEGORIES.find(c => c.id === selectedCategory)?.name || selectedCategory,
                                  quality: selectedVariant.quality,
                                  label: selectedVariant.label,
                                  partCost: selectedVariant.partCost,
                                  laborCost: selectedVariant.laborCost,
                                  total: totalPrice!,
                                })
                                handleReset()
                                toast.success('Додано в кошик!', { duration: 2000 })
                              }
                            }}
                            size="lg"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 flex-1"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Додати в кошик
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reset button */}
          {step > 1 && (
            <div className="text-center mt-6">
              <Button variant="ghost" onClick={handleReset} className="text-muted-foreground">
                Почати спочатку
              </Button>
            </div>
          )}
        </div>
      </div>

      <OrderFormDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        phoneModel={modelFullName}
        repairType={
          selectedCategory && selectedVariant
            ? `${PART_CATEGORIES.find(c => c.id === selectedCategory)?.name} — ${selectedVariant.label}`
            : ''
        }
        estimatedPrice={totalPrice ?? undefined}
      />
    </section>
  )
}
