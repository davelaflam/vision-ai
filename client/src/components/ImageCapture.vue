<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue'

import { LoggerService } from '@/_base/LoggerService'

const props = defineProps({
  detecting: Boolean,
  videoActive: Boolean,
  label: String,
  captureImage: Function,
  detectImage: Function,
  loading: Boolean,
})

const emit = defineEmits(['update:label'])

const handleTrainClick = async () => {
  LoggerService.info('🟢 Capture Image (Training) button clicked')
  if (props.captureImage) {
    await props.captureImage('train')
  } else {
    LoggerService.error('❌ captureImage function is undefined')
  }
}

const handleDetectClick = async () => {
  LoggerService.info('🟢 Capture Image (Detection) button clicked')
  if (props.detectImage) {
    await props.detectImage('detect')
  } else {
    LoggerService.error('❌ detectImage function is undefined')
  }
}
</script>

<template>
  <v-row v-if="!detecting" class="mt-2">
    <v-col class="w-100" cols="12">
      <v-text-field
        :model-value="label"
        :disabled="!videoActive"
        label="Label for Training"
        class="w-100"
        outlined
        dense
        hide-details
        @update:model-value="$emit('update:label', $event)"
      ></v-text-field>
    </v-col>

    <v-col cols="12" sm="12" class="w-100">
      <v-btn
        class="w-100"
        color="secondary"
        :disabled="!videoActive || !label?.trim()"
        @click="
          () => {
            console.log('🟢 Capture Image (Training) button clicked')
            captureImage?.('train')
          }
        "
      >
        <v-icon left>mdi-camera</v-icon> Capture Image (Training)
      </v-btn>
    </v-col>
  </v-row>

  <v-row v-if="detecting" class="mt-2">
    <v-col cols="12" sm="12" class="w-100">
      <v-btn
        class="w-100"
        color="green darken-1"
        :disabled="!videoActive || loading"
        @click="() => detectImage?.('detect')"
      >
        <v-icon v-if="!loading" left>mdi-magnify</v-icon>
        Capture &amp; Detect
      </v-btn>
    </v-col>
  </v-row>
</template>
