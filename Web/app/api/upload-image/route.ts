import { v2 as cloudinary } from 'cloudinary'
import { NextRequest, NextResponse } from 'next/server'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const recordId = formData.get('recordId') as string

    // Validation
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
      }, { status: 400 })
    }

    console.log(`🔥 Uploading ${file.name} (${file.size} bytes) for user ${userId}`)

    // Convert File to Buffer for Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary using upload_stream for buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({
        public_id: `images/${userId}/${recordId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
        resource_type: 'image',
        folder: `user_uploads/${userId}`
      }, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
      uploadStream.end(buffer)
    })

    console.log('✅ Upload successful:', result.secure_url)

    return NextResponse.json({
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    })

  } catch (error) {
    console.error('❌ Upload error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown upload error'

    return NextResponse.json({
      error: 'Upload failed',
      details: errorMessage
    }, { status: 500 })
  }
}