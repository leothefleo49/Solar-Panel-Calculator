import { create } from 'zustand'
import { defaultSimulationInputs, defaultSolarConfig } from '../constants/defaults'
import type { SimulationInputs, SolarConfig } from '../types/solar'

export type SolarStoreState = {
  config: SolarConfig
  simulation: SimulationInputs
  setConfigValue: <K extends keyof SolarConfig>(key: K, value: SolarConfig[K]) => void
  setSimulationValue: <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => void
  bulkUpdate: (partial: Partial<SolarConfig>) => void
}

export const useSolarStore = create<SolarStoreState>((set) => ({
  config: defaultSolarConfig,
  simulation: defaultSimulationInputs,
  setConfigValue: (key, value) =>
    set((state) => ({
      config: {
        ...state.config,
        [key]: value,
      },
    })),
  setSimulationValue: (key, value) =>
    set((state) => ({
      simulation: {
        ...state.simulation,
        [key]: value,
      },
    })),
  bulkUpdate: (partial) =>
    set((state) => ({
      config: {
        ...state.config,
        ...partial,
      },
    })),
}))
