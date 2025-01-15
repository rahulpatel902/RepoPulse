export function GridPattern() {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full bg-background">
      <svg
        className="absolute h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid-pattern"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" className="fill-primary/20" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />

      {/* Gradient Blobs */}
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[60vh] w-[80vw] rounded-full bg-primary/20 opacity-20 blur-[100px]" />
      <div className="absolute bottom-20 left-20 -z-10 h-[40vh] w-[40vw] rounded-full bg-primary/30 opacity-20 blur-[100px]" />
      <div className="absolute bottom-20 right-20 -z-10 h-[40vh] w-[40vw] rounded-full bg-primary/25 opacity-20 blur-[100px]" />
    </div>
  );
}
