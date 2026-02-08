// Google Sheets Integration Script
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTCza2KlrCWyPeJP30tPbbafB75AQFDJEUauaCwVlFhrCtYZ1WoxCz2sEvvl5IgGZlO_kqD1ePE1n_f/pub?output=csv";

const STATUS_STYLES = {
    'disponible': { color: '#ffffff', fillColor: 'rgba(31,175,5,1)', fillOpacity: 0.5 },
    'vendido': { color: '#ffffff', fillColor: 'rgba(227,39,26,1)', fillOpacity: 0.5 },
    'reservado': { color: '#ffffff', fillColor: 'rgba(255,255,51,1)', fillOpacity: 0.5 }
};

// Helper to parse CSV rows correctly (handles commas inside quotes)
function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"' && row[i + 1] === '"') {
            current += '"';
            i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

async function updateLotStatusFromSheets() {
    const subtitle = document.querySelector('.map-title-card p');
    if (subtitle) {
        subtitle.innerText = "Sincronizando datos... ⏳";
    }

    console.log("Sheet Integration: Iniciando descarga...");

    try {
        // Cache busting and explicit CORS mode
        const urlWithCacheBuster = SHEET_CSV_URL + (SHEET_CSV_URL.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
        const response = await fetch(urlWithCacheBuster, { mode: 'cors' });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }

        const rawText = await response.text();
        console.log("Sheet Integration: CSV descargado. Longitud:", rawText.length);

        // Remove Byte Order Mark (BOM) and Normalize Line Endings
        const text = rawText.replace(/^\uFEFF/, '').trim();
        const rows = text.split(/\r?\n/);

        if (rows.length < 1) throw new Error("El CSV está vacío.");

        // Clean headers: trim and lowercase
        const headers = parseCSVRow(rows[0]).map(h => h.trim().toLowerCase());
        console.log("Sheet Integration: Headers detectados:", headers);

        const lotDataMap = {};

        for (let i = 1; i < rows.length; i++) {
            const rowStr = rows[i].trim();
            if (!rowStr) continue;

            const cols = parseCSVRow(rowStr);
            const rowData = {};
            headers.forEach((header, index) => {
                if (header) rowData[header] = (cols[index] || "").trim();
            });

            // Try different possible header names for Lote
            let loteRef = rowData['lote'] || rowData['id'] || rowData['lotes'] || cols[0];
            let statusRaw = (rowData['estado'] || rowData['status'] || "").toLowerCase();

            if (loteRef) {
                // Ensure loteRef is a string for the following operations
                loteRef = String(loteRef);

                // Normalización: Si solo viene el número (ej: "1"), transformarlo en "Lote 1"
                if (!loteRef.toLowerCase().includes("lote") && !isNaN(loteRef) && loteRef !== "") {
                    loteRef = "Lote " + loteRef;
                }

                // Mapeo inteligente de estados (soporta Vendido, Vendida, Reservado, etc.)
                let status = 'disponible';
                if (statusRaw.includes('vend')) status = 'vendido';
                else if (statusRaw.includes('reser')) status = 'reservado';
                else if (statusRaw.includes('disp')) status = 'disponible';
                else if (statusRaw === '') status = 'disponible';

                lotDataMap[loteRef.toLowerCase()] = {
                    status: status,
                    precio: rowData['precio'] || rowData['valor'] || "",
                    superficie: rowData['superficie'] || rowData['area'] || ""
                };
            }
        }

        console.log("Sheet Integration: Mapa de datos generado para", Object.keys(lotDataMap).length, "lotes.");

        function updateLayerGroup(layerGroup) {
            if (!layerGroup) return;

            let count = 0;
            layerGroup.eachLayer(function (layer) {
                if (layer.feature && layer.feature.properties) {
                    // Try to find Lote property (check case sensitivity)
                    const props = layer.feature.properties;
                    const originalLoteName = props['Lote'] || props['lote'] || props['LOTE'];

                    if (originalLoteName) {
                        const loteNameKey = String(originalLoteName).toLowerCase();
                        const sheetInfo = lotDataMap[loteNameKey];

                        if (sheetInfo) {
                            const newStatus = sheetInfo.status;
                            const style = STATUS_STYLES[newStatus];

                            if (style) {
                                layer.setStyle(style);
                                // Update property for popups
                                layer.feature.properties['Estado'] = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);

                                // Update extra info
                                if (sheetInfo.precio) layer.feature.properties['Precio'] = sheetInfo.precio;
                                if (sheetInfo.superficie) layer.feature.properties['Superficie'] = sheetInfo.superficie;

                                // Refresh Popup
                                var content = "<div class='popup-content'>";
                                content += "<h3 style='margin:0; text-align:center; color:#C5A065; font-family:\"Playfair Display\", serif; border-bottom:1px solid #C5A065; padding-bottom:10px; margin-bottom:10px;'>" + originalLoteName + "</h3>";
                                content += "<table style='width:100%; margin-bottom:15px;'>";
                                for (var key in layer.feature.properties) {
                                    if (key !== 'Lote' && key !== 'fid' && layer.feature.properties[key]) {
                                        content += "<tr><th style='text-align:left; color:#C5A065;'>" + key + ":</th><td style='text-align:right;'>" + layer.feature.properties[key] + "</td></tr>";
                                    }
                                }
                                content += "</table>";
                                const phoneNumber = "56974300363";
                                const waUrl = "https://wa.me/" + phoneNumber + "?text=" + encodeURIComponent("Hola, me interesa más información sobre el " + originalLoteName);
                                content += "<a href='" + waUrl + "' target='_blank' class='popup-wa-btn'>Consultar por WhatsApp</a>";
                                content += "</div>";
                                layer.bindPopup(content);
                                count++;
                            }
                        }
                    }
                }
            });
            return count;
        }

        const upd1 = updateLayerGroup(window.layer_Reservadas_2);
        const upd2 = updateLayerGroup(window.layer_Vendidas_3);
        const upd3 = updateLayerGroup(window.layer_Disponibles_4);

        if (subtitle) {
            subtitle.innerText = "Sincronizado con Google Sheets ✅";
            subtitle.style.color = "#C5A065";
        }

        console.log(`Sheet Integration: Sincronización completa. Lotes actualizados: ${upd1 + upd2 + upd3}`);

    } catch (error) {
        console.error("Sheet Integration Error:", error);
        if (subtitle) {
            subtitle.innerText = "Error de sincronización ❌ (Ver consola)";
            subtitle.style.color = "#ff4d4d";
            subtitle.title = error.message; // Show error on hover
        }
    }
}

// Start sync after map loads
setTimeout(updateLotStatusFromSheets, 3000);
