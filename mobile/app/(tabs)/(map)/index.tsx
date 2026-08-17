import React, { useCallback, useMemo, useState } from "react";
import * as Location from "expo-location";
import { router } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewMessageEvent } from "react-native-webview";

import { DEFAULT_LOCATION } from "@/constants";
import { AppContext } from "@/context/app-context";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type FarmPin = Coordinate & {
  supplierId: string;
  name: string;
  location: string;
  province: string;
  productCount: number;
  color: string;
};

type LocationState = "loading" | "granted" | "fallback" | "denied";

function buildMapHtml(userLocation: Coordinate, farmPins: FarmPin[]) {
  const userJson = JSON.stringify(userLocation);
  const pinsJson = JSON.stringify(farmPins);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    />
    <style>
      html,
      body,
      #map {
        height: 100%;
        margin: 0;
        width: 100%;
      }

      body {
        background: #eef5f0;
        color: #111827;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .farm-marker,
      .user-marker {
        align-items: center;
        border: 3px solid #ffffff;
        border-radius: 999px;
        box-shadow: 0 4px 12px rgba(17, 24, 39, 0.28);
        display: flex;
        justify-content: center;
      }

      .farm-marker {
        height: 34px;
        width: 34px;
      }

      .farm-marker span {
        background: #ffffff;
        border-radius: 999px;
        height: 10px;
        width: 10px;
      }

      .user-marker {
        background: #2563eb;
        height: 22px;
        position: relative;
        width: 22px;
      }

      .user-marker:after {
        border: 2px solid rgba(37, 99, 235, 0.35);
        border-radius: 999px;
        content: "";
        height: 44px;
        left: -14px;
        position: absolute;
        top: -14px;
        width: 44px;
      }

      .empty-state {
        background: rgba(255, 255, 255, 0.92);
        border-radius: 10px;
        box-shadow: 0 3px 12px rgba(17, 24, 39, 0.12);
        font-size: 13px;
        font-weight: 700;
        left: 16px;
        padding: 10px 12px;
        position: absolute;
        right: 16px;
        text-align: center;
        top: 16px;
        z-index: 500;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var userLocation = ${userJson};
      var farmPins = ${pinsJson};

      function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
          return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
          }[character];
        });
      }

      function sendSupplierPress(supplierId) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: "supplier", supplierId: supplierId })
          );
        }
      }

      var userLatLng = [userLocation.latitude, userLocation.longitude];
      var map = L.map("map", {
        attributionControl: true,
        zoomControl: true
      }).setView(userLatLng, 11);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      var userIcon = L.divIcon({
        className: "user-marker-wrapper",
        html: '<div class="user-marker"></div>',
        iconAnchor: [11, 11],
        iconSize: [22, 22]
      });

      L.marker(userLatLng, { icon: userIcon, keyboard: false })
        .bindTooltip("Your location", { direction: "top" })
        .addTo(map);

      var bounds = L.latLngBounds([userLatLng]);
      var pointCount = 1;

      farmPins.forEach(function (pin) {
        if (typeof pin.latitude !== "number" || typeof pin.longitude !== "number") {
          return;
        }

        var farmIcon = L.divIcon({
          className: "farm-marker-wrapper",
          html:
            '<div class="farm-marker" style="background:' +
            escapeHtml(pin.color || "#16a34a") +
            '"><span></span></div>',
          iconAnchor: [17, 17],
          iconSize: [34, 34]
        });

        var label =
          escapeHtml(pin.name) +
          "<br />" +
          escapeHtml(pin.location) +
          ", " +
          escapeHtml(pin.province) +
          "<br />" +
          pin.productCount +
          " product" +
          (pin.productCount === 1 ? "" : "s");

        L.marker([pin.latitude, pin.longitude], {
          icon: farmIcon,
          keyboard: false
        })
          .bindTooltip(label, { direction: "top", opacity: 0.95 })
          .on("click", function () {
            sendSupplierPress(pin.supplierId);
          })
          .addTo(map);

        bounds.extend([pin.latitude, pin.longitude]);
        pointCount += 1;
      });

      if (pointCount > 1) {
        map.fitBounds(bounds, {
          maxZoom: 11,
          padding: [42, 42]
        });
      }

      if (farmPins.length === 0) {
        var emptyState = document.createElement("div");
        emptyState.className = "empty-state";
        emptyState.textContent = "No farm locations available yet";
        document.body.appendChild(emptyState);
      }
    </script>
  </body>
