export default defineWebSocketHandler(async (event) => {
    const { API_BASE } = useRuntimeConfig()
    return $fetch(`${API_BASE}/master/users`, { method: 'GET' })
})