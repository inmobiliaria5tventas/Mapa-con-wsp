// Google Sheets Integration Script
// This script fetches lot status from the published Google Sheet CSV

// User provided URL (Converted from pubhtml to csv for machine reading)
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTe2wDCmyS4tXfEtPae_EO04Ut2HP2lutyKCMJQlBI5O-3HBQZ2BseyoxdEm59mjAtn7IJOwQ2XZzjp/pub?output=csv";

// Styles for different statuses
const STATUS_STYLES = {
    'Disponible': { color: '#ffffff', fillColor: 'rgba(31,175,5,1)', fillOpacity: 0.5 }, // Green
    'Vendido': { color: '#ffffff', fillColor: 'rgba(227,39,26,1)', fillOpacity: 0.5 },    // Red
    'Reservado': { color: '#ffffff', fillColor: 'rgba(255,255,51,1)', fillOpacity: 0.5 }  // Yellow
};

async function updateLotStatusFromSheets() {
    console.log("Fetching status from Google Sheets...");

    try {
        const response = await fetch(SHEET_CSV_URL);
        const data = await response.text();

        // Parse CSV
        // Assuming formatting: Lote Name, Status, Price, etc.
        const rows = data.split('\n').slice(1); // Skip header

        const lotStatusMap = {};

        rows.forEach(row => {
            // Handle CSV parsing carefully (simple split for now)
            const cols = row.split(',');
            if (cols.length < 2) return;

            // Adjust these indices based on your REAL Sheet columns
            // Example: Column A (0) = Lot Name ("Lote 1"), Column B (1) = Status
            const loteName = cols[0].trim();
            const status = cols[1].trim();

            if (loteName) {
                lotStatusMap[loteName.toLowerCase()] = status;
            }
        });

        console.log("Lot Status Map:", lotStatusMap);

        // Update Map Layers
        // We need to iterate over all layers in the map and match them by 'Lote' property
        map.eachLayer(function (layer) {
            if (layer.feature && layer.feature.properties && layer.feature.properties['Lote']) {
                const loteName = layer.feature.properties['Lote'].toLowerCase();
                const newStatus = lotStatusMap[loteName];

                if (newStatus && STATUS_STYLES[newStatus]) {
                    layer.setStyle(STATUS_STYLES[newStatus]);

                    // Optional: Update popup content with new status
                    // This is complex because popup content is HTML string. 
                    // For now, visual color update is the priority.
                }
            }
        });

        console.log("Map updated with Google Sheets data.");

    } catch (error) {
        console.error("Error fetching Google Sheet data:", error);
    }
}

// Call function when page loads
document.addEventListener('DOMContentLoaded', function () {
    // Wait a brief moment to ensure map layers are loaded
    setTimeout(updateLotStatusFromSheets, 1000);
});
