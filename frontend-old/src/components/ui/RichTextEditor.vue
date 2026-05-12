<template>
  <div class="erp-rich-editor rounded-[5px] border border-slate-200/90 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95">
    <div class="erp-rich-editor__toolbar flex flex-wrap gap-2 border-b border-slate-200/90 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/95">
      <button type="button" class="erp-rich-editor__button" @click="runCommand('bold')">
        <i class="fa-solid fa-bold"></i>
      </button>
      <button type="button" class="erp-rich-editor__button" @click="runCommand('italic')">
        <i class="fa-solid fa-italic"></i>
      </button>
      <button type="button" class="erp-rich-editor__button" @click="runCommand('underline')">
        <i class="fa-solid fa-underline"></i>
      </button>
      <button type="button" class="erp-rich-editor__button" @click="runCommand('insertUnorderedList')">
        <i class="fa-solid fa-list-ul"></i>
      </button>
      <button type="button" class="erp-rich-editor__button" @click="runCommand('insertOrderedList')">
        <i class="fa-solid fa-list-ol"></i>
      </button>
      <button type="button" class="erp-rich-editor__button" @click="promptLink">
        <i class="fa-solid fa-link"></i>
      </button>
      <button type="button" class="erp-rich-editor__button" @click="clearFormatting">
        <i class="fa-solid fa-eraser"></i>
      </button>
    </div>

    <div
      ref="editorRef"
      class="erp-rich-editor__content"
      contenteditable="true"
      :data-placeholder="placeholder"
      @input="emitContent"
      @blur="emitContent"
    ></div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Write here...',
  },
})

const emit = defineEmits(['update:modelValue'])

const editorRef = ref(null)

const stripInlineColors = (root) => {
  if (!root) {
    return
  }

  root.querySelectorAll('*').forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return
    }

    if (node.hasAttribute('color')) {
      node.removeAttribute('color')
    }

    const style = node.getAttribute('style')

    if (!style) {
      return
    }

    const declarations = style
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((declaration) => {
        const property = declaration.split(':')[0]?.trim().toLowerCase()

        return !['color', 'background', 'background-color', '-webkit-text-fill-color'].includes(property)
      })

    if (declarations.length > 0) {
      node.setAttribute('style', declarations.join('; '))
      return
    }

    node.removeAttribute('style')
  })
}

const normalizeHtml = (value) => {
  const html = (value || '').trim()

  return html === '<p><br></p>' ? '' : html
}

const syncEditor = async (value) => {
  await nextTick()

  if (!editorRef.value) {
    return
  }

  const normalized = normalizeHtml(value)

  if (editorRef.value.innerHTML !== normalized) {
    editorRef.value.innerHTML = normalized
    stripInlineColors(editorRef.value)
  }
}

const emitContent = () => {
  if (!editorRef.value) {
    return
  }

  stripInlineColors(editorRef.value)
  emit('update:modelValue', normalizeHtml(editorRef.value.innerHTML))
}

const focusEditor = () => {
  editorRef.value?.focus()
}

const runCommand = (command, value = null) => {
  focusEditor()
  document.execCommand(command, false, value)
  emitContent()
}

const promptLink = () => {
  const url = window.prompt('Enter link URL')

  if (!url) {
    return
  }

  runCommand('createLink', url)
}

const clearFormatting = () => {
  focusEditor()
  document.execCommand('removeFormat', false)
  document.execCommand('unlink', false)
  emitContent()
}

watch(
  () => props.modelValue,
  async (value) => {
    await syncEditor(value)
  }
)

onMounted(async () => {
  await syncEditor(props.modelValue)
})
</script>

<style scoped>
.erp-rich-editor__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  border: 1px solid rgb(226 232 240 / 0.95);
  background: rgb(255 255 255 / 0.95);
  color: rgb(51 65 85);
  transition: all 0.18s ease;
}

.erp-rich-editor__button:hover {
  border-color: rgb(125 211 252 / 0.9);
  color: rgb(8 145 178);
}

.erp-rich-editor__content {
  min-height: 12rem;
  padding: 1rem;
  color: rgb(15 23 42);
  font-size: 0.925rem;
  line-height: 1.7;
  outline: none;
}

.erp-rich-editor__content :deep(*) {
  color: inherit;
}

.erp-rich-editor__content :deep(a) {
  color: rgb(8 145 178);
  text-decoration: underline;
}

.erp-rich-editor__content:empty::before {
  content: attr(data-placeholder);
  color: rgb(100 116 139);
}

.erp-rich-editor__content :deep(ul),
.erp-rich-editor__content :deep(ol) {
  padding-left: 1.25rem;
}

:global(.dark) .erp-rich-editor__button {
  border-color: rgb(30 41 59 / 0.95);
  background: rgb(2 6 23 / 0.72);
  color: rgb(226 232 240);
}

:global(.dark) .erp-rich-editor__button:hover {
  border-color: rgb(8 145 178 / 0.55);
  color: rgb(103 232 249);
}

:global(.dark) .erp-rich-editor__content {
  color: rgb(226 232 240);
}

:global(.dark) .erp-rich-editor__content :deep(*) {
  color: inherit !important;
}

:global(.dark) .erp-rich-editor__content :deep(a) {
  color: rgb(125 211 252) !important;
}

:global(.dark) .erp-rich-editor__content:empty::before {
  color: rgb(148 163 184);
}
</style>
