<template>
  <v-card v-if="detecting" class="mb-4" elevation="2" theme="dark">
    <v-card-title>
      <span class="text-h6">Detection Results</span>
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-row v-if="loading" class="text-center">
        <v-col cols="12">
          <v-progress-circular indeterminate color="green" size="48"></v-progress-circular>
          <div class="mt-2">Detecting...</div>
        </v-col>
      </v-row>

      <template v-else-if="detectedLabel">
        <div class="mb-2">
          Detected Labels: <strong>{{ detectedLabel }}</strong>
        </div>
        <div v-if="confidence !== null">
          Confidence: <strong>{{ confidence }}</strong>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { defineProps } from 'vue'

defineProps({
  detecting: Boolean,
  loading: Boolean,
  detectedLabel: String,
  confidence: Number,
})
</script>
