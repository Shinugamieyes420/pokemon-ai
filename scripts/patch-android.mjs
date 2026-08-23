import fs from 'node:fs';
const manifest='android/app/src/main/AndroidManifest.xml';
let s=fs.readFileSync(manifest,'utf8');
s=s.replace('<activity','<activity android:screenOrientation="landscape"');
fs.writeFileSync(manifest,s);
