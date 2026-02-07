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

        // Instead of looking for bottom navigation, let's look for the director button anywhere on the page
        console.log('Looking for Director mode button...');
        
        // Try multiple selectors for the director button
        let directorButton = null;
        
        // Try selector for the button with onclick="selectDirectorView()"
        directorButton = await page.$('button[onclick*="selectDirectorView"]');
        
        if (!directorButton) {
            // Try selector for button with text "Директор"
            directorButton = await page.$('button:text("Директор"), button:has-text("Директор")');
        }
        
        if (!directorButton) {
            // Try selector for button with eye icon and "Директор" text
            directorButton = await page.$('button:has(i[data-lucide="eye"])');
        }
        
        if (!directorButton) {
            // Try selector for the specific button in the navigation
            directorButton = await page.$('.fixed.bottom-0 button:has-text("Директор")');
        }
        
        if (!directorButton) {
            // Try selector for the button in the dept selector
            directorButton = await page.$('button:has-text("Режим директора")');
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
        await page.waitForTimeout(2000); // Give time for any dynamic content to load
        
        // Check if agentation component exists
        const agentationComponent = await page.$('agentation-component');
        if (agentationComponent) {
            console.log('Agentation component found on the page!');
        } else {
            console.log('Agentation component NOT found on the page.');
        }
        
        // Look for any elements that might be related to Agentation
        const agentationSelectors = [
            'agentation-component',
            '[data-agentation]',
            '.agentation',
            '*[id*="agentation" i]',
            '*[class*="agentation" i]'
        ];
        
        for (const selector of agentationSelectors) {
            const elements = await page.$$(selector);
            if (elements.length > 0) {
                console.log(`Found ${elements.length} element(s) matching selector: ${selector}`);
            }
        }
        
        // Check if the Agentation script was loaded by looking at the DOM
        const agentationScriptLoaded = await page.evaluate(() => {
            // Check for the agentation script tag
            const scriptTags = Array.from(document.querySelectorAll('script'));
            const hasAgentationScript = scriptTags.some(script => 
                script.src && script.src.includes('agentation')
            );
            
            // Check for the agentation component in the DOM
            const hasAgentationComponent = document.querySelector('agentation-component') !== null;
            
            // Check for any agentation-related globals
            const hasAgentationGlobal = typeof window.Agentation !== 'undefined';
            
            return {
                hasScript: hasAgentationScript,
                hasComponent: hasAgentationComponent,
                hasGlobal: hasAgentationGlobal
            };
        });
        
        console.log('Agentation detection results:', agentationScriptLoaded);
        
        if (agentationScriptLoaded.hasComponent || agentationScriptLoaded.hasScript) {
            console.log('SUCCESS: Agentation toolbar IS present in the interface!');
        } else {
            console.log('RESULT: Agentation toolbar is NOT present in the interface.');
            
            // Check if we're in development mode (localhost) which should conditionally load Agentation
            const isLocalhost = await page.evaluate(() => {
                return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
            });
            
            if (isLocalhost) {
                console.log('Note: You are on localhost, but Agentation was not loaded. This might be due to:');
                console.log('1. The Agentation library not being properly initialized');
                console.log('2. A timing issue where the component hasn\'t loaded yet');
                console.log('3. An error in the Agentation initialization code');
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