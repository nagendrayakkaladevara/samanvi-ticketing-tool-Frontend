export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Unable to read the selected file.'))
        return
      }

      const base64 = reader.result.split(',')[1]
      if (!base64) {
        reject(new Error('Unable to encode the selected file.'))
        return
      }

      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Unable to read the selected file.'))
    reader.readAsDataURL(file)
  })
}

export function base64ToDataUrl(base64: string, mimeType = 'image/jpeg'): string {
  if (base64.startsWith('data:')) return base64
  return `data:${mimeType};base64,${base64}`
}
