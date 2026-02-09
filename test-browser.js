const { chromium } = require('playwright');

async function testApp() {
    console.log('Launching browser...');
    const browser = await chromium.launch({
        headless: true,
        viewport: { width: 1920, height: 1080 }
    });

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

        console.log('Waiting for page to render...');
        await page.waitForTimeout(3000);

        const title = await page.title();
        console.log('Page title:', title);

        const h1Element = await page.$('h1[role="banner"]');
        if (h1Element) {
            const h1Text = await h1Element.textContent();
            console.log('Header text:', h1Text);
        }

        console.log('\n=== Making screenshot ===');
        await page.screenshot({ path: 'screenshot-korsovet.png', fullPage: true });
        console.log('Screenshot saved to screenshot-korsovet.png');

        console.log('\n=== Header Layout Analysis ===');
        const h1 = await page.$('h1[role="banner"]');
        if (h1) {
            const box = await h1.boundingBox();
            console.log('H1 "Корсовет": x=' + box.x + ', y=' + box.y + ', w=' + box.width);
        }

        const dateSpan = await page.locator('span').filter({ hasText: /\d/ }).first();
        if (dateSpan) {
            const box = await dateSpan.boundingBox();
            console.log('Date: x=' + box.x + ', y=' + box.y + ', w=' + box.width);
        }

        const refreshBtn = await page.$('button[aria-label="Обновить данные"]');
        if (refreshBtn) {
            const box = await refreshBtn.boundingBox();
            console.log('Refresh button: x=' + box.x + ', y=' + box.y + ', w=' + box.width);
        }

        console.log('\n=== Console Messages ===');
        consoleMessages.forEach(msg => {
            if (msg.type === 'error' || msg.type === 'warning') {
                console.log(`[${msg.type.toUpperCase()}] ${msg.text}`);
            }
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
        console.log('Closing browser...');
        await browser.close();
    }
}

testApp();
