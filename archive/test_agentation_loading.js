const { chromium } = require('playwright');

(async () => {
    // Launch browser in headless mode
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        // Set viewport size for better screenshots
        await page.setViewportSize({ width: 1280, height: 800 });

        console.log('Navigating to the application...');
        // Navigate to the main page
        await page.goto('http://localhost:3000');

        // Wait for the page to load
        await page.waitForTimeout(3000);

        // Log current URL and title
        const currentUrl = page.url();
        const title = await page.title();
        console.log(`Current URL: ${currentUrl}`);
        console.log(`Page title: ${title}`);

        // Check if we're on the login page
        if (currentUrl.includes('/login.html') || await page.isVisible('#login', { timeout: 5000 })) {
            console.log('On login page, filling credentials...');
            // Fill in login and password (default admin/gknzo123)
            await page.fill('#login', 'admin');
            await page.fill('#password', 'gknzo123');

            // Click the login button
            await page.click('button[type="submit"]');

            // Wait for navigation to main page after login
            await page.waitForURL('http://localhost:3000/**', { timeout: 10000 });
            console.log('Logged in successfully');
            
            // Wait for the page to load completely after login
            await page.waitForTimeout(3000);
        } else {
            console.log('Already logged in or on a different page, proceeding...');
            // Wait for the page to load completely
            await page.waitForTimeout(3000);
        }

        // Take screenshot of the main page after login
        await page.screenshot({
            path: 'main_page_after_login.png',
            fullPage: true
        });
        console.log('Screenshot of main page saved as main_page_after_login.png');

        // Log current URL again to see where we are
        const currentUrlAfterLogin = await page.url();
        console.log(`Current URL after potential login: ${currentUrlAfterLogin}`);

        // Look for the "Директор" button - could be in bottom navigation or elsewhere
        console.log('Looking for Director mode button...');

        // Wait for any of the possible selectors to appear
        await page.waitForTimeout(3000);
        
        // Try multiple selectors for the director button
        let directorButton = null;
        
        // Try selector for the button with onclick="selectDirectorView()"
        directorButton = await page.$('button[onclick*="selectDirectorView"]');
        console.log('Checked for onclick="selectDirectorView" button');

        if (!directorButton) {
            // Try selector for button with text "Директор"
            directorButton = await page.$('button:text("Директор"), button:has-text("Директор")');
            console.log('Checked for button with text "Директор"');
        }

        if (!directorButton) {
            // Try selector for button with eye icon and "Директор" text
            directorButton = await page.$('button:has(i[data-lucide="eye"])');
            console.log('Checked for button with eye icon');
        }

        if (!directorButton) {
            // Try selector for the specific button in the navigation
            directorButton = await page.$('.fixed.bottom-0.left-0.right-0 button:has-text("Директор")');
            console.log('Checked for director button in bottom navigation');
        }

        if (!directorButton) {
            // Try selector for the button in the dept selector
            directorButton = await page.$('button:has-text("Режим директора")');
            console.log('Checked for "Режим директора" button');
        }

        if (!directorButton) {
            // Try to find any button containing the word "Директор"
            const allButtons = await page.$$('button');
            console.log(`Found ${allButtons.length} buttons on the page`);
            for (const button of allButtons) {
                const buttonText = await button.textContent();
                console.log(`Button text: "${buttonText}"`);
                if (buttonText && buttonText.includes('Директор')) {
                    directorButton = button;
                    break;
                }
            }
        }

        if (directorButton) {
            console.log('Clicking Director mode button...');
            await directorButton.click();
            await page.waitForTimeout(3000);

            // Take screenshot of the director mode interface
            await page.screenshot({
                path: 'director_mode_screenshot.png',
                fullPage: true
            });
            console.log('Screenshot of director mode saved as director_mode_screenshot.png');
            
            // Check for Agentation toolbar in director mode
            console.log('Checking for Agentation toolbar in director mode...');
            const agentationExists = await page.$('agentation-component') !== null;
            if (agentationExists) {
                console.log('Agentation toolbar found in director mode!');
                
                // Take additional screenshot showing the Agentation toolbar
                await page.screenshot({
                    path: 'director_mode_with_agentation.png',
                    fullPage: true
                });
                console.log('Screenshot of director mode with Agentation saved as director_mode_with_agentation.png');
            } else {
                console.log('Agentation toolbar NOT found in director mode.');
            }

            // Additional check: look for any elements related to Agentation
            const agentationElements = await page.$$('.agentation, [id*="agentation"], [class*="agentation"]');
            console.log(`Found ${agentationElements.length} elements that might be related to Agentation`);

            // Check if the Agentation script was loaded
            const agentationScriptLoaded = await page.evaluate(() => {
                return typeof window.Agentation !== 'undefined' ||
                       document.querySelector('script[src*="agentation"]') !== null;
            });
            console.log(`Agentation script loaded: ${agentationScriptLoaded}`);
        } else {
            console.log('Director mode button not found, trying alternative method...');
            // Try calling the function directly
            await page.evaluate(() => {
                if (typeof selectDirectorView === 'function') {
                    selectDirectorView();
                } else {
                    console.log('Function selectDirectorView not found');
                }
            });
            await page.waitForTimeout(3000);

            // Take screenshot of the director mode interface
            await page.screenshot({
                path: 'director_mode_screenshot.png',
                fullPage: true
            });
            console.log('Screenshot of director mode saved as director_mode_screenshot.png');
            
            // Check for Agentation toolbar in director mode
            console.log('Checking for Agentation toolbar in director mode...');
            const agentationExists = await page.$('agentation-component') !== null;
            if (agentationExists) {
                console.log('Agentation toolbar found in director mode!');
                
                // Take additional screenshot showing the Agentation toolbar
                await page.screenshot({
                    path: 'director_mode_with_agentation.png',
                    fullPage: true
                });
                console.log('Screenshot of director mode with Agentation saved as director_mode_with_agentation.png');
            } else {
                console.log('Agentation toolbar NOT found in director mode.');
            }
        }

        // Final screenshot showing the complete interface
        await page.screenshot({
            path: 'final_interface_screenshot.png',
            fullPage: true
        });
        console.log('Final screenshot saved as final_interface_screenshot.png');

        console.log('Playwright automation completed successfully!');

    } catch (error) {
        console.error('Error during Playwright automation:', error);

        // Take a debug screenshot in case of error
        try {
            await page.screenshot({
                path: 'debug_screenshot.png'
            });
            console.log('Debug screenshot saved as debug_screenshot.png');
        } catch (screenshotError) {
            console.error('Error taking debug screenshot:', screenshotError);
        }
    } finally {
        // Close the browser
        await browser.close();
        console.log('Browser closed');
    }
})();