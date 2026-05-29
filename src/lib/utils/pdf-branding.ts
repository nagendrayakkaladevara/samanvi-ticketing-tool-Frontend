import type { jsPDF } from 'jspdf'

import { SAMANVI_LOGO_URL } from '@/lib/branding'

const LOGO_WIDTH_MM = 28
const LOGO_HEIGHT_MM = 10

let logoDataUrlCache: string | null = null

async function loadSamanviLogoDataUrl(): Promise<string> {
  if (logoDataUrlCache) return logoDataUrlCache

  const response = await fetch(SAMANVI_LOGO_URL)
  if (!response.ok) {
    throw new Error('Failed to load Samanvi logo.')
  }

  const blob = await response.blob()
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read Samanvi logo.'))
    reader.readAsDataURL(blob)
  })

  logoDataUrlCache = dataUrl
  return dataUrl
}

type AddPdfLogoOptions = {
  pageWidth: number
  margin: number
  y: number
}

export async function addSamanviLogoToPdf(
  doc: jsPDF,
  { pageWidth, margin, y }: AddPdfLogoOptions,
): Promise<void> {
  const logoDataUrl = await loadSamanviLogoDataUrl()
  const logoX = pageWidth - margin - LOGO_WIDTH_MM
  doc.addImage(logoDataUrl, 'PNG', logoX, y, LOGO_WIDTH_MM, LOGO_HEIGHT_MM)
}

export const PDF_LOGO_HEIGHT_MM = LOGO_HEIGHT_MM
