// Google Sheets Integration Script
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTCza2KlrCWyPeJP30tPbbafB75AQFDJEUauaCwVlFhrCtYZ1WoxCz2sEvvl5IgGZlO_kqD1ePE1n_f/pub?output=csv";

const STATUS_STYLES = {
    'disponible': { color: '#ffffff', fillColor: 'rgba(31,175,5,1)', fillOpacity: 0.5 },
    'vendido': { color: '#ffffff', fillColor: 'rgba(227,39,26,1)', fillOpacity: 0.5 },
    'reservado': { color: '#ffffff', fillColor: 'rgba(255,255,51,1)', fillOpacity: 0.5 }
};

async function updateLotStatusFromSheets() {
    const subtitle = document.querySelector('.map-title-card p');
    if (subtitle) {
        subtitle.innerText = "Sincronizando datos... ⏳";
    }

    console.log("Sheet Integration: Descargando CSV...");

    try {
        const response = await fetch(SHEET_CSV_URL);

        if (!response.ok) {
            throw new Error(`Error de respuesta: ${response.status}`);
        }

        const text = await response.text();
        const rows = text.split(/\r?\n/);

        const lotStatusMap = {};

        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(',');
            if (cols.length < 2) continue;

            let loteRef = cols[0].trim();
            let status = cols[1].trim().toLowerCase();

            if (loteRef) {
                // Handle cases where Excel has "1" and Map has "Lote 1"
                if (!loteRef.toLowerCase().includes("lote")) {
                    loteRef = "Lote " + loteRef;
                }

                // Only map if status is not empty
                if (status && STATUS_STYLES[status]) {
                    lotStatusMap[loteRef.toLowerCase()] = status;
                }
            }
        }

        console.log("Sheet Integration: Map generated", lotStatusMap);

        function updateLayerGroup(layerGroup) {
            if (!layerGroup) return;

            layerGroup.eachLayer(function (layer) {
                if (layer.feature && layer.feature.properties && layer.feature.properties['Lote']) {
                    const loteName = layer.feature.properties['Lote'].toLowerCase();
                    const newStatus = lotStatusMap[loteName];

                    if (newStatus && STATUS_STYLES[newStatus]) {
                        layer.setStyle(STATUS_STYLES[newStatus]);
                        layer.feature.properties['Estado'] = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

                        var content = "<div class='popup-content'>";
                        content += "<h3 style='margin:0; text-align:center; color:#C5A065; font-family:\"Playfair Display\", serif; border-bottom:1px solid #C5A065; padding-bottom:10px; margin-bottom:10px;'>" + layer.feature.properties['Lote'] + "</h3>";

                        content += "<table style='width:100%; margin-bottom:15px;'>";
                        for (var key in layer.feature.properties) {
                            if (key !== 'Lote' && key !== 'fid') {
                                content += "<tr><th style='text-align:left; color:#C5A065;'>" + key + ":</th><td style='text-align:right;'>" + layer.feature.properties[key] + "</td></tr>";
                            }
                        }
                        content += "</table>";

                        const phoneNumber = "56974300363";
                        const waUrl = "https://wa.me/" + phoneNumber + "?text=" + encodeURIComponent("Hola, me interesa más información sobre el " + layer.feature.properties['Lote']);
                        content += "<a href='" + waUrl + "' target='_blank' class='popup-wa-btn'>Consultar por WhatsApp</a>";
                        content += "</div>";

                        layer.bindPopup(content);
                    }
                }
            });
        }

        updateLayerGroup(window.layer_Reservadas_2);
        updateLayerGroup(window.layer_Vendidas_3);
        updateLayerGroup(window.layer_Disponibles_4);

        if (subtitle) {
            subtitle.innerText = "Sincronizado con Google Sheets ✅";
            subtitle.style.color = "#C5A065";
        }

        console.log("Sheet Integration: Sincronización completa.");

    } catch (error) {
        console.error("Sheet Integration Error:", error);
        if (subtitle) {
            subtitle.innerText = "Error de sincronización ❌";
            subtitle.style.color = "#ff4d4d";
        }
    }
}

// Start sync after map loads
setTimeout(updateLotStatusFromSheets, 3000);
