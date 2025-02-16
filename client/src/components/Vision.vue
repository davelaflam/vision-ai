<template>
  <v-container fluid class="d-flex flex-column align-center px-2">
    <!-- Camera Controls & Mode Switch in a single row -->
    <v-card class="mb-2 w-100 px-2 py-1" theme="dark" elevation="2">
      <v-row align="center" justify="center">
        <!-- Camera Controls -->
        <v-col cols="6" class="d-flex justify-center">
          <CameraControls :videoActive="videoActive" @start-camera="startCamera" @stop-camera="stopCamera" />
        </v-col>

        <!-- Mode Switch -->
        <v-col cols="6" class="d-flex justify-center">
          <ModeSwitch v-model:detecting="detecting" :videoActive="videoActive" />
        </v-col>
      </v-row>
    </v-card>

    <!-- Video & Detection Results -->
    <div class="video-container">
      <video ref="video" autoplay playsinline v-show="videoActive" class="video-element"></video>

      <!-- Detection Results as a floating overlay (only show after first detection) -->
      <DetectionResults
        v-if="detecting && detectionTriggered"
        class="detection-overlay"
        :detecting="detecting"
        :loading="loading"
        :detectedLabel="detectedLabel"
        :confidence="confidence"
      />
    </div>

    <!-- Image Capture Controls -->
    <ImageCapture
      :detecting="detecting"
      :videoActive="videoActive"
      v-model:label="label"
      :captureImage="captureImage"
      :detectImage="handleDetectImage"
      :loading="loading"
    />
  </v-container>
</template>

<script lang="ts" setup>
import { ref, nextTick } from 'vue'
import { LoggerService } from '@/_base/LoggerService'
import CameraControls from '@/components/CameraControls.vue'
import ModeSwitch from '@/components/ModeSwitch.vue'
import ImageCapture from '@/components/ImageCapture.vue'
import DetectionResults from '@/components/DetectionResults.vue'

const HOST = import.meta.env.VITE_API_HOST || 'http://localhost:3000'
const video = ref<HTMLVideoElement | null>(null)
const videoActive = ref(false)
const cameraStream = ref<MediaStream | null>(null)
const label = ref('')
const detecting = ref(false)
const detectedLabel = ref('')
const confidence = ref<number | null>(null)
const loading = ref(false)
const detectionTriggered = ref(false) // Ensure results only appear when "Capture & Detect" is clicked

/**
 * Starts the camera stream and updates the video element.
 */
const startCamera = async () => {
  LoggerService.info('✅ Starting Camera...')

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access not supported on this browser.')
    }

    const isMobile = /Mobi|Android/i.test(navigator.userAgent)
    LoggerService.debug(`UserAgent: ${navigator.userAgent}, isMobile: ${isMobile}`)

    const videoConstraints = isMobile ? { facingMode: 'environment' } : true
    LoggerService.debug(`Video constraints: ${JSON.stringify(videoConstraints)}`)

    const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints })

    LoggerService.info('✅ Camera stream acquired')

    videoActive.value = true
    cameraStream.value = stream
    detectionTriggered.value = false // Reset detection when the camera starts

    await nextTick()

    if (video.value) {
      video.value.srcObject = stream
      LoggerService.debug('✅ Video element updated with camera stream.')
    } else {
      LoggerService.error('❌ Video element is null. Cannot start camera.')
    }
  } catch (error) {
    LoggerService.error('❌ Error accessing camera:', error)

    if (error.name === 'NotAllowedError') {
      alert('Camera access denied! Please allow permissions and reload.')
    } else if (error.name === 'NotFoundError') {
      alert('No camera found. Please check your device.')
    }
  }
}

/**
 * Stops the camera stream and resets the video element.
 */
const stopCamera = () => {
  LoggerService.info('Stopping Camera...')

  if (cameraStream.value) {
    LoggerService.debug(`Stopping ${cameraStream.value.getTracks().length} tracks.`)
    cameraStream.value.getTracks().forEach((track) => track.stop())
    cameraStream.value = null
  }

  videoActive.value = false
  LoggerService.info('Camera stopped.')
}

/**
 * Captures an image using the current video feed.
 */
const captureImage = async (mode: string) => {
  LoggerService.info(`Capturing image for mode: ${mode}`)

  if (!video.value) {
    LoggerService.warning('Attempted to capture image but video element is null.')
    return
  }

  const canvas = document.createElement('canvas')
  canvas.width = 224
  canvas.height = 224
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    LoggerService.error('Failed to get canvas context for image capture.')
    return
  }

  ctx.drawImage(video.value, 0, 0, canvas.width, canvas.height)
  const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]

  const payload = {
    uri: `train-${Date.now()}`,
    data: base64Data,
    label: label.value,
    user: 'testUser',
    stage: mode,
  }

  LoggerService.debug(`Payload created: ${JSON.stringify(payload)}`)

  try {
    const response = await fetch(`${HOST}/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      LoggerService.warning(`Training request failed: ${response.status} ${response.statusText}`)
    } else {
      LoggerService.info('Training request completed successfully.')
    }
  } catch (error) {
    LoggerService.error('Error during training request:', error)
  }
}

/**
 * Handles image detection and ensures results are shown only after the user clicks the button.
 */
const handleDetectImage = async (mode: string = 'detect') => {
  LoggerService.info(`Starting image detection in mode: ${mode}`)

  if (!video.value) {
    LoggerService.warning('Attempted to detect image but video element is null.')
    return
  }

  loading.value = true
  detectionTriggered.value = true // Ensure results only appear after "Capture & Detect" is clicked
  detectedLabel.value = ''
  confidence.value = null

  const canvas = document.createElement('canvas')
  canvas.width = 224
  canvas.height = 224
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    LoggerService.error('Failed to get canvas context for image detection.')
    loading.value = false
    return
  }

  ctx.drawImage(video.value, 0, 0, canvas.width, canvas.height)
  const base64Data = canvas.toDataURL('image/jpeg', 0.4).split(',')[1]

  LoggerService.debug('Image captured and converted to Base64.')

  try {
    const response = await fetch(`${HOST}/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: base64Data, user: 'testUser' }),
    })

    const resultJson = await response.json()
    LoggerService.debug(`Detection response: ${JSON.stringify(resultJson)}`)

    detectedLabel.value = resultJson.matches?.[0]?.label || 'Unknown Object'
    confidence.value = resultJson.matches?.[0]?.confidence ?? 0

    LoggerService.info(`Detection Result: ${detectedLabel.value} with confidence: ${confidence.value}`)
  } catch (error) {
    LoggerService.error(`Error during ${mode} request:`, error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.video-container {
  position: relative;
  width: 100%;
  max-width: 340px;
  aspect-ratio: 4 / 3;
  border: 1px solid #ccc;
  display: flex;
  justify-content: center;
  align-items: center;
}

.video-element {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.detection-overlay {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.8);
  color: black;
  padding: 6px 10px;
  border-radius: 8px;
  text-align: center;
  width: 90%;
  font-weight: 500;
  font-size: 12px;
}
</style>
