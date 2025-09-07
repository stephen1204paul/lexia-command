// Debug script to test search functionality
const { searchCommands } = require('./src/js/commands/index.js');
const { coreCommands } = require('./src/js/commands/core.js');

// Mock WordPress globals for this test
global.window = {
  lexiaCommandData: {
    userCaps: {
      manage_options: true,
      edit_posts: true,
      edit_pages: true,
    }
  }
};

console.log('=== DEBUGGING SEARCH FOR "theme" ===\n');

// First, let's see what the customize theme command looks like
const customizeCommand = coreCommands.find(c => c.id === 'customize');
console.log('Customize Theme Command:');
console.log(JSON.stringify(customizeCommand, null, 2));
console.log('\n');

// Now let's test the search
console.log('Search results for "theme":');
const results = searchCommands('theme');
console.log(`Found ${results.length} results:`);
results.forEach((result, index) => {
  console.log(`${index + 1}. ${result.title} (ID: ${result.id})`);
  console.log(`   Keywords: ${result.keywords.join(', ')}`);
});

console.log('\n=== Testing different search terms ===');

const searchTerms = ['customize', 'appearance', 'theme', 'customiz'];
searchTerms.forEach(term => {
  const results = searchCommands(term);
  console.log(`\nSearch "${term}": ${results.length} results`);
  results.forEach(result => {
    if (result.id === 'customize') {
      console.log(`  ✓ Found Customize Theme command`);
    }
  });
});