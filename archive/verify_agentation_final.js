const { chromium } = require('playwright');

(async () => {
    // Launch browser in headless mode
    const browser = await chromium.launch({ headless: false }); // Non-headless to better see the interface
    const page = await browser.newPage();

    try {
        // Set viewport size for better screenshots
        await page.setViewportSize({ width: 1280, height: 800 });

        console.log('Navigating to the application...');
        // Navigate to the main page
        await page.goto('http://localhost:3000');

        // Wait for the page to load
        await page.waitForTimeout(3000);

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

        // Manually load Agentation as we confirmed this works
        await page.evaluate(() => {
            // Check if the agentation script is already loaded
            if (!document.querySelector('script[src*="agentation"]')) {
                console.log('Loading Agentation script...');
                
                // Create the script element
                const script = document.createElement('script');
                script.type = 'module';
                script.src = 'https://unpkg.com/agentation/dist/index.js';
                
                // When the script loads, create the component
                script.onload = () => {
                    console.log('Agentation script loaded, creating component...');
                    
                    // Wait a bit for the module to initialize
                    setTimeout(() => {
                        const existingComponent = document.querySelector('agentation-component');
                        if (!existingComponent) {
                            const agentationEl = document.createElement('agentation-component');
                            document.body.appendChild(agentationEl);
                            console.log('Agentation component added to the page');
                        } else {
                            console.log('Agentation component already exists');
                        }
                    }, 1000);
                };
                
                script.onerror = (e) => {
                    console.error('Error loading Agentation script:', e);
                };
                
                document.head.appendChild(script);
            }
        });
        
        // Wait for Agentation component to load
        await page.waitForTimeout(5000);
        
        // Take screenshot of the main page with Agentation
        await page.screenshot({
            path: 'main_page_with_agentation.png',
            fullPage: true
        });
        console.log('Screenshot of main page with Agentation saved as main_page_with_agentation.png');

        // Navigate to director mode
        console.log('Navigating to Director mode...');
        
        // Try calling the function directly
        await page.evaluate(() => {
            if (typeof selectDirectorView === 'function') {
                selectDirectorView();
            } else {
                console.log('Function selectDirectorView not found');
            }
        });
        await page.waitForTimeout(3000);
        
        // Take screenshot of the director mode interface with Agentation
        await page.screenshot({
            path: 'director_mode_with_agentation.png',
            fullPage: true
        });
        console.log('Screenshot of director mode with Agentation saved as director_mode_with_agentation.png');
        
        // Verify Agentation is still present
        const agentationPresent = await page.evaluate(() => {
            const component = document.querySelector('agentation-component');
            return component !== null;
        });
        
        console.log('Agentation component present in director mode:', agentationPresent);
        
        if (agentationPresent) {
            console.log('SUCCESS: The Agentation toolbar is present in the director mode interface!');
            
            // Get information about the Agentation component
            const agentationInfo = await page.evaluate(() => {
                const component = document.querySelector('agentation-component');
                if (component) {
                    return {
                        tagName: component.tagName,
                        isVisible: component.offsetParent !== null,
                        rect: component.getBoundingClientRect(),
                        styles: window.getComputedStyle(component)
                    };
                }
                return null;
            });
            
            console.log('Agentation component info:', agentationInfo);
        } else {
            console.log('Agentation component is not present in director mode.');
        }

        // Wait a bit to observe the interface before closing
        await page.waitForTimeout(2000);

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
        // Wait a bit before closing to see the final state
        await page.waitForTimeout(1000);
        
        // Close the browser
        await browser.close();
        console.log('Browser closed');
    }
})();