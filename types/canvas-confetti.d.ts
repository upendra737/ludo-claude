declare module 'canvas-confetti' {
  interface Options {
    particleCount?: number
    spread?: number
    origin?: { x?: number; y?: number }
    colors?: string[]
    scalar?: number
  }
  function confetti(options?: Options): Promise<null> | null
  export = confetti
}
