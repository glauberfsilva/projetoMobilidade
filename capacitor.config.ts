import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'UberAppGb',
  webDir: 'www',
  bundledWebRuntime: false,
  cordova: {
    preferences: {
      ScrollEnabled: 'false',
      BackupWebStorage: 'none',
      SplashMaintainAspectRatio: 'true',
      FadeSplashScreenDuration: '300',
      SplashShowOnlyFirstTime: 'false',
      SplashScreen: 'screen',
      SplashScreenDelay: '3000',
      AndroidXEnabled: 'true',
      'android-minSdkVersion': '22',
      'android-targetSdkVersion': '31',
      GOOGLE_MAPS_ANDROID_API_KEY: 'AIzaSyCBn_iuy2sjajobrbLp3CXWPlTKeODsimk',
      GOOGLE_MAPS_IOS_API_KEY: 'AIzaSyCBn_iuy2sjajobrbLp3CXWPlTKeODsimk'
    }
  }
};

export default config;
