/**
 * WordPress authentication helper for Playwright tests
 */

/**
 * Login to WordPress admin
 * @param {import('@playwright/test').Page} page
 * @param {string} username - WordPress username (default: 'admin')
 * @param {string} password - WordPress password (default: 'password')
 */
export async function loginToWordPress(page, username = 'admin', password = 'password') {
  // Navigate to WordPress login page
  await page.goto('/wp-login.php');
  
  // Fill in login credentials
  await page.fill('#user_login', username);
  await page.fill('#user_pass', password);
  
  // Submit the login form
  await page.click('#wp-submit');
  
  // Wait for redirect to admin dashboard
  await page.waitForURL('**/wp-admin/**');
}

/**
 * Logout from WordPress
 * @param {import('@playwright/test').Page} page
 */
export async function logoutFromWordPress(page) {
  // Navigate to admin and hover over user menu to reveal logout link
  await page.goto('/wp-admin/');
  await page.hover('#wpadminbar .display-name');
  await page.click('#wp-admin-bar-logout a');
  
  // Wait for logout confirmation
  await page.waitForURL('**/wp-login.php**');
}

/**
 * Check if user is logged in to WordPress
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>}
 */
export async function isLoggedIn(page) {
  await page.goto('/wp-admin/');
  
  // If redirected to login page, user is not logged in
  const currentUrl = page.url();
  return !currentUrl.includes('wp-login.php');
}

/**
 * Navigate to WordPress admin and ensure user is logged in
 * @param {import('@playwright/test').Page} page
 * @param {string} username
 * @param {string} password
 */
export async function ensureLoggedIn(page, username = 'admin', password = 'password') {
  if (!(await isLoggedIn(page))) {
    await loginToWordPress(page, username, password);
  }
  await page.goto('/wp-admin/');
}