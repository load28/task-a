// Legacy entry point retains its filename, but cannot start an unbounded CLI or
// resume a previous model session. All context comes from a single live grant.
if(process.argv.slice(2).length)throw new Error("Model prompts must be supplied through a controller-issued context manifest")
await import("./granted-instance-stage.ts")
