'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types'

const PRODUCT_CATEGORIES = [
  { id: '채비류',   label: '채비류' },
  { id: '미끼류',   label: '미끼류' },
  { id: '장비류',   label: '장비류' },
  { id: '의류잡화', label: '의류잡화' },
  { id: '기타',     label: '기타' },
]

interface ProductForm {
  name: string
  description: string
  price: string
  stock: string
  is_active: boolean
  sort_order: string
  category: string
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  price: '',
  stock: '999',
  is_active: true,
  sort_order: '0',
  category: '장비류',
}

export default function ProductsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('sort_order')
    setProducts(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  function openAdd() {
    setEditProduct(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(product: Product) {
    setEditProduct(product)
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      stock: String(product.stock),
      is_active: product.is_active,
      sort_order: String(product.sort_order),
      category: product.category ?? '장비류',
    })
    setShowModal(true)
  }

  async function saveProduct() {
    if (!form.name.trim()) {
      alert('상품명을 입력해 주세요')
      return
    }
    if (!form.price || isNaN(Number(form.price))) {
      alert('올바른 가격을 입력해 주세요')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        stock: Number(form.stock) || 999,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
        category: form.category,
        updated_at: new Date().toISOString(),
      }

      if (editProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editProduct.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
      }

      setShowModal(false)
      loadProducts()
    } catch (err) {
      console.error(err)
      alert('저장 중 오류가 발생했습니다')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(product: Product) {
    await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)
    loadProducts()
  }

  async function deleteProduct(product: Product) {
    if (!confirm(`"${product.name}" 상품을 삭제하시겠습니까?`)) return
    await supabase.from('products').delete().eq('id', product.id)
    loadProducts()
  }

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">낚시용품 관리</h1>
        <button
          className="bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all text-sm"
          onClick={openAdd}
        >
          + 상품 추가
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">불러오는 중...</div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className={`card flex items-center gap-3 ${
                !product.is_active ? 'opacity-50' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800 truncate">{product.name}</p>
                  {!product.is_active && (
                    <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded shrink-0">
                      비활성
                    </span>
                  )}
                </div>
                {product.description && (
                  <p className="text-xs text-gray-400 truncate">{product.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm font-bold text-blue-600">
                    {product.price.toLocaleString()}원
                  </span>
                  <span className="text-xs text-gray-500">재고: {product.stock}개</span>
                  {product.category && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
                      {PRODUCT_CATEGORIES.find((c) => c.id === product.category)?.label ?? product.category}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  onClick={() => openEdit(product)}
                >
                  수정
                </button>
                <button
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    product.is_active
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                  onClick={() => toggleActive(product)}
                >
                  {product.is_active ? '비활성' : '활성화'}
                </button>
                <button
                  className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-200 transition-colors"
                  onClick={() => deleteProduct(product)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900">
                {editProduct ? '상품 수정' : '상품 추가'}
              </h2>
              <button
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  상품명 *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="예: 바다 낚시대 (3.6m)"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  카테고리 *
                </label>
                <select
                  className="form-input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  설명
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="상품 설명 (선택)"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    가격 (원) *
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="45000"
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    재고
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="999"
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  정렬 순서 (낮을수록 앞에 표시)
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                  placeholder="0"
                  inputMode="numeric"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700">활성화</label>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.is_active ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 btn-secondary py-3"
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
              <button
                className="flex-1 btn-primary py-3"
                onClick={saveProduct}
                disabled={saving}
              >
                {saving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
