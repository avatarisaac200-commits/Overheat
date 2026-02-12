import { Capacitor } from '@capacitor/core';
import { AdMob, InterstitialAdPluginEvents } from '@capacitor-community/admob';

const INTERSTITIAL_AD_ID = 'ca-app-pub-9074468231818039/4174145039';

class AdmobService {
  private initialized = false;
  private interstitialReady = false;
  private interstitialLoading = false;

  private get enabled() {
    return Capacitor.isNativePlatform();
  }

  async init(): Promise<void> {
    if (!this.enabled || this.initialized) return;
    this.initialized = true;

    try {
      await AdMob.initialize();
      await this.requestConsent();
      this.registerListeners();
      await this.preloadInterstitial();
    } catch (error) {
      console.warn('AdMob init failed', error);
    }
  }

  async showInterstitial(): Promise<void> {
    if (!this.enabled) return;
    if (!this.interstitialReady) {
      await this.preloadInterstitial();
      return;
    }
    try {
      await AdMob.showInterstitial();
    } catch (error) {
      console.warn('AdMob show interstitial failed', error);
      this.interstitialReady = false;
      this.preloadInterstitial();
    }
  }

  private registerListeners(): void {
    AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
      this.interstitialReady = true;
      this.interstitialLoading = false;
    });

    AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      this.interstitialReady = false;
      this.preloadInterstitial();
    });

    AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => {
      this.interstitialReady = false;
      this.interstitialLoading = false;
    });

    AdMob.addListener(InterstitialAdPluginEvents.FailedToShow, () => {
      this.interstitialReady = false;
      this.preloadInterstitial();
    });
  }

  private async preloadInterstitial(): Promise<void> {
    if (!this.enabled || this.interstitialLoading || this.interstitialReady) return;
    this.interstitialLoading = true;
    try {
      await AdMob.prepareInterstitial({ adId: INTERSTITIAL_AD_ID });
    } catch (error) {
      console.warn('AdMob prepare interstitial failed', error);
      this.interstitialLoading = false;
    }
  }

  private async requestConsent(): Promise<void> {
    try {
      const info = await AdMob.requestConsentInfo();
      if (info.isConsentFormAvailable) {
        await AdMob.showConsentForm();
      }
    } catch (error) {
      console.warn('AdMob consent flow failed', error);
    }
  }
}

export const admobService = new AdmobService();
