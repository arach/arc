import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox'],
  defaultViewport: { width: 1680, height: 950 },
  executablePath: '/Users/arach/.cache/puppeteer/chrome/mac_arm-147.0.7727.57/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
});
const page = await browser.newPage();
await page.goto('http://127.0.0.1:5180/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await new Promise(r => setTimeout(r, 3000));
// click the Sessions tab
await page.evaluate(() => {
  const links = [...document.querySelectorAll('a, button')];
  const sess = links.find(el => /^sessions$/i.test(el.textContent?.trim() ?? ''));
  if (sess) sess.click();
});
await new Promise(r => setTimeout(r, 1500));

const result = await page.evaluate(() => {
  const wrap = document.querySelector('.s-atop-table-wrap');
  const table = document.querySelector('.s-atop-table');
  const ths = [...document.querySelectorAll('.s-atop-table thead th')];
  const firstRow = document.querySelector('.s-atop-table tbody tr');
  const tds = firstRow ? [...firstRow.querySelectorAll('td')] : [];
  return {
    wrapWidth: wrap?.getBoundingClientRect().width ?? null,
    tableWidth: table?.getBoundingClientRect().width ?? null,
    tableLayout: table ? getComputedStyle(table).tableLayout : null,
    cols: ths.map((th, i) => {
      const r = th.getBoundingClientRect();
      const td = tds[i];
      const tdR = td?.getBoundingClientRect();
      return {
        text: th.textContent?.trim().slice(0, 30),
        className: th.className,
        thWidth: Math.round(r.width),
        thLeft: Math.round(r.left),
        thInlineWidth: th.style.width,
        thDisplay: getComputedStyle(th).display,
        tdWidth: tdR ? Math.round(tdR.width) : null,
        tdDisplay: td ? getComputedStyle(td).display : null,
      };
    }),
  };
});
console.log(JSON.stringify(result, null, 2));

// take a screenshot
await page.screenshot({ path: '/tmp/sessions-current.png', fullPage: false });
console.log('screenshot saved to /tmp/sessions-current.png');

await browser.close();
