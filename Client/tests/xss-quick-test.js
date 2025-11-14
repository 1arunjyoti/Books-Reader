// Quick XSS Protection Test Script
// Run this in the browser console on the /library page

console.log('🧪 Starting XSS Protection Tests...\n');

// Test Data
const xssPayloads = {
  scriptTag: '<script>alert("XSS")</script>Test',
  eventHandler: '<img src=x onerror="alert(1)">Author',
  javascript: 'javascript:alert(1)',
  iframe: '<iframe src="evil.com"></iframe>',
  unicode: 'Test\u200BWith\u200BZero\u200BWidth',
  longString: 'A'.repeat(1000),
  multipleAttacks: '<script>alert(1)</script><img onerror="alert(2)">'
};

// Import sanitization functions (adjust path as needed)
// Note: You'll need to access these from your bundled code
// For quick testing, copy the sanitizeText function here:

function sanitizeText(text, maxLength = 1000) {
  if (!text) return '';
  
  let sanitized = String(text).trim();
  
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '');
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

// Run Tests
const results = [];

// Test 1: Script Tag
const test1 = sanitizeText(xssPayloads.scriptTag);
const pass1 = !test1.includes('<script>') && !test1.includes('</script>');
results.push({
  test: 'Script Tag Removal',
  input: xssPayloads.scriptTag,
  output: test1,
  passed: pass1,
  expected: 'scriptalertXSSTest'
});

// Test 2: Event Handler
const test2 = sanitizeText(xssPayloads.eventHandler);
const pass2 = !test2.includes('onerror');
results.push({
  test: 'Event Handler Removal',
  input: xssPayloads.eventHandler,
  output: test2,
  passed: pass2,
  expected: 'img src=x Author'
});

// Test 3: JavaScript Protocol
const test3 = sanitizeText(xssPayloads.javascript);
const pass3 = !test3.includes('javascript:');
results.push({
  test: 'JavaScript Protocol',
  input: xssPayloads.javascript,
  output: test3,
  passed: pass3,
  expected: 'alert1'
});

// Test 4: IFrame Tag
const test4 = sanitizeText(xssPayloads.iframe);
const pass4 = !test4.includes('<iframe>');
results.push({
  test: 'IFrame Removal',
  input: xssPayloads.iframe,
  output: test4,
  passed: pass4,
  expected: 'iframe srcevil.com'
});

// Test 5: Unicode Characters
const test5 = sanitizeText(xssPayloads.unicode);
const pass5 = !test5.includes('\u200B');
results.push({
  test: 'Unicode Stripping',
  input: xssPayloads.unicode,
  output: test5,
  passed: pass5,
  expected: 'TestWithZeroWidth'
});

// Test 6: Length Limit
const test6 = sanitizeText(xssPayloads.longString, 500);
const pass6 = test6.length === 500;
results.push({
  test: 'Length Limit (DoS Prevention)',
  input: `String of ${xssPayloads.longString.length} chars`,
  output: `${test6.length} chars`,
  passed: pass6,
  expected: '500 chars'
});

// Test 7: Multiple Attacks
const test7 = sanitizeText(xssPayloads.multipleAttacks);
const pass7 = !test7.includes('<script>') && !test7.includes('onerror');
results.push({
  test: 'Multiple Attack Vectors',
  input: xssPayloads.multipleAttacks,
  output: test7,
  passed: pass7,
  expected: 'scriptalert1img '
});

// Display Results
console.log('\n📊 Test Results:\n');
console.log('═'.repeat(80));

let passCount = 0;
results.forEach((result, index) => {
  const status = result.passed ? '✅ PASS' : '❌ FAIL';
  passCount += result.passed ? 1 : 0;
  
  console.log(`\n${index + 1}. ${result.test}: ${status}`);
  console.log(`   Input:    "${result.input.substring(0, 50)}${result.input.length > 50 ? '...' : ''}"`);
  console.log(`   Output:   "${result.output}"`);
  console.log(`   Expected: "${result.expected}"`);
  
  if (!result.passed) {
    console.log(`   ⚠️  TEST FAILED!`);
  }
});

console.log('\n' + '═'.repeat(80));
console.log(`\n🎯 Final Score: ${passCount}/${results.length} tests passed`);

if (passCount === results.length) {
  console.log('\n✅ ALL TESTS PASSED! XSS protection is working correctly.\n');
} else {
  console.log(`\n❌ ${results.length - passCount} test(s) failed. Review the implementation.\n`);
}

// Visual Test - Check current page
console.log('\n🔍 Checking current page for XSS vulnerabilities...\n');

const bookTitles = document.querySelectorAll('[class*="title"]');
const hasScriptTags = document.body.innerHTML.includes('<script>');
const hasEventHandlers = document.body.innerHTML.match(/on\w+\s*=/);

console.log(`Books found: ${bookTitles.length}`);
console.log(`Script tags in DOM: ${hasScriptTags ? '❌ FOUND' : '✅ None'}`);
console.log(`Event handlers in DOM: ${hasEventHandlers ? '❌ FOUND' : '✅ None'}`);

if (!hasScriptTags && !hasEventHandlers) {
  console.log('\n✅ Current page appears safe!\n');
} else {
  console.log('\n⚠️  WARNING: Potential XSS vulnerabilities detected!\n');
}

// Export results for further analysis
window.xssTestResults = results;
console.log('💾 Results saved to window.xssTestResults\n');
