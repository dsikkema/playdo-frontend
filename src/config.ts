export const config = {
  backendUrl: import.meta.env['VITE_PLAYDO_BACKEND_URL'] || ''
}

if (!config.backendUrl) {
  throw new Error('VITE_PLAYDO_BACKEND_URL is not set')
}
