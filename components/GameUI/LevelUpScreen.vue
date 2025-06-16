<template>
  <div class="level-up-overlay">
    <div class="level-up-content">
      <h2>Level {{ playerLevel }} Reached!</h2>
      <p>Choose an upgrade to continue:</p>

      <div class="skill-selection">
        <div
          v-for="skill in availableSkills"
          :key="skill.id"
          class="skill-option"
          @click="selectSkill(skill)"
          :class="{ 'selected': selectedSkill && selectedSkill.id === skill.id }"
        >
          <div class="skill-icon">{{ skill.icon }}</div>
          <div class="skill-details">
            <h3>{{ skill.name }} (Level {{ skill.level + 1 }})</h3>
            <p>{{ skill.description }}</p>
          </div>
        </div>
      </div>

      <div class="level-up-confirmation">
        <button
          class="confirm-button"
          @click="confirmSelection"
          :disabled="!selectedSkill"
        >
          Continue
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Skill } from '../../utils/gameModels';

interface Props {
  playerLevel: number;
  availableSkills: Skill[];
}

defineProps<Props>();

const selectedSkill = ref<Skill | null>(null);

const emit = defineEmits<{
  confirmLevelUp: [skill: Skill]
}>();

const selectSkill = (skill: Skill) => {
  selectedSkill.value = skill;
};

const confirmSelection = () => {
  if (selectedSkill.value) {
    emit('confirmLevelUp', selectedSkill.value);
  }
};
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
}

.skill-option:hover {
  background-color: rgba(52, 152, 219, 0.4);
  transform: scale(1.02);
}

.skill-option.selected {
  background-color: rgba(46, 204, 113, 0.3);
  border-color: rgba(46, 204, 113, 0.8);
  box-shadow: 0 0 15px rgba(46, 204, 113, 0.5);
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

.level-up-confirmation {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.confirm-button {
  padding: 12px 25px;
  font-size: 18px;
  background-color: #2ecc71;
  color: white;
  border: none;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-button:hover:not(:disabled) {
  background-color: #27ae60;
  transform: scale(1.05);
}

.confirm-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
  transform: none;
}
</style>