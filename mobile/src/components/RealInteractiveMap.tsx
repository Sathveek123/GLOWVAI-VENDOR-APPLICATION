import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { Colors, Radius } from '../theme';

interface MapPickerProps {
  latitude: number;
  longitude: number;
  shopName: string;
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address?: string;
    locality?: string;
    city?: string;
    pinCode?: string;
  }) => void;
}

export default function RealInteractiveMap({
  latitude,
  longitude,
  shopName,
  onLocationSelect,
}: MapPickerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'MAP_PIN_MOVED') {
        const { lat, lng, address, locality, city, pinCode } = event.data;
        onLocationSelect({
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          address,
          locality,
          city,
          pinCode,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLocationSelect]);

  // Update iframe marker when parent coordinates change programmatically (e.g. GPS button)
  useEffect(() => {
    if (Platform.OS === 'web' && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'SET_MAP_CENTER', lat: latitude, lng: longitude, shopName },
        '*'
      );
    }
  }, [latitude, longitude, shopName]);

  const mapHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; background: #e2e8f0; }
    
    .map-overlay-search {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      z-index: 1000;
      display: flex;
      gap: 6px;
    }
    .search-input {
      flex: 1;
      height: 38px;
      border: 1px solid rgba(0,0,0,0.15);
      border-radius: 8px;
      padding: 0 12px;
      font-size: 13px;
      background: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      outline: none;
    }
    .search-btn {
      height: 38px;
      padding: 0 14px;
      background: #111827;
      color: #fff;
      border: 0;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .info-bar {
      position: absolute;
      bottom: 10px;
      left: 10px;
      right: 10px;
      z-index: 1000;
      background: rgba(17, 24, 39, 0.92);
      color: #fff;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      backdrop-filter: blur(4px);
    }
    .hint { color: #facc15; font-weight: 600; }
  </style>
</head>
<body>
  <div class="map-overlay-search">
    <input id="searchInput" class="search-input" type="text" placeholder="🔍 Search area, road, landmark in your city..." />
    <button id="searchBtn" class="search-btn">Search</button>
  </div>
  
  <div id="map"></div>

  <div class="info-bar">
    <span id="locStatus">📍 <span class="hint">Click or Drag pin</span> to exact dark store shop entrance</span>
    <span id="coordsDisplay" style="color:#94a3b8; font-family:monospace; font-size:11px;">${latitude.toFixed(4)}, ${longitude.toFixed(4)}</span>
  </div>

  <script>
    const initialLat = ${latitude};
    const initialLng = ${longitude};
    let shopTitle = "${shopName || 'GlowVAI Dark Store'}";

    const map = L.map('map', {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Custom Dark Store Pin Icon
    const storeIcon = L.divIcon({
      className: 'custom-pin',
      html: '<div style="background:#111827; color:#fff; border:2px solid #fff; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; font-size:16px; box-shadow:0 3px 10px rgba(0,0,0,0.3);">🏬</div>',
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
      icon: storeIcon,
    }).addTo(map);

    function updateCoordsUI(lat, lng) {
      document.getElementById('coordsDisplay').innerText = lat.toFixed(5) + ', ' + lng.toFixed(5);
    }

    async function reverseGeocode(lat, lng) {
      document.getElementById('locStatus').innerHTML = '⏳ <span style="color:#60a5fa">Resolving address...</span>';
      updateCoordsUI(lat, lng);
      
      try {
        const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${lat}&lon=\${lng}&zoom=18&addressdetails=1\`);
        const data = await res.json();
        
        let address = '';
        let locality = '';
        let city = '';
        let pinCode = '';

        if (data && data.address) {
          const a = data.address;
          locality = a.suburb || a.neighbourhood || a.road || a.residential || '';
          city = a.city || a.town || a.county || a.state_district || 'Vijayawada';
          pinCode = a.postcode || '';
          address = data.display_name || '';
        }

        document.getElementById('locStatus').innerHTML = '✅ <span style="color:#4ade80">' + (locality || 'Location Selected') + '</span>';

        window.parent.postMessage({
          type: 'MAP_PIN_MOVED',
          lat: lat.toFixed(6),
          lng: lng.toFixed(6),
          address,
          locality,
          city,
          pinCode,
        }, '*');
      } catch (err) {
        document.getElementById('locStatus').innerHTML = '📍 <span class="hint">Location Pinned</span>';
        window.parent.postMessage({
          type: 'MAP_PIN_MOVED',
          lat: lat.toFixed(6),
          lng: lng.toFixed(6),
        }, '*');
      }
    }

    // Drag marker event
    marker.on('dragend', function (e) {
      const pos = marker.getLatLng();
      reverseGeocode(pos.lat, pos.lng);
    });

    // Click map event
    map.on('click', function (e) {
      marker.setLatLng(e.latlng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    // Search address handler
    async function handleSearch() {
      const q = document.getElementById('searchInput').value.trim();
      if (!q) return;
      document.getElementById('locStatus').innerHTML = '🔍 <span style="color:#60a5fa">Searching '\ + q + '\...</span>';
      try {
        const res = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(q)}&limit=1\`);
        const list = await res.json();
        if (list && list.length > 0) {
          const item = list[0];
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          map.setView([lat, lng], 16);
          marker.setLatLng([lat, lng]);
          reverseGeocode(lat, lng);
        } else {
          document.getElementById('locStatus').innerHTML = '❌ <span style="color:#f87171">Location not found. Try landmark name.</span>';
        }
      } catch (e) {
        document.getElementById('locStatus').innerHTML = '❌ <span style="color:#f87171">Search error</span>';
      }
    }

    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') handleSearch();
    });

    // Listen to parent postMessage (e.g. GPS update from app)
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'SET_MAP_CENTER') {
        const lat = parseFloat(e.data.lat);
        const lng = parseFloat(e.data.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          map.setView([lat, lng], 16);
          marker.setLatLng([lat, lng]);
          updateCoordsUI(lat, lng);
          reverseGeocode(lat, lng);
        }
      }
    });
  </script>
</body>
</html>`;

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        // @ts-ignore
        <iframe
          ref={iframeRef}
          srcDoc={mapHtml}
          style={{
            width: '100%',
            height: 320,
            border: 'none',
            borderRadius: 12,
          }}
          title="Interactive Store Map"
        />
      ) : (
        <View style={styles.mobileFallback}>
          <Text style={styles.fallbackText}>📍 Interactive Map: {latitude}, {longitude}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 320,
    borderRadius: Radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: '#e2e8f0',
  },
  mobileFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fallbackText: {
    fontSize: 13,
    color: Colors.ink,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontWeight: '600',
  },
});
