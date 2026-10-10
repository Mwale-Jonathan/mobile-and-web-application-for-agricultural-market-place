import React, { useCallback, useMemo } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { DEFAULT_LOCATION } from '@/constants';
import { AppIcon } from '@/components/app-icon';

export interface LocationResult {
  latitude: number;
  longitude: number;
  locationName: string;
  province: string;
}

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (result: LocationResult) => void;
  initialLatitude?: number;
  initialLongitude?: number;
}

function buildPickerHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { height: 100%; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #eef5f0; color: #111827; }
    #root { display: flex; flex-direction: column; height: 100%; position: relative; }
    #search-bar { display: flex; gap: 8px; padding: 12px; background: #fff; border-bottom: 1px solid #E5E7EB; z-index: 1000; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    #search-input { flex: 1; border: 1px solid #D1D5DB; border-radius: 8px; padding: 10px 12px; font-size: 14px; outline: none; }
    #search-btn { background: #16A34A; color: #fff; border: none; border-radius: 8px; padding: 10px 16px; font-size: 14px; font-weight: 700; cursor: pointer; }
    #map { flex: 1; width: 100%; height: 100%; }
    #results { position: absolute; top: 62px; left: 12px; right: 12px; background: #fff; border: 1px solid #E5E7EB; border-radius: 8px; z-index: 2000; max-height: 220px; overflow-y: auto; display: none; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .result-item { padding: 10px 12px; border-bottom: 1px solid #F3F4F6; font-size: 13px; cursor: pointer; }
    .result-item:last-child { border-bottom: none; }
    .result-item:hover, .result-item:active { background: #F0FDF4; }
    #confirm-bar { position: absolute; bottom: 0; left: 0; right: 0; padding: 14px 16px; background: #fff; border-top: 1px solid #E5E7EB; z-index: 1500; box-shadow: 0 -2px 10px rgba(0,0,0,0.08); display: none; }
    #confirm-btn { width: 100%; background: #16A34A; color: #fff; border: none; border-radius: 10px; padding: 14px; font-size: 16px; font-weight: 700; cursor: pointer; }
    #confirm-btn:active { opacity: 0.9; }
    #location-label { font-size: 13px; color: #111827; font-weight: 600; margin-bottom: 8px; text-align: center; }
    .pin-marker { background: #16A34A; border-radius: 50%; width: 22px; height: 22px; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(22,163,74,0.6); }
  </style>
</head>
<body>
<div id="root">
  <div id="search-bar">
    <input id="search-input" type="text" placeholder="Search town, market or district..." />
    <button id="search-btn" type="button" onclick="doSearch()">Search</button>
  </div>
  <div id="map"></div>
  <div id="results"></div>
  <div id="confirm-bar">
    <div id="location-label">Selected location</div>
    <button id="confirm-btn" type="button" onclick="confirmSelection()">Confirm Location</button>
  </div>
</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var initLat = ${lat};
  var initLng = ${lng};
  var selectedLat = initLat;
  var selectedLng = initLng;
  var selectedName = '';
  var selectedProvince = 'Lusaka';
  var pinMarker = null;

  var map = L.map('map', { zoomControl: true }).setView([initLat, initLng], 12);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  var pinIcon = L.divIcon({ className: '', html: '<div class="pin-marker"></div>', iconSize: [22,22], iconAnchor: [11,11] });

  function placePin(lat, lng, name, province) {
    if (pinMarker) map.removeLayer(pinMarker);
    pinMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
    selectedLat = lat;
    selectedLng = lng;
    if (name) selectedName = name;
    if (province) selectedProvince = province;
    
    var displayText = selectedName ? selectedName + (selectedProvince ? ', ' + selectedProvince : '') : lat.toFixed(4) + ', ' + lng.toFixed(4);
    document.getElementById('location-label').textContent = displayText;
    document.getElementById('confirm-bar').style.display = 'block';
  }

  // Place initial marker
  placePin(initLat, initLng, '', '');

  function doReverseGeocode(lat, lng) {
    fetch('https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var addr = data.address || {};
        var name = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city || addr.county || '';
        var prov = (addr.state || addr.region || '').replace(' Province','').replace(' province','');
        if (!prov) prov = 'Lusaka';
        if (name) selectedName = name;
        if (prov) selectedProvince = prov;
        var displayText = (selectedName || (lat.toFixed(4) + ', ' + lng.toFixed(4))) + ', ' + selectedProvince;
        document.getElementById('location-label').textContent = displayText;
      })
      .catch(function() {});
  }

  doReverseGeocode(initLat, initLng);

  map.on('click', function(e) {
    var lat = e.latlng.lat;
    var lng = e.latlng.lng;
    placePin(lat, lng, '', '');
    doReverseGeocode(lat, lng);
  });

  function doSearch() {
    var q = document.getElementById('search-input').value.trim();
    if (!q) return;
    fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(q) + '&format=json&limit=5&countrycodes=zm')
      .then(function(r) { return r.json(); })
      .then(function(results) {
        var container = document.getElementById('results');
        container.innerHTML = '';
        if (!results || !results.length) {
          container.innerHTML = '<div class="result-item" style="color:#6B7280">No results found in Zambia</div>';
          container.style.display = 'block';
          return;
        }
        results.forEach(function(item) {
          var div = document.createElement('div');
          div.className = 'result-item';
          div.textContent = item.display_name;
          div.onclick = function() {
            container.style.display = 'none';
            var lat = parseFloat(item.lat);
            var lng = parseFloat(item.lon);
            var parts = item.display_name.split(',');
            var name = parts[0] ? parts[0].trim() : '';
            var prov = parts[1] ? parts[1].trim() : 'Lusaka';
            map.setView([lat, lng], 13);
            placePin(lat, lng, name, prov);
            doReverseGeocode(lat, lng);
          };
          container.appendChild(div);
        });
        container.style.display = 'block';
      })
      .catch(function() {});
  }

  document.getElementById('search-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch();
    }
  });

  document.addEventListener('click', function(e) {
    var results = document.getElementById('results');
    var bar = document.getElementById('search-bar');
    if (bar && results && !bar.contains(e.target) && !results.contains(e.target)) {
      results.style.display = 'none';
    }
  });

  function confirmSelection() {
    if (selectedLat === null || selectedLng === null) return;
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'location',
        latitude: selectedLat,
        longitude: selectedLng,
        locationName: selectedName || (selectedLat.toFixed(4) + ', ' + selectedLng.toFixed(4)),
        province: selectedProvince || 'Lusaka'
      }));
    }
  }
