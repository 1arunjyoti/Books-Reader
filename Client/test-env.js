// Test environment variable loading
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('All NEXT_PUBLIC vars:');
Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC')).forEach(k => {
  console.log(`  ${k}: ${process.env[k]}`);
});
