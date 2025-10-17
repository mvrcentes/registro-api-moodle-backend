export type MulterLikePart = {
  file?: NodeJS.ReadableStream
  filename?: string
  mimetype?: string
  encoding?: string
}

export type MulterLikePartOneOrMany = MulterLikePart | MulterLikePart[]
