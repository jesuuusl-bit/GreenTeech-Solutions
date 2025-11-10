describe('Health Check', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should have environment variables loaded', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
