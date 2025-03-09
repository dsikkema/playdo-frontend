// In your app config file
export const config = {
  // Check if the config value is still the placeholder
  // If it is, use the environment variable instead
  backendUrl:
    window.PLAYDO_CONFIG?.backendUrl === '__BACKEND_URL_PLACEHOLDER__'
      ? import.meta.env.VITE_PLAYDO_BACKEND_URL
      : window.PLAYDO_CONFIG?.backendUrl ||
        import.meta.env.VITE_PLAYDO_BACKEND_URL ||
        ''
}

if (!config.backendUrl) {
  throw new Error('Backend URL is not configured')
}
