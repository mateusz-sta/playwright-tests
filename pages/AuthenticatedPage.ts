import { Header } from '../components/Header';
import { SESSION_STORAGE_KEY } from '../utils/constants';
import { BasePage } from './BasePage';
import { Page } from '@playwright/test';

// Base for pages available only after logging in.
export abstract class AuthenticatedPage extends BasePage {
  readonly header: Header;

  constructor(page: Page) {
    super(page);
    this.header = new Header(page);
  }

  // Saves the logged-in session (cookies + localStorage – the app keeps its
  // session in localStorage) so other tests can start already logged in.
  async saveSession(path: string): Promise<void> {
    await this.page.context().storageState({ path });
  }

  // Makes the saved session look `minutes` old (its issuedAt) before the next
  // page load – the app then extends it on the next user activity.
  async makeSessionOlder(minutes: number): Promise<void> {
    await this.page.addInitScript(
      ({ key, ageMs }) => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const session = JSON.parse(raw);
        session.issuedAt = Date.now() - ageMs;
        localStorage.setItem(key, JSON.stringify(session));
      },
      { key: SESSION_STORAGE_KEY, ageMs: minutes * 60_000 },
    );
  }

  // Opens the page and lets the app extend an older session first.
  // User activity (e.g. a key press or the "Wyloguj" click) with a token older
  // than a few minutes sends POST /api/auth/refresh. If that happens on the
  // "Wyloguj" click, the refresh can finish first and restore the session
  // (race in the app). So: press a key like a user, wait for the refresh, then act.
  // With a fresh token there is no refresh – then it waits at most 3 s.
  async openAndRefreshSession(): Promise<void> {
    await this.open();
    await this.expectToBeOpened();
    const refreshed = this.page
      .waitForResponse((r) => r.url().endsWith('/api/auth/refresh'), {
        timeout: 3_000,
      })
      .catch(() => undefined);
    await this.page.keyboard.press('Shift');
    await refreshed;
  }
}
