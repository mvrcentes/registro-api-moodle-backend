export type MulterLikePart = {
  file?: NodeJS.ReadableStream
  filename?: string
  mimetype?: string
  encoding?: string
  // Cuando attachFieldsToBody: true, @fastify/multipart provee toBuffer()
  toBuffer?: () => Promise<Buffer>
}

export type MulterLikePartOneOrMany = MulterLikePart | MulterLikePart[]
