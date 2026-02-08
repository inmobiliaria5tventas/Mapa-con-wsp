
// Google Sheets Integration Script - DEBUG VERSION
console.log("Sheet Integration Script: Cargado correctamente.");

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTe2wDCmyS4tXfEtPae_EO04Ut2HP2lutyKCMJQlBI5O-3HBQZ2BseyoxdEm59mjAtn7IJOwQ2XZzjp/pub?output=csv";

const STATUS_STYLES = {
    'disponible': { color: '#ffffff', fillColor: 'rgba(31,175,5,1)', fillOpacity: 0.5 },
    'vendido': { color: '#ffffff', fillColor: 'rgba(227,39,26,1)', fillOpacity: 0.5 },
    'reservado': { color: '#ffffff', fillColor: 'rgba(255,255,51,1)', fillOpacity: 0.5 }
};

async function updateLotStatusFromSheets() {
    console.log("Sheet Integration: Iniciando proceso...");
    const subtitle = document.querySelector('.map-title-card p');
    if (subtitle) {
        subtitle.innerText = "Intentando conectar con Google Sheets... 🔄";
    }

    try {
        const response = await fetch(SHEET_CSV_URL);
        console.log("Sheet Integration: Respuesta recibida", response.status);

        if (!response.ok) throw new Error("Error en respuesta de red");

        const text = await response.text();
        const rows = text.split(/\r?\n/);
        const lotStatusMap = {};

        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(',');
            if (cols.length < 2) continue;
            const loteName = cols[0].trim().toLowerCase();
            const status = cols[1].trim().toLowerCase();
            if (loteName) lotStatusMap[loteName] = status;
        }

        console.log("Sheet Integration: Actualizando capas...");
        const layers = [window.layer_Reservadas_2, window.layer_Vendidas_3, window.layer_Disponibles_4];

        layers.forEach(layerGroup => {
            if (!layerGroup) return;
            layerGroup.eachLayer(function (layer) {
                if (layer.feature && layer.feature.properties && layer.feature.properties['Lote']) {
                    const loteName = layer.feature.properties['Lote'].toLowerCase();
                    const newStatus = lotStatusMap[loteName];
                    if (newStatus && STATUS_STYLES[newStatus]) {
                        layer.setStyle(STATUS_STYLES[newStatus]);
                        layer.feature.properties['Estado'] = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
                    }
                }
            });
        });

        if (subtitle) {
            subtitle.innerText = "Sincronizado con Google Sheets ✅";
            subtitle.style.color = "#C5A065";
        }

    } catch (error) {
        console.error("Sheet Integration Error:", error);
        if (subtitle) {
            subtitle.innerText = "Error: Falla al leer el Excel ❌";
            subtitle.style.color = "#ff4d4d";
        }
    }
}

// Start after a delay
setTimeout(updateLotStatusFromSheets, 3000);
