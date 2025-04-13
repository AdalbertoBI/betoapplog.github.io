// Configurações
const CONFIG = {
    GEOLOCATION_TIMEOUT: 10000,
    OSRM_ENDPOINT: "https://router.project-osrm.org",
    FALLBACK_LOCATION: { lat: -23.5505, lng: -46.6333 }
};

// Elementos DOM
const map = L.map('map').setView([CONFIG.FALLBACK_LOCATION.lat, CONFIG.FALLBACK_LOCATION.lng], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Funções de Geolocalização (com fallback melhorado)
async function getCurrentLocation() {
    if (!navigator.geolocation) {
        console.warn("Geolocalização não suportada.");
        return CONFIG.FALLBACK_LOCATION;
    }

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: CONFIG.GEOLOCATION_TIMEOUT
            });
        });
        return { lat: position.coords.latitude, lng: position.coords.longitude };
    } catch (error) {
        console.error("Erro na geolocalização:", error);
        return CONFIG.FALLBACK_LOCATION;
    }
}

// Função para desenhar rotas (com tratamento de erros)
async function drawRoute(points) {
    try {
        const coordinates = points.map(p => `${p.lng},${p.lat}`).join(';');
        const response = await fetch(`${CONFIG.OSRM_ENDPOINT}/route/v1/driving/${coordinates}`);
        
        if (!response.ok) throw new Error("Falha na API OSRM");
        
        const data = await response.json();
        if (data.code === "Ok") {
            L.geoJSON(data.routes[0].geometry, {
                style: { color: "#3388ff", weight: 5 }
            }).addTo(map);
        }
    } catch (error) {
        console.error("Erro ao traçar rota:", error);
        alert("Não foi possível traçar a rota. Verifique sua conexão.");
    }
}

// Event Listeners
document.getElementById('order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const address = document.getElementById('address').value.trim();
    if (address) await addOrder(address);
});