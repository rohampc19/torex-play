export default async function run(page, ui) {
  const before = await ui.snapshot();
  const chat = before.match(/@(e\d+) link "چت"/)?.[1];
  if (!chat) return { error: "chat link missing", before };
  await ui.click(chat);
  await page.waitForLoadState("domcontentloaded");
  const afterClick = { url: page.url(), title: await page.title(), page: await page.locator(".messenger-page").count() };
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  const refreshed = { url: page.url(), page: await page.locator(".messenger-page").count(), css: await page.locator('link[href="/chat-v2.css"]').count(), js: await page.locator('script[src="/chat-v2.js"]').count() };
  await page.locator("#addFriendButton").click();
  const modalOpen = await page.locator("#addFriendModal[open]").count();
  return { clicked: afterClick, refreshed, chatInteraction: { addFriendModalOpen: modalOpen === 1 } };
}