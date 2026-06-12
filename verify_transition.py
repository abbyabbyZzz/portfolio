import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        await page.goto("http://localhost:8080/index.html")
        await page.wait_for_timeout(1000)
        
        # Scroll to selected works section
        await page.evaluate("""
            const section = document.getElementById('selected-works');
            if (section) section.scrollIntoView({behavior: 'instant', block: 'start'});
        """)
        await page.wait_for_timeout(500)
        
        # Take screenshot before transition (slide 1)
        await page.screenshot(path="screenshot_before.png", full_page=False)
        print("Saved screenshot_before.png")
        
        # Trigger transition by simulating wheel event
        section = await page.query_selector("#selected-works")
        
        # Simulate scroll down to trigger next slide
        await page.evaluate("""
            const section = document.getElementById('selected-works');
            const event = new WheelEvent('wheel', { deltaY: 100, bubbles: true });
            section.dispatchEvent(event);
        """)
        
        # Capture during cover (approx 200ms)
        await page.wait_for_timeout(200)
        await page.screenshot(path="screenshot_cover.png", full_page=False)
        print("Saved screenshot_cover.png")
        
        # Capture at full cover (approx 400ms)
        await page.wait_for_timeout(200)
        await page.screenshot(path="screenshot_fullcover.png", full_page=False)
        print("Saved screenshot_fullcover.png")
        
        # Capture during reveal (approx 600ms)
        await page.wait_for_timeout(200)
        await page.screenshot(path="screenshot_reveal.png", full_page=False)
        print("Saved screenshot_reveal.png")
        
        # Capture after transition (approx 900ms)
        await page.wait_for_timeout(300)
        await page.screenshot(path="screenshot_after.png", full_page=False)
        print("Saved screenshot_after.png")
        
        await browser.close()

asyncio.run(main())
