<script lang="ts" setup>
import { defineProps, defineEmits, computed } from 'vue'

import { LoggerService } from '@/_base/LoggerService'

const props = defineProps({
  videoActive: Boolean,
  camera: String,
})

const cameraClass = computed(() => props.camera || '')

const emit = defineEmits(['start-camera', 'stop-camera'])

const handleStartCamera = () => {
  LoggerService.info('🔹 Start Camera chip clicked')
  emit('start-camera')
}

const handleStopCamera = () => {
  LoggerService.info('🔹 Stop Camera chip clicked')
  emit('stop-camera')
}
</script>

<template>
  <v-row
:class="cameraClass"
align="center" justify="center"
no-gutters>
    <v-col cols="12" class="d-flex justify-center">
      <!-- Start Camera Chip -->
      <v-chip
v-if="!videoActive"
class="control-chip" color="success"
@click="handleStartCamera">
        <v-icon left>mdi-video</v-icon>
        Start Camera
      </v-chip>

      <!-- Stop Camera Chip -->
      <v-chip
v-else
class="control-chip stop-chip" color="error"
@click="handleStopCamera">
        <v-icon left>mdi-video-off</v-icon>
        Stop Camera
      </v-chip>
    </v-col>
  </v-row>
</template>

<style scoped lang="scss">
.camera-controls {
  .control-chip {
    font-size: 14px;
    padding: 6px 12px;
    min-width: 120px;
    text-align: center;
  }

  .stop-chip {
    background-color: #d32f2f !important;
    color: #ffffff;
  }

  .v-chip__content {
    color: #ffffff !important;
  }
}
</style>
