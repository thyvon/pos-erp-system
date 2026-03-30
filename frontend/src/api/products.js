import api from './axios'

export const getProducts = (params = {}) => api.get('/products', { params })
export const getProduct = (id) => api.get(`/products/${id}`)
export const getProductFormOptions = () => api.get('/products/form-options')
export const deleteProduct = (id) => api.delete(`/products/${id}`)

const appendFormValue = (formData, key, value) => {
  if (value === undefined) {
    return
  }

  if (value === null) {
    formData.append(key, '')
    return
  }

  if (typeof value === 'boolean') {
    formData.append(key, value ? '1' : '0')
    return
  }

  formData.append(key, value)
}

const toMultipartPayload = (payload, method = 'POST') => {
  const formData = new FormData()

  if (method !== 'POST') {
    formData.append('_method', method)
  }

  const {
    variations = [],
    combo_items = [],
    variation_template_ids = [],
    custom_fields = {},
    image_file,
    ...rest
  } = payload

  Object.entries(rest).forEach(([key, value]) => appendFormValue(formData, key, value))

  if (image_file instanceof File) {
    formData.append('image_file', image_file)
  }

  formData.append('variation_template_ids', JSON.stringify(variation_template_ids || []))
  formData.append('variations', JSON.stringify(
    variations.map(({ image_file: variationImageFile, image_url, ...variation }) => variation)
  ))
  formData.append('combo_items', JSON.stringify(combo_items || []))
  formData.append('custom_fields', JSON.stringify(custom_fields || {}))

  variations.forEach((variation, index) => {
    if (variation.image_file instanceof File) {
      formData.append(`variation_image_files[${index}]`, variation.image_file)
    }
  })

  return formData
}

export const createProduct = (payload) =>
  api.post('/products', toMultipartPayload(payload), {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

export const updateProduct = (id, payload) =>
  api.post(`/products/${id}`, toMultipartPayload(payload, 'PUT'), {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
