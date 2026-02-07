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
        await page.waitForTimeout(2000);

        // Check if we're on the login page
        const currentUrl = page.url();
        if (currentUrl.includes('/login.html') || !await page.isVisible('#login', { timeout: 5000 })) {
            console.log('Already logged in or on a different page, proceeding...');
        } else {
            console.log('On login page, filling credentials...');
            // Fill in login and password (default admin/gknzo123)
            await page.fill('#login', 'admin');
            await page.fill('#password', 'gknzo123');

            // Click the login button
            await page.click('button[type="submit"]');
            
            // Wait for navigation to main page after login
            await page.waitForURL('http://localhost:3000/**', { timeout: 10000 });
            console.log('Logged in successfully');
        }

        // Wait for the page to load completely
        await page.waitForTimeout(3000);

        // Take screenshot of the main page after login
        await page.screenshot({
            path: 'main_page_after_login.png',
            fullPage: true
        });
        console.log('Screenshot of main page saved as main_page_after_login.png');

        // Check if we're in the sheets view and need to go to director mode
        // Look for the "Директор" button in the bottom navigation
        console.log('Looking for Director mode button...');
        
        // Wait for the bottom navigation to appear
        await page.waitForSelector('.fixed.bottom-0 button', { timeout: 10000 });
        
        // Get all buttons in the bottom navigation
        const navButtons = await page.$$('.fixed.bottom-0 button');
        console.log(`Found ${navButtons.length} navigation buttons in the bottom bar`);
        
        // Look for the "Директор" button specifically
        let directorButton = null;
        for (const button of navButtons) {
            const buttonText = await button.textContent();
            console.log(`Navigation button text: "${buttonText}"`);
            if (buttonText && (buttonText.includes('Директор') || buttonText.includes('eye'))) {
                directorButton = button;
                break;
            }
        }
        
        if (!directorButton) {
            // Alternative: Look for the button with onclick="selectDirectorView()"
            directorButton = await page.$('button[onclick*="selectDirectorView"]');
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
        }

        // Check for Agentation toolbar
        console.log('Checking for Agentation toolbar...');
        const agentationExists = await page.$('agentation-component') !== null;
        if (agentationExists) {
            console.log('Agentation toolbar found on the page!');
        } else {
            console.log('Agentation toolbar NOT found on the page.');
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