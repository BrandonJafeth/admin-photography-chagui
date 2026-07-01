import { sileo } from 'sileo'

interface ToastOpts {
  description?: string
}

export const toast = {
  success: (message: string, opts?: ToastOpts) =>
    sileo.success({ title: message, description: opts?.description }),
  error: (message: string, opts?: ToastOpts) =>
    sileo.error({ title: message, description: opts?.description }),
  loading: (message: string, opts?: ToastOpts) =>
    sileo.show({ type: 'loading', title: message, description: opts?.description, duration: null }),
  dismiss: (id?: string) => (id ? sileo.dismiss(id) : sileo.clear()),
}