</html>`;
}

export default function MapScreen() {
  const { products, allUsers } = React.use(AppContext);
  const [userLocation, setUserLocation] =
    useState<Coordinate>(DEFAULT_LOCATION);
  const [locationState, setLocationState] =
    useState<LocationState>("loading");

  React.useEffect(() => {
    let isMounted = true;

    async function loadLocation() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
          if (isMounted) {
            setUserLocation(DEFAULT_LOCATION);
            setLocationState("denied");
          }
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (isMounted) {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationState("granted");
        }
      } catch {
        if (isMounted) {
          setUserLocation(DEFAULT_LOCATION);
          setLocationState("fallback");
        }
      }
    }

    loadLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const farmPins = useMemo(() => {
    const pinsBySupplier = new Map<string, FarmPin>();

    products
      .filter((product) => product.availability !== "hidden")
      .forEach((product) => {
        const supplier = allUsers.find(
          (user) => user.id === product.supplierId && user.role === "farmer"
        );

        if (!supplier) return;

        const existingPin = pinsBySupplier.get(supplier.id);

        if (existingPin) {
          existingPin.productCount += 1;
          return;
        }

        pinsBySupplier.set(supplier.id, {
          supplierId: supplier.id,
          name: supplier.name,
          location: supplier.location,
          province: supplier.province,
          productCount: 1,
          latitude: product.latitude,
          longitude: product.longitude,
          color: supplier.avatarColor,
        });
      });

    return Array.from(pinsBySupplier.values());
  }, [allUsers, products]);

  const mapHtml = useMemo(
    () => buildMapHtml(userLocation, farmPins),
    [farmPins, userLocation]
  );

  const validSupplierIds = useMemo(
    () => new Set(farmPins.map((pin) => pin.supplierId)),
    [farmPins]
  );

  const handleMapMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data);

        if (
          payload?.type === "supplier" &&
          typeof payload.supplierId === "string" &&
          validSupplierIds.has(payload.supplierId)
        ) {
          router.push({
            pathname: "/suppliers/[id]",
            params: { id: payload.supplierId },
          });
        }
      } catch {
        // Ignore messages that do not match the map payload contract.
      }
    },
    [validSupplierIds]
  );

  const locationMessage =
    locationState === "granted"
      ? "Using your current location"
      : locationState === "loading"
        ? "Finding your location..."
        : "Using Lusaka as the map center";

  if (Platform.OS === "web") {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.centeredTitle}>Map unavailable on web</Text>
        <Text style={styles.centeredMessage}>
          Open the app on iOS or Android to view nearby farm locations.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        domStorageEnabled
        javaScriptEnabled
        originWhitelist={["*"]}
        source={{ html: mapHtml }}
        style={styles.map}
        onMessage={handleMapMessage}
      />

      <View style={styles.statusPill}>
        <Text style={styles.statusText}>{locationMessage}</Text>
        <Text style={styles.pinCountText}>
          {farmPins.length} farm{farmPins.length === 1 ? "" : "s"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredMessage: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  centeredState: {
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    flex: 1,
    gap: 8,
    justifyContent: "center",
    padding: 24,
  },
  centeredTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
  },
  container: {
    backgroundColor: "#E5E7EB",
    flex: 1,
  },
  map: {
    backgroundColor: "#E5E7EB",
    flex: 1,
  },
  pinCountText: {
    color: "#047857",
    fontSize: 12,
    fontWeight: "800",
  },
  statusPill: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(17, 24, 39, 0.16)",
    gap: 2,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: "absolute",
    right: 16,
    top: 16,
  },
  statusText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
  },
});
