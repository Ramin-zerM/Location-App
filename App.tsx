import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  Animated,
} from "react-native";
import * as Location from "expo-location";
import MapView, {
  Marker,
  PROVIDER_DEFAULT,
  MapPressEvent,
} from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

type SavedPlace = {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  description: string;
};

export default function App() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [tempMarker, setTempMarker] = useState<{ latitude: number; longitude: number } | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [showList, setShowList] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceDesc, setNewPlaceDesc] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<SavedPlace | null>(null);

  const mapRef = useRef<MapView | null>(null);
  const placeIdRef = useRef(0);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission denied");
        return;
      }

      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 10000,
          distanceInterval: 1,
        },
        (loc) => {
          setLocation(loc);
        }
      );
    })();
  }, []);

  const initialRegion = {
    latitude: 17.803266,
    longitude: 102.747888,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // 🔎 ไปที่ตำแหน่งปัจจุบัน
  const handleGoToCurrentLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  };

  // 📍 กดแผนที่เพื่อปักหมุด
  const handleAddTempMarker = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setTempMarker({ latitude, longitude });
  };

  const handleSavePlace = () => {
    if (!tempMarker) {
      Alert.alert("ยังไม่มีหมุด", "โปรดกดบนแผนที่เพื่อปักหมุดก่อนบันทึก");
      return;
    }
    setShowSaveModal(true);
  };

  const confirmSavePlace = () => {
    if (!newPlaceName) {
      Alert.alert("กรุณากรอกชื่อสถานที่");
      return;
    }
    placeIdRef.current += 1;
    const newPlace: SavedPlace = {
      id: placeIdRef.current,
      latitude: tempMarker!.latitude,
      longitude: tempMarker!.longitude,
      name: newPlaceName,
      description: newPlaceDesc,
    };
    setSavedPlaces((prev) => [...prev, newPlace]);
    setTempMarker(null);
    setNewPlaceName("");
    setNewPlaceDesc("");
    setShowSaveModal(false);
  };

  const handleRemoveTempMarker = () => setTempMarker(null);

  const handleSelectPlace = (place: SavedPlace) => {
    console.log("Selected:", place);
    setSelectedPlace(place);
  };

  const closeList = () => {
  setShowList(false);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        onPress={handleAddTempMarker}
      >

        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="ตำแหน่งปัจจุบัน"
            pinColor="red"
          />
        )}

        {tempMarker && (
          <Marker coordinate={tempMarker} title="จุดที่เลือก" pinColor="orange" />
        )}

        {savedPlaces.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            title={place.name}
            description={place.description}
            pinColor="blue"
          />
        ))}
      </MapView>

      <TouchableOpacity
        style={[styles.button, { bottom: 240, right: 20, backgroundColor: "#2196F3"}]}
        onPress={handleGoToCurrentLocation}
      >
        <Ionicons name="locate" style={styles.icon} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { bottom: 180, right: 20, backgroundColor: "#4CAF50" }]}
        onPress={handleSavePlace}
      >
        <Ionicons name="bookmark" style={styles.icon} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { bottom: 120, right: 20, backgroundColor: "#8a8888ff" }]}
        onPress={() => setShowList(!showList)}
      >
        <Ionicons name="list" style={styles.icon} />
      </TouchableOpacity>

      {tempMarker && (
        <TouchableOpacity
          style={[styles.button, { bottom: 40, right: 20, backgroundColor: "red" }]}
          onPress={handleRemoveTempMarker}
        >
          <Ionicons name="close" style={styles.icon} />
        </TouchableOpacity>
      )}

      {showList && (
  <Animated.View
    style={[
      styles.listContainer,
      { height: Math.min(240, savedPlaces.length * 70 + 60)}, 
    ]}
  >
    {/* Header ของลิสต์ */}
    <View style={styles.listHeader}>
      <Text style={styles.listTitle}>สถานที่ที่บันทึกไว้</Text>
      <TouchableOpacity onPress={closeList}>
        <Ionicons name="close" size={22} color="#333" />
      </TouchableOpacity>
    </View>

    <FlatList
      data={savedPlaces}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.listItem}
          onPress={() => handleSelectPlace(item)}
        >
          <Text style={styles.listName}>{item.name}</Text>
          <Text style={styles.listDesc}>{item.description}</Text>
        </TouchableOpacity>
      )}
      contentContainerStyle={{ paddingBottom: 80 }}
    />
  </Animated.View>
)}

      <Modal visible={showSaveModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>บันทึกสถานที่</Text>
            <TextInput
              style={styles.input}
              placeholder="ชื่อสถานที่"
              value={newPlaceName}
              onChangeText={setNewPlaceName}
            />
            <TextInput
              style={styles.input}
              placeholder="คำอธิบาย"
              value={newPlaceDesc}
              onChangeText={setNewPlaceDesc}
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between" , marginTop: 10,}}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "red" }]}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={{ color: "#fff" }}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "green" }]}
                onPress={confirmSavePlace}
              >
                <Text style={{ color: "#fff" }}>บันทึก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedPlace} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{selectedPlace?.name}</Text>
            <Text>{selectedPlace?.description}</Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#2196F3", marginTop: 10 }]}
              onPress={() => {
                if (selectedPlace && mapRef.current) {
                  mapRef.current.animateToRegion(
                    {
                      latitude: selectedPlace.latitude,
                      longitude: selectedPlace.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    },
                    1000
                  );
                }
                setSelectedPlace(null);
              }}
            >
              <Text style={{ color: "#fff"  }}>ไปยังตำแหน่ง</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "gray", marginTop: 10 }]}
              onPress={() => setSelectedPlace(null)}
            >
              <Text style={{ color: "#fff" }}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  map: { flex: 1 },

  button: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  icon: {
    fontSize: 22,
    color: "#fff",
  },

  listContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: 240,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    zIndex: 999,   
    elevation: 999, 
  },
  listTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 8,
    color: "#212121",
  },
  listItem: {
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  listName: { fontSize: 15, fontWeight: "600", color: "#212121" },
  listDesc: { fontSize: 12, color: "#757575", marginTop: 2 },

  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    color: "#212121",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: "#FAFAFA",
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    alignItems: "center",
    borderRadius: 10,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
},
});
