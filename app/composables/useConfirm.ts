export type ConfirmOptions = {
  title?: string
  subtitle?: string
  variant?: 'neutral' | 'success' | 'info' | 'warning' | 'danger'
  confirmLabel?: string
  cancelLabel?: string
  color?: string
  icon?: string
  hideCancel?: boolean
}

type State = {
  open: boolean
  pending: boolean
  options: ConfirmOptions
  resolve?: (v: boolean) => void
}

export function useConfirm() {
  const state = useState<State>('ui:confirm', () => ({
    open: false,
    pending: false,
    options: { title: 'Konfirmasi', confirmLabel: 'Lanjut', cancelLabel: 'Batal', variant: 'neutral' }
  }))

  function open(options: ConfirmOptions = {}) {
    state.value.options = { ...state.value.options, ...options }
    state.value.open = true
    return new Promise<boolean>((resolve) => { state.value.resolve = resolve })
  }

  async function confirm(cb?: () => Promise<void> | void) {
    state.value.pending = true
    try {
      if (cb) await cb()
      state.value.open = false
      state.value.resolve?.(true)
    } finally {
      state.value.pending = false
      state.value.resolve = undefined
    }
  }

  function cancel() {
    state.value.open = false
    state.value.resolve?.(false)
    state.value.resolve = undefined
  }

  return { state, open, confirm, cancel }
}
