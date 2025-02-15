<template>
  <v-row align="center" justify="center" no-gutters>
    <v-col cols="6" sm="" class="px-1">
      <v-btn
        dark
        large
        :color="videoActive ? 'grey' : 'success'"
        :disabled="videoActive"
        class="w-100"
        @click="handleStartCamera"
      >
        <v-icon left>mdi-video</v-icon>
        {{ videoActive ? "Camera Started" : "Start Camera" }}
      </v-btn>
    </v-col>

    <v-col cols="6" sm="6" class="px-1">
      <v-btn
        class="w-100"
        color="error"
        v-if="videoActive"
        @click="handleStopCamera"
      >
        <v-icon left>mdi-video-off</v-icon> Stop Camera
      </v-btn>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from "vue";
import { LoggerService } from "@/_base/LoggerService";

defineProps({
  videoActive: Boolean,
});

const emit = defineEmits(["start-camera", "stop-camera"]);

const handleStartCamera = () => {
  LoggerService.info("🔹 Start Camera button clicked");
  emit("start-camera");
};

const handleStopCamera = () => {
  LoggerService.info("🔹 Stop Camera button clicked");
  emit("stop-camera");
};
</script>
