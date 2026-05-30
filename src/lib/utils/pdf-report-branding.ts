import type { jsPDF } from 'jspdf'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QRCodeSVG } from 'qrcode.react'

import { SAMANVI_LOGO_URL } from '@/lib/branding'

const LOGO_MAX_HEIGHT_MM = 12
const LOGO_MAX_WIDTH_MM = 48
const QR_SIZE_MM = 28
const QR_PIXEL_SIZE = 256

function loadImageAsDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Failed to render image for PDF.'))
        return
      }
      context.drawImage(image, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = () => reject(new Error('Failed to load image for PDF.'))
    image.src = url
  })
}

function ensureSvgNamespace(svgMarkup: string): string {
  if (svgMarkup.includes('xmlns=')) return svgMarkup
  return svgMarkup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
}

export async function createQrDataUrl(value: string): Promise<string> {
  const svgMarkup = ensureSvgNamespace(
    renderToStaticMarkup(createElement(QRCodeSVG, { value, size: QR_PIXEL_SIZE, marginSize: 1 })),
  )
  const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
  const objectUrl = URL.createObjectURL(svgBlob)

  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = QR_PIXEL_SIZE
      canvas.height = QR_PIXEL_SIZE
      const context = canvas.getContext('2d')
      URL.revokeObjectURL(objectUrl)
      if (!context) {
        reject(new Error('Failed to render QR code for PDF.'))
        return
      }
      context.drawImage(image, 0, 0, QR_PIXEL_SIZE, QR_PIXEL_SIZE)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to render QR code for PDF.'))
    }
    image.src = objectUrl
  })
}

type PdfReportHeaderOptions = {
  doc: jsPDF
  margin: number
  pageWidth: number
  title: string
  subtitle: string
  y: number
}

export async function drawPdfReportHeader(options: PdfReportHeaderOptions): Promise<number> {
  const { doc, margin, pageWidth, title, subtitle } = options
  let y = options.y

  const logoDataUrl = await loadImageAsDataUrl(SAMANVI_LOGO_URL)
  const logoProps = doc.getImageProperties(logoDataUrl)
  const imageFormat = logoProps.fileType?.toUpperCase() === 'JPEG' ? 'JPEG' : 'PNG'
  const aspectRatio = logoProps.width / logoProps.height
  let logoHeight = LOGO_MAX_HEIGHT_MM
  let logoWidth = logoHeight * aspectRatio

  if (logoWidth > LOGO_MAX_WIDTH_MM) {
    logoWidth = LOGO_MAX_WIDTH_MM
    logoHeight = logoWidth / aspectRatio
  }

  doc.addImage(logoDataUrl, imageFormat, margin, y, logoWidth, logoHeight)

  const textX = pageWidth - margin
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(17, 24, 39)
  doc.text(title, textX, y + 4, { align: 'right' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text(subtitle, textX, y + 10, { align: 'right' })

  y += Math.max(logoHeight, 14) + 4
  doc.setDrawColor(209, 213, 219)
  doc.line(margin, y, pageWidth - margin, y)

  return y + 8
}

type PdfQrSectionOptions = {
  doc: jsPDF
  margin: number
  pageWidth: number
  contentWidth: number
  url: string
  y: number
}

export async function drawPdfQrSection(options: PdfQrSectionOptions): Promise<number> {
  const { doc, margin, pageWidth, contentWidth, url } = options
  let y = options.y

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(234, 88, 12)
  doc.text('SCAN TO VIEW JOB', margin, y)
  doc.setDrawColor(209, 213, 219)
  doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5)
  y += 8

  const qrDataUrl = await createQrDataUrl(url)
  const qrX = margin
  doc.addImage(qrDataUrl, 'PNG', qrX, y, QR_SIZE_MM, QR_SIZE_MM)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(75, 85, 99)
  const urlLines = doc.splitTextToSize(url, contentWidth - QR_SIZE_MM - 6)
  doc.text(urlLines, qrX + QR_SIZE_MM + 6, y + 6)

  return y + QR_SIZE_MM + 8
}
