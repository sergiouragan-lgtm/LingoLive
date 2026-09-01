import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const checks = [];
const check = (name, ok, detail = '') => checks.push({ name, ok: Boolean(ok), detail });

const required = [
  'flutter/pubspec.yaml',
  'flutter/android/app/google-services.json',
  'flutter/ios/Runner/GoogleService-Info.plist',
  'flutter/lib/firebase_services.dart',
  'flutter/lib/auth/auth_gate.dart',
  'flutter/lib/shell/app_shell.dart',
  'flutter/lib/profile/profile_hub_screen.dart',
  'flutter/lib/billing/billing_repository.dart',
];
for (const path of required) check(`required:${path}`, existsSync(resolve(root, path)));

const android = JSON.parse(read('flutter/android/app/google-services.json'));
const plist = read('flutter/ios/Runner/GoogleService-Info.plist');
const services = read('flutter/lib/firebase_services.dart');
const options = read('flutter/lib/firebase_options.dart');
const authGate = read('flutter/lib/auth/auth_gate.dart');
const billing = read('flutter/lib/billing/billing_repository.dart');
const school = read('flutter/lib/school/school_dashboard_screen.dart');
const shell = read('flutter/lib/shell/app_shell.dart');
const hub = read('flutter/lib/profile/profile_hub_screen.dart');
const allDart = required.concat([
  'flutter/lib/main.dart',
  'flutter/lib/auth/auth_screen.dart',
  'flutter/lib/memory/memory_control_screen.dart',
  'flutter/lib/profile/student_profile_screen.dart',
  'flutter/lib/profile/study_preferences_screen.dart',
  'flutter/lib/profile/account_security_screen.dart',
  'flutter/lib/profile/privacy_data_screen.dart',
  'flutter/lib/profile/user_settings_screen.dart',
  'flutter/lib/memory/tutor_memory_repository.dart',
  'flutter/lib/billing/subscription_screen.dart',
]).filter((p) => existsSync(resolve(root, p))).map(read).join('\n');

const projectId = android.project_info.project_id;
const androidClient = android.client.find((entry) => entry.client_info?.android_client_info?.package_name === 'com.lingolive.ai');
check('firebase:project', projectId === 'lingolive-ia-f5778', projectId);
check('firebase:android-package', Boolean(androidClient), 'com.lingolive.ai');
check('firebase:android-app-id', androidClient?.client_info?.mobilesdk_app_id === '1:995910450073:android:b32b72f4060a3875be3108');
check('firebase:ios-bundle', /<key>BUNDLE_ID<\/key>\s*<string>com\.lingolive\.ai<\/string>/.test(plist));
check('firebase:ios-app-id', plist.includes('1:995910450073:ios:24644446f4b0a957be3108'));
check('firebase:options-project', options.includes("projectId = 'lingolive-ia-f5778'"));
check('firestore:named-database', /databaseId\s*=\s*['\"]ai-studio-lingoliveai-669e2e6d-3566-4aa0-ba62-227975dc5edd['\"]/.test(options) && services.includes('DefaultFirebaseOptions.databaseId'));

check('auth:user-changes', authGate.includes('userChanges()'));
check('auth:verified-email', authGate.includes('emailVerified'));
check('billing:id-token', billing.includes('getIdToken'));
check('billing:checkout-endpoint', billing.includes('/api/create-checkout-session'));
check('billing:https-response', billing.includes("uri.scheme != 'https'"));
check('billing:no-client-subscription-write', !/collection\(['\"]subscriptions['\"]\)[\s\S]{0,160}\.(set|update|add)\(/.test(billing));
check('school:no-global-sensitive-query', !/collection\(['\"](schools|students|school_memberships)['\"]\)/.test(school));
check('navigation:four-primary-tabs', ['Início', 'Aprender', 'Memória', 'Perfil'].every((label) => shell.includes(label)));
check('profile:core-destinations', ['StudentProfileScreen', 'StudyPreferencesScreen', 'SubscriptionScreen'].every((name) => hub.includes(name)));
check('memory:canonical-api', read('flutter/lib/memory/tutor_memory_repository.dart').includes('/api/tutor-memory'));
check('preferences:canonical-user-document', read('flutter/lib/profile/study_preferences_screen.dart').includes("collection('users').doc(widget.user.uid)") && !read('flutter/lib/profile/study_preferences_screen.dart').includes("doc('study_preferences')"));
check('school:no-untrusted-role-gate', !hub.includes("data()?['role']"));

const forbidden = [
  [/\b(mock|demo|sample|fict[ií]ci[oa])\b/i, 'demo data marker'],
  [/123456789/, 'legacy Multicaixa reference'],
  [/paymentCompleted\s*:\s*true/, 'client-owned payment state'],
  [/subscriptionActive\s*:\s*true/, 'client-owned subscription state'],
];
for (const [pattern, label] of forbidden) check(`no-forbidden:${label}`, !pattern.test(allDart));

const failed = checks.filter((entry) => !entry.ok);
console.log(JSON.stringify({ status: failed.length ? 'failed' : 'passed', checks: checks.length, failed }, null, 2));
if (failed.length) process.exit(1);