</script>
</body>
</html>`;
}

export function LocationPickerModal({
  visible,
  onClose,
  onConfirm,
  initialLatitude,
  initialLongitude,
}: LocationPickerModalProps) {
  const lat = initialLatitude ?? DEFAULT_LOCATION.latitude;
  const lng = initialLongitude ?? DEFAULT_LOCATION.longitude;

  const html = useMemo(() => buildPickerHtml(lat, lng), [lat, lng]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data);
        if (payload?.type === 'location') {
          onConfirm({
            latitude: payload.latitude,
            longitude: payload.longitude,
            locationName:
              payload.locationName ||
              `${payload.latitude.toFixed(4)}, ${payload.longitude.toFixed(4)}`,
            province: payload.province || 'Lusaka',
          });
        }
      } catch {
        // ignore
      }
    },
    [onConfirm],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Pick Your Location</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <AppIcon name="close" size={22} color="#111827" />
          </Pressable>
        </View>

        {Platform.OS === 'web' ? (
          <View style={styles.webFallback}>
            <Text style={styles.webText}>Map picker is optimized for iOS and Android.</Text>
            <Pressable
              onPress={() => {
                onConfirm({
                  latitude: lat,
                  longitude: lng,
                  locationName: 'Lusaka',
                  province: 'Lusaka',
                });
              }}
              style={styles.defaultConfirmBtn}
            >
              <Text style={styles.defaultConfirmText}>Use Default Location (Lusaka)</Text>
            </Pressable>
          </View>
        ) : (
          <WebView
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            source={{ html }}
            style={styles.webview}
            onMessage={handleMessage}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  closeBtn: { padding: 4 },
  webview: { flex: 1 },
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  webText: { fontSize: 15, color: '#4B5563', textAlign: 'center' },
  defaultConfirmBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  defaultConfirmText: { color: '#fff', fontWeight: 'bold' },
});
