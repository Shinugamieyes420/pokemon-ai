import fs from 'node:fs';

const manifest='android/app/src/main/AndroidManifest.xml';
let s=fs.readFileSync(manifest,'utf8');
if(!s.includes('android:screenOrientation="landscape"')) s=s.replace('<activity','<activity android:screenOrientation="landscape"');
fs.writeFileSync(manifest,s);

const mainActivity='android/app/src/main/java/com/remon/pokemonlaneclash/MainActivity.java';
if(fs.existsSync(mainActivity)){
  const m=`package com.remon.pokemonlaneclash;\n\nimport android.os.Bundle;\nimport android.view.View;\nimport com.getcapacitor.BridgeActivity;\n\npublic class MainActivity extends BridgeActivity {\n  @Override\n  public void onCreate(Bundle savedInstanceState) {\n    super.onCreate(savedInstanceState);\n    hideSystemUI();\n  }\n\n  @Override\n  public void onWindowFocusChanged(boolean hasFocus) {\n    super.onWindowFocusChanged(hasFocus);\n    if (hasFocus) hideSystemUI();\n  }\n\n  private void hideSystemUI() {\n    getWindow().getDecorView().setSystemUiVisibility(\n      View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |\n      View.SYSTEM_UI_FLAG_FULLSCREEN |\n      View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |\n      View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |\n      View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |\n      View.SYSTEM_UI_FLAG_LAYOUT_STABLE\n    );\n  }\n}\n`;
  fs.writeFileSync(mainActivity,m);
}

const gradle='android/app/build.gradle';
let g=fs.readFileSync(gradle,'utf8');
g=g.replace(/versionCode\s+\d+/,'versionCode 20');
g=g.replace(/versionName\s+"[^"]+"/,'versionName "0.2.0"');
if(!g.includes('plcStable')){
  const signing=`\n    signingConfigs {\n        plcStable {\n            storeFile file("../../signing/plc-dev.keystore")\n            storePassword "LaneClashDev2026"\n            keyAlias "plc"\n            keyPassword "LaneClashDev2026"\n        }\n    }\n\n`;
  g=g.replace(/\n\s*buildTypes\s*\{/, signing+'    buildTypes {\n        debug {\n            signingConfig signingConfigs.plcStable\n        }');
}
fs.writeFileSync(gradle,g);
