'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

export interface WarehouseSelectionOption {
  id: string
  branch_id?: string | null
}

interface UseDefaultWarehouseSelectionOptions<TWarehouse extends WarehouseSelectionOption> {
  warehouses: TWarehouse[]
  warehouseId: string | null | undefined
  onWarehouseChange: (warehouse: TWarehouse) => void
  enabled?: boolean
}

export function resolveDefaultWarehouse<TWarehouse extends WarehouseSelectionOption>(
  warehouses: TWarehouse[],
  defaultWarehouseId?: string | null,
): TWarehouse | null {
  if (defaultWarehouseId) {
    const configuredDefault = warehouses.find((warehouse) => warehouse.id === defaultWarehouseId)
    if (configuredDefault) return configuredDefault
  }

  return warehouses.length === 1 ? warehouses[0] : null
}

export function useDefaultWarehouseSelection<TWarehouse extends WarehouseSelectionOption>({
  warehouses,
  warehouseId,
  onWarehouseChange,
  enabled = true,
}: UseDefaultWarehouseSelectionOptions<TWarehouse>) {
  const defaultWarehouseId = useAuthStore((state) => state.user?.default_warehouse_id)

  useEffect(() => {
    if (!enabled || warehouseId || warehouses.length === 0) return

    const defaultWarehouse = resolveDefaultWarehouse(warehouses, defaultWarehouseId)
    if (defaultWarehouse) onWarehouseChange(defaultWarehouse)
  }, [defaultWarehouseId, enabled, onWarehouseChange, warehouseId, warehouses])
}
