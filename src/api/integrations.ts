export function deprecatedLog360ApiNotice(): void {
  // Path A is deprecated: frontend Log360 data now comes from in-browser evidence collection.
  console.warn('log360Api is deprecated. Use evidence collection from Connections sync.');
}
