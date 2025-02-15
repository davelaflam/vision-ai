<template>
  <v-container fluid>
    <v-toolbar theme="dark" class="mb-4">
      <v-toolbar-title>Vision App</v-toolbar-title>
    </v-toolbar>

    <!-- Camera Controls -->
    <v-card class="mb-4" theme="dark" elevation="2">
      <v-card-title>
        <span class="text-h6">Camera Controls</span>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <CameraControls
          :videoActive="videoActive"
          @start-camera="startCamera"
          @stop-camera="stopCamera"
        />
        <v-row v-if="videoActive" class="">
          <v-col cols="12" class="text-center">
            <video
              ref="video"
              autoplay
              playsinline
              width="300"
              v-show="videoActive"
              style="border: 1px solid #ccc"
            ></video>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Mode Switch -->
    <v-card class="mb-4" elevation="2" theme="dark">
      <v-card-title>
        <span class="text-h6"
          >Current Mode: {{ detecting ? "Detection" : "Training" }}</span
        >
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <ModeSwitch v-model:detecting="detecting" :videoActive="videoActive" />
      </v-card-text>
    </v-card>

    <!-- Image Capture -->
    <ImageCapture
      :detecting="detecting"
      :videoActive="videoActive"
      v-model:label="label"
      :captureImage="captureImage"
      :detectImage="detectImage"
      :loading="loading"
    />

    <!-- Detection Results -->
    <DetectionResults
      :detecting="detecting"
      :loading="loading"
      :detectedLabel="detectedLabel"
      :confidence="confidence"
    />
  </v-container>
</template>

<script lang="ts" setup>
import { ref, nextTick } from "vue";
import { LoggerService } from "@/_base/LoggerService";
import CameraControls from "@/components/CameraControls.vue";
import ModeSwitch from "@/components/ModeSwitch.vue";
import ImageCapture from "@/components/ImageCapture.vue";
import DetectionResults from "@/components/DetectionResults.vue";

const HOST = import.meta.env.VITE_API_HOST || "http://localhost:3000";
const video = ref<HTMLVideoElement | null>(null);
const videoActive = ref(false);
const cameraStream = ref<MediaStream | null>(null);
const label = ref("");
const detecting = ref(false);
const detectedLabel = ref("");
const confidence = ref<number | null>(null);
const loading = ref(false);

/**
 * Starts the camera stream and updates the video element.
 * @returns
 */
const startCamera = async () => {
  LoggerService.info("✅ Starting Camera...");

  try {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    LoggerService.debug(
      `UserAgent: ${navigator.userAgent}, isMobile: ${isMobile}`,
    );

    const videoConstraints = isMobile ? { facingMode: "environment" } : true;
    LoggerService.debug(
      `Video constraints: ${JSON.stringify(videoConstraints)}`,
    );

    const stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
    });

    LoggerService.info("✅ Camera stream acquired");

    videoActive.value = true;
    cameraStream.value = stream;

    await nextTick();

    if (video.value) {
      video.value.srcObject = stream;
      LoggerService.debug("Video element updated with camera stream.");
    }
  } catch (error) {
    LoggerService.error("❌ Error accessing camera", error);
  }
};

/**
 * Stops the camera stream and resets the video element.
 * @returns
 */
const stopCamera = () => {
  LoggerService.info("Stopping Camera...");

  if (cameraStream.value) {
    LoggerService.debug(
      `Stopping ${cameraStream.value.getTracks().length} tracks.`,
    );
    cameraStream.value.getTracks().forEach((track) => track.stop());
    cameraStream.value = null;
  }

  videoActive.value = false;
  LoggerService.info("Camera stopped.");
};

/**
 * Captures an image using the current video feed.
 * @param mode
 * @returns
 */
const captureImage = async (mode: string) => {
  LoggerService.info(`Capturing image for mode: ${mode}`);

  if (!video.value) {
    LoggerService.warning(
      "Attempted to capture image but video element is null.",
    );
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 224;
  canvas.height = 224;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    LoggerService.error("Failed to get canvas context for image capture.");
    return;
  }

  ctx.drawImage(video.value, 0, 0, canvas.width, canvas.height);
  const base64Data = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];

  const payload = {
    uri: `train-${Date.now()}`,
    data: base64Data,
    label: label.value,
    user: "testUser",
    stage: mode,
  };

  LoggerService.debug(`Payload created: ${JSON.stringify(payload)}`);

  try {
    const response = await fetch(`${HOST}/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      LoggerService.warning(
        `Training request failed: ${response.status} ${response.statusText}`,
      );
    } else {
      LoggerService.info("Training request completed successfully.");
    }
  } catch (error) {
    LoggerService.error("Error during training request:", error);
  }
};

/**
 * Detects an image using the current video feed.
 * @param mode
 * @returns
 */
const detectImage = async (mode: string = "detect") => {
  LoggerService.info(`Starting image detection in mode: ${mode}`);

  if (!video.value) {
    LoggerService.warning(
      "Attempted to detect image but video element is null.",
    );
    return;
  }

  loading.value = true;
  detectedLabel.value = "";
  confidence.value = null;

  const canvas = document.createElement("canvas");
  canvas.width = 224;
  canvas.height = 224;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    LoggerService.error("Failed to get canvas context for image detection.");
    loading.value = false;
    return;
  }

  ctx.drawImage(video.value, 0, 0, canvas.width, canvas.height);
  const base64Data = canvas.toDataURL("image/jpeg", 0.4).split(",")[1];

  LoggerService.debug("Image captured and converted to Base64.");

  try {
    const response = await fetch(`${HOST}/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: base64Data, user: "testUser" }),
    });

    const resultJson = await response.json();
    LoggerService.debug(`Detection response: ${JSON.stringify(resultJson)}`);

    detectedLabel.value = resultJson.matches?.[0]?.label || "Unknown Object";
    confidence.value = resultJson.matches?.[0]?.confidence ?? 0;

    LoggerService.info(
      `Detection Result: ${detectedLabel.value} with confidence: ${confidence.value}`,
    );
  } catch (error) {
    LoggerService.error(`Error during ${mode} request:`, error);
  } finally {
    loading.value = false;
  }
};
</script>
