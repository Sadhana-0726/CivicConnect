import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getLatLng } from '../services/api';

// Status-based colour mapping for heatmap circles
const STATUS_COLORS = {
  Submitted: '#E74C3C',
  'Under Review': '#F39C12',
  Assigned: '#3498DB',
  'In Progress': '#9B59B6',
  Resolved: '#27AE60',
  Rejected: '#95A5A6',
};

/**
 * Group issues into density cells for heatmap visualisation.
 * Uses simple lat/lng binning (0.005° ≈ 500m grid).
 */
function computeHeatClusters(issues, getCoords) {
  const BIN_SIZE = 0.005;
  const bins = {};

  issues.forEach((issue) => {
    const coords = getCoords(issue);
    if (!coords) return;
    const [lat, lng] = coords;
    const bLat = Math.round(lat / BIN_SIZE) * BIN_SIZE;
    const bLng = Math.round(lng / BIN_SIZE) * BIN_SIZE;
    const key = `${bLat.toFixed(4)},${bLng.toFixed(4)}`;

    if (!bins[key]) {
      bins[key] = { lat: bLat, lng: bLng, count: 0, statuses: {} };
    }
    bins[key].count++;
    const st = issue.status || 'Submitted';
    bins[key].statuses[st] = (bins[key].statuses[st] || 0) + 1;
  });

  return Object.values(bins);
}

/**
 * Determine the dominant status in a cluster for colouring.
 */
function dominantStatus(statuses) {
  let max = 0;
  let dom = 'Submitted';
  for (const [st, cnt] of Object.entries(statuses)) {
    if (cnt > max) {
      max = cnt;
      dom = st;
    }
  }
  return dom;
}

export default function IssueMap({
  issues = [],
  pickMode = false,
  value,
  onPick,
  height = '350px',
  heatmapMode = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerGroupRef = useRef(null);
  const pickedMarkerRef = useRef(null);

  const defaultCenter = [12.9716, 77.5946]; // Default city center

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(
        value ? [value.lat, value.lng] : defaultCenter,
        13
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      markerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      if (pickMode) {
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          if (onPick) onPick({ lat, lng });
        });
      }
    }
  }, [pickMode]);

  // Update pick mode marker
  useEffect(() => {
    if (!pickMode || !mapInstanceRef.current) return;

    if (pickedMarkerRef.current) {
      mapInstanceRef.current.removeLayer(pickedMarkerRef.current);
    }

    if (value && value.lat && value.lng) {
      pickedMarkerRef.current = L.marker([value.lat, value.lng]).addTo(mapInstanceRef.current);
      mapInstanceRef.current.panTo([value.lat, value.lng]);
    }
  }, [value, pickMode]);

  // Render complaint markers OR heatmap clusters
  useEffect(() => {
    if (pickMode || !mapInstanceRef.current || !markerGroupRef.current) return;

    markerGroupRef.current.clearLayers();

    if (!Array.isArray(issues) || issues.length === 0) return;

    if (heatmapMode) {
      // --- Heatmap / density cluster mode ---
      const clusters = computeHeatClusters(issues, getLatLng);

      if (clusters.length === 0) return;

      const maxCount = Math.max(...clusters.map((c) => c.count));

      clusters.forEach((cluster) => {
        const dom = dominantStatus(cluster.statuses);
        const colour = STATUS_COLORS[dom] || '#E74C3C';
        // Scale radius: min 12px, max 50px, proportional to count
        const radius = 12 + (cluster.count / Math.max(maxCount, 1)) * 38;
        const opacity = 0.3 + (cluster.count / Math.max(maxCount, 1)) * 0.45;

        const circle = L.circleMarker([cluster.lat, cluster.lng], {
          radius,
          fillColor: colour,
          fillOpacity: opacity,
          color: colour,
          weight: 2,
          opacity: 0.8,
        });

        // Build status breakdown for popup
        const breakdownHtml = Object.entries(cluster.statuses)
          .map(([st, cnt]) => `<span style="color:${STATUS_COLORS[st] || '#333'};font-weight:600">${st}</span>: ${cnt}`)
          .join('<br/>');

        circle.bindPopup(`
          <div style="min-width:120px">
            <strong>${cluster.count} complaint${cluster.count > 1 ? 's' : ''}</strong><br/>
            <hr style="margin:4px 0;border:none;border-top:1px solid #ddd"/>
            ${breakdownHtml}
          </div>
        `);

        markerGroupRef.current.addLayer(circle);
      });
    } else {
      // --- Standard marker mode ---
      issues.forEach((issue) => {
        const coords = getLatLng(issue);
        if (coords) {
          const marker = L.marker(coords);
          marker.bindPopup(`
            <strong>${issue.title || 'Civic Issue'}</strong><br/>
            <span>${issue.category || 'General'}</span><br/>
            <small>${issue.location?.address || issue.address || ''}</small>
          `);
          markerGroupRef.current.addLayer(marker);
        }
      });
    }
  }, [issues, pickMode, heatmapMode]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: '100%', borderRadius: '8px', border: '1px solid #D1CDC7', overflow: 'hidden' }}
    />
  );
}
