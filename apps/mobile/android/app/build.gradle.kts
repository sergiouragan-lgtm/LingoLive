import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Os plugins do Firebase são aplicados apenas quando `google-services.json`
// existe. O ficheiro não é versionado (contém identificadores do projeto), pelo
// que aplicá-los incondicionalmente faria o build de CI falhar por falta de um
// segredo que não é preciso para provar que a app compila.
val googleServicesFile = file("google-services.json")
val hasFirebaseConfig = googleServicesFile.exists()
if (hasFirebaseConfig) {
    apply(plugin = "com.google.gms.google-services")
    apply(plugin = "com.google.firebase.crashlytics")
} else {
    logger.warn(
        "google-services.json ausente: Firebase e Crashlytics não são configurados " +
            "neste build. Coloque o ficheiro em android/app/ antes de distribuir."
    )
}

// Assinatura de release a partir de `android/key.properties`, escrito pelo
// workflow de distribuição interna a partir de segredos. Sem ele, o build
// de release usa a chave de debug, para que a compilação continue verificável
// em CI sem expor o keystore.
val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
val hasReleaseKeystore = keystorePropertiesFile.exists()
if (hasReleaseKeystore) {
    keystorePropertiesFile.inputStream().use { keystoreProperties.load(it) }
}

android {
    namespace = "ia.lingolive.lingolive_mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        // Exigido pelo flutter_local_notifications, que usa APIs java.time
        // indisponíveis nas versões de Android que ainda suportamos.
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        applicationId = "ia.lingolive.lingolive_mobile"
        // firebase_messaging e flutter_local_notifications exigem API 21+.
        minSdk = maxOf(flutter.minSdkVersion, 23)
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (hasReleaseKeystore) {
            create("release") {
                storeFile = file(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            signingConfig = if (hasReleaseKeystore) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
}

flutter {
    source = "../.."
}
