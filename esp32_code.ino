#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

// Konfigurasi WiFi
const char* ssid = "NAMA_WIFI_ANDA";
const char* password = "PASSWORD_WIFI_ANDA";

// Konfigurasi Server
const char* serverUrl = "http://localhost:3000"; // Ganti dengan IP server Anda

// Pin untuk sensor DS18B20
const int oneWireBus = 4; // Pin GPIO4 untuk sensor suhu
OneWire oneWire(oneWireBus);
DallasTemperature sensors(&oneWire);

// Pin untuk relay
const int relayPin = 5; // Pin GPIO5 untuk relay

// Variabel untuk menyimpan status relay
bool relayState = false;

// Interval pengiriman data (dalam milidetik)
const long interval = 5000; // 5 detik
unsigned long previousMillis = 0;

void setup() {
  Serial.begin(115200);
  
  // Inisialisasi sensor suhu
  sensors.begin();
  
  // Inisialisasi pin relay
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, LOW); // Matikan relay di awal
  
  // Koneksi ke WiFi
  WiFi.begin(ssid, password);
  Serial.print("Menghubungkan ke WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nTerhubung ke WiFi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  unsigned long currentMillis = millis();
  
  // Cek koneksi WiFi
  if (WiFi.status() == WL_CONNECTED) {
    // Kirim data setiap interval
    if (currentMillis - previousMillis >= interval) {
      previousMillis = currentMillis;
      sendSensorData();
      checkRelayStatus();
    }
  } else {
    Serial.println("WiFi terputus! Mencoba menghubungkan kembali...");
    WiFi.reconnect();
  }
}

void sendSensorData() {
  // Baca suhu
  sensors.requestTemperatures();
  float temperature = sensors.getTempCByIndex(0);
  
  // Buat JSON untuk data sensor
  StaticJsonDocument<200> doc;
  doc["suhu"] = temperature;
  doc["relay"] = relayState;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Kirim data ke server
  HTTPClient http;
  String url = String(serverUrl) + "/api/data";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("HTTP Response code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
  } else {
    Serial.println("Error sending data: " + String(httpResponseCode));
  }
  
  http.end();
}

void checkRelayStatus() {
  HTTPClient http;
  String url = String(serverUrl) + "/api/relay-status";
  http.begin(url);
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error) {
      bool newRelayState = doc["state"];
      if (newRelayState != relayState) {
        relayState = newRelayState;
        digitalWrite(relayPin, relayState ? HIGH : LOW);
        Serial.println("Relay status changed to: " + String(relayState ? "ON" : "OFF"));
      }
    }
  }
  
  http.end();
} 