<template>
  <div class="typing-input-container">
    <input
      v-model="typedText"
      @keyup.enter="handleEnter"
      @blur="handleBlur"
      ref="typingInputEl"
      class="typing-input"
      type="text"
      placeholder="Type words to defeat enemies"
      autocomplete="off"
      autocorrect="off"
      :disabled="disabled"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Props {
  disabled: boolean;
  autoFocus: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  autoFocus: true
});

const emit = defineEmits<{
  textSubmitted: [text: string]
  focusRequested: []
}>();

const typedText = ref('');
const typingInputEl = ref<HTMLInputElement | null>(null);

const handleEnter = () => {
  const text = typedText.value.trim();
  if (text) {
    emit('textSubmitted', text);
    typedText.value = '';
  }
};

const handleBlur = () => {
  if (props.autoFocus && !props.disabled) {
    emit('focusRequested');
  }
};

const focus = () => {
  if (typingInputEl.value && !props.disabled) {
    typingInputEl.value.focus();
  }
};

// Auto-focus on mount
onMounted(() => {
  if (props.autoFocus) {
    setTimeout(focus, 100);
  }
});

// Expose focus method for parent component
defineExpose({
  focus
});
</script>

<style scoped>
.typing-input-container {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -100px);
  z-index: 20;
  pointer-events: auto;
}

.typing-input {
  padding: 10px 15px;
  border: none;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  color: #333;
  font-size: 16px;
  width: 300px;
  text-align: center;
  box-shadow: 0 0 15px rgba(52, 152, 219, 0.7);
  font-weight: bold;
  transition: all 0.3s ease;
}

.typing-input:focus {
  outline: none;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 20px rgba(52, 152, 219, 1);
  transform: scale(1.02);
}

.typing-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style> 