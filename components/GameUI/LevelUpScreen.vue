<template>
  <div class="level-up-overlay">
    <div class="level-up-content">
      <h2>Level {{ playerLevel }} Reached!</h2>
      <p>Choose an upgrade (Press <KeyPrompt>1</KeyPrompt>-<KeyPrompt>{{ availableSkills.length }}</KeyPrompt> or click):</p>

      <div class="skill-selection">
        <div
          v-for="(skill, index) in availableSkills"
          :key="skill.id"
          class="skill-option"
          @click="selectSkill(skill)"
        >
          <div class="key-indicator">
            <span class="key-number">{{ index + 1 }}</span>
          </div>
          <div class="skill-icon">{{ skill.icon }}</div>
          <div class="skill-details">
            <h3>{{ skill.name }} (Level {{ skill.level + 1 }})</h3>
            <p>{{ skill.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import type { Skill } from '../../utils/gameModels';
import KeyPrompt from '../UI/KeyPrompt.vue';

interface Props {
  playerLevel: number;
  availableSkills: Skill[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  confirmLevelUp: [skill: Skill]
}>();

const selectSkill = (skill: Skill) => {
  // Immediately confirm the selection without requiring a continue button
  emit('confirmLevelUp', skill);
};

// Handle keyboard events for direct skill selection
const handleKeyDown = (event: KeyboardEvent) => {
  const keyNumber = parseInt(event.key);

  // Check if the key is a number from 1 to the number of available skills
  if (keyNumber >= 1 && keyNumber <= props.availableSkills.length) {
    const selectedSkill = props.availableSkills[keyNumber - 1];
    selectSkill(selectedSkill);
  }
};

// Add keyboard listener when component mounts
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

// Remove keyboard listener when component unmounts
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.level-up-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 15px;
  padding: 20px;
  color: white;
  text-align: center;
  pointer-events: auto;
  width: 80%;
  max-width: 600px;
  z-index: 100;
}

.level-up-content {
  background-color: rgba(30, 30, 50, 0.95);
  padding: 30px;
  border-radius: 15px;
  border: 2px solid #3498db;
  box-shadow: 0 0 20px rgba(52, 152, 219, 0.5);
}

.level-up-content h2 {
  color: #3498db;
  margin-bottom: 20px;
  font-size: 2rem;
}

.level-up-content p {
  margin-bottom: 20px;
  color: #ffffff;
  font-size: 1.1rem;
}

.skill-selection {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.skill-option {
  display: flex;
  background-color: rgba(52, 152, 219, 0.2);
  border: 2px solid rgba(52, 152, 219, 0.5);
  border-radius: 10px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  align-items: center;
  position: relative;
}

.skill-option:hover {
  background-color: rgba(52, 152, 219, 0.4);
  transform: scale(1.02);
}

.key-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(145deg, #f0f0f0, #d0d0d0);
  color: #333;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow:
    0 3px 6px rgba(0, 0, 0, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.8),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2);
  border: 1px solid #bbb;
  transition: all 0.2s ease;
  z-index: 10;
}

.key-number {
  font-size: 14px;
  font-weight: bold;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);
}

.skill-option:hover .key-indicator {
  background: linear-gradient(145deg, #fff, #e0e0e0);
  transform: translateY(-1px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.5),
    inset 0 1px 2px rgba(255, 255, 255, 0.9),
    inset 0 -1px 2px rgba(0, 0, 0, 0.1);
}

.skill-icon {
  font-size: 30px;
  margin-right: 15px;
}

.skill-details {
  text-align: left;
  flex: 1;
}

.skill-details h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  color: #ffffff;
}

.skill-details p {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
  color: #cccccc;
}
</style>
