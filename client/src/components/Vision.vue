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
const confidence = ref<number | undefined>(undefined)
const loading = ref(false)
const detectionTriggered = ref(false) // ✅ Controls when results appear

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
    detectionTriggered.value = false

    await nextTick()

    if (video.value) {
      video.value.srcObject = stream
      LoggerService.debug('✅ Video element updated with camera stream.')
    } else {
      LoggerService.error('❌ Video element is null. Cannot start camera.')
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    LoggerService.error('❌ Error accessing camera:', errorMessage)

    if (error instanceof Error && error.name === 'NotAllowedError') {
      alert('Camera access denied! Please allow permissions and reload.')
    } else if (error instanceof Error && error.name === 'NotFoundError') {
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
 * Captures an image from the video feed.
 */
const captureImage = async (): Promise<string | null> => {
  LoggerService.info('🟢 captureImage() called')

  if (!video.value) {
    LoggerService.warning('🚨 Attempted to capture image but video element is null.')
    return null
  }

  const canvas = document.createElement('canvas')
  canvas.width = 224
  canvas.height = 224
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    LoggerService.error('❌ Failed to get canvas context for image capture.')
    return null
  }

  ctx.drawImage(video.value, 0, 0, canvas.width, canvas.height)
  const base64Data = canvas.toDataURL('image/jpeg', 0.4).split(',')[1]

  LoggerService.debug(`✅ Image captured, Base64 length: ${base64Data.length}`)
  return base64Data
}

/**
 * Handles **training** image capture and sending to `/train` API.
 */
const handleTrainImage = async () => {
  LoggerService.info('🟢 handleTrainImage() called')

  if (!label.value.trim()) {
    LoggerService.warning('🚨 Training label is required.')
    return
  }

  const base64Data = await captureImage()
  if (!base64Data) {
    return
  }

  try {
    LoggerService.info(`🚀 Sending training data to ${HOST}/train`)

    const response = await fetch(`${HOST}/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: base64Data, label: label.value, user: 'testUser' }),
    })

    LoggerService.debug(`📡 API Response Status: ${response.status}`)

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`)
    }

    const resultJson = await response.json()
    LoggerService.debug(`📡 API Response Data: ${JSON.stringify(resultJson)}`)
    LoggerService.info(`✅ Training completed for label: ${label.value}`)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    LoggerService.error(`❌ Error during training request: ${errorMessage}`)
  }
}

/**
 * Handles image detection and ensures results are shown only after the user clicks the button.
 */
const handleDetectImage = async (mode: string = 'detect') => {
  LoggerService.info(`🟢 handleDetectImage() called for mode: ${mode}`)

  if (!video.value) {
    LoggerService.warning('🚨 Attempted to detect image but video element is null.')
    return
  }

  detecting.value = true // ✅ Ensure results box stays visible
  loading.value = true // ✅ Show spinner
  detectedLabel.value = '' // ✅ Reset previous results
  confidence.value = undefined // ✅ Reset confidence

  const base64Data = await captureImage()
  if (!base64Data) {
    loading.value = false
    return
  }

  try {
    LoggerService.info(`🚀 Sending detection request to ${HOST}/${mode}`)

    const response = await fetch(`${HOST}/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: base64Data, user: 'testUser' }),
    })

    LoggerService.debug(`📡 API Response Status: ${response.status}`)

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`)
    }

    const resultJson = await response.json()
    LoggerService.debug(`📡 API Response Data: ${JSON.stringify(resultJson)}`)

    detectedLabel.value = resultJson.matches?.[0]?.label || 'Unknown Object'
    confidence.value = resultJson.matches?.[0]?.confidence ?? 0

    LoggerService.info(`✅ Detection Result: ${detectedLabel.value} with confidence: ${confidence.value}`)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    LoggerService.error(`❌ Error during ${mode} request: ${errorMessage}`)
  } finally {
    loading.value = false // ✅ Hide spinner AFTER request completes
  }
}
</script>

<template>
  <v-container fluid class="d-flex flex-column align-center px-2">
    <v-card class="mb-2 w-100 px-2 py-1" theme="dark" elevation="2">
      <v-row align="center" justify="center">
        <v-col cols="6" class="d-flex justify-center">
          <CameraControls :videoActive="videoActive" @start-camera="startCamera" @stop-camera="stopCamera" />
        </v-col>
        <v-col cols="6" class="d-flex justify-center">
          <ModeSwitch v-model:detecting="detecting" :videoActive="videoActive" />
        </v-col>
      </v-row>
    </v-card>

    <!-- Video Display -->
    <div class="video-container">
      <video v-show="videoActive" ref="video" autoplay playsinline class="video-element"></video>
    </div>

    <!-- Image Capture Controls -->
    <ImageCapture
      v-model:label="label"
      :detecting="detecting"
      :videoActive="videoActive"
      :captureImage="handleTrainImage"
      :detectImage="handleDetectImage"
      :loading="loading"
    />

    <!-- Detection Results -->
    <DetectionResults
      v-if="detecting || loading"
      class="mt-3 w-100"
      :detecting="detecting"
      :loading="loading"
      :detectedLabel="detectedLabel"
      :confidence="confidence"
    />
  </v-container>
</template>

<style scoped lang="scss">
.video-container {
  position: relative;
  width: 100%;
  max-width: 340px;
  aspect-ratio: 4 / 3;
  border: 1px solid #ccc;
  border-radius: 8px;
  display: flex;
  height: 244px;
  justify-content: center;
  align-items: center;
}

.video-element {
  width: 100%;
  height: auto;
  max-height: 240px;
  border-radius: 8px;
  object-fit: cover;
}

@media screen and (max-width: 400px) {
  .video-element {
    max-height: 200px;
  }
}
</style>
