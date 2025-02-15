<template>
  <v-row v-if="!detecting" class="mt-2">
    <v-col class="w-100" cols="12">
      <v-text-field
        :model-value="label"
        @update:model-value="$emit('update:label', $event)"
        :disabled="!videoActive"
        label="Label for Training"
        class="w-100"
        outlined
        dense
        hide-details
      ></v-text-field>
    </v-col>

    <v-col cols="12" sm="12" class="w-100">
      <v-btn
        class="w-100"
        color="secondary"
        @click="captureImage('train')"
        :disabled="!videoActive || !label.trim()"
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
        @click="detectImage('detect')"
        :disabled="!videoActive || loading"
      >
        <v-icon left v-if="!loading">mdi-magnify</v-icon>
        Capture &amp; Detect
      </v-btn>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from "vue";

defineProps({
  detecting: Boolean,
  videoActive: Boolean,
  label: String,
  captureImage: Function,
  detectImage: Function,
  loading: Boolean,
});

// Emit updates to the label prop
defineEmits(["update:label"]);
</script>
