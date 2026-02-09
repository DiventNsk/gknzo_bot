const { chromium } = require('playwright');

async function testApp() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleMessages = [];
    const errors = [];

    page.on('console', msg => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            location: msg.location()
        });
    });

    page.on('pageerror', err => {
        errors.push(err.message);
    });

    try {
        console.log('Opening app...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });

        console.log('Page loaded. Waiting for content...');

        const currentUrl = page.url();
        console.log('Current URL:', currentUrl);

        if (currentUrl.includes('/login')) {
            console.log('On login page. Logging in...');
            await page.fill('input[type="text"], input[name="username"], input[id*="login"]', 'admin');
            await page.fill('input[type="password"], input[name="password"], input[id*="pass"]', 'gknzo123');
            await page.click('button[type="submit"]');
            await page.waitForTimeout(2000);
        }

        await page.waitForTimeout(2000);

        const title = await page.title();
        console.log('Page title:', title);

        const h1Element = await page.$('h1[role="banner"]');
        if (h1Element) {
            const h1Text = await h1Element.textContent();
            console.log('Header text:', h1Text);
        } else {
            console.log('Header element not found');
        }

        console.log('\n=== Console Messages ===');
        consoleMessages.forEach(msg => {
            console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
        });

        if (errors.length > 0) {
            console.log('\n=== Errors ===');
            errors.forEach(err => console.log('ERROR:', err));
        } else {
            console.log('\n=== No JavaScript errors detected ===');
        }

        console.log('\nTest completed successfully!');
    } catch (error) {
        console.error('Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

testApp();
