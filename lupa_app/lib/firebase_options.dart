import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      case TargetPlatform.windows:
        return windows;
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - '
          'you can reconfigure FirebaseOptions by calling the method manually.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: "AIzaSyCNE2H9xBLdQSLt0l5cl40nqVNm8jwJXB8",
    authDomain: "innergy-a55ba.firebaseapp.com",
    projectId: "innergy-a55ba",
    storageBucket: "innergy-a55ba.firebasestorage.app",
    messagingSenderId: "40889729381",
    appId: "1:40889729381:web:e924d1a1551a3157f9a18c",
    measurementId: "G-JN00J717BD",
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: "AIzaSyCNE2H9xBLdQSLt0l5cl40nqVNm8jwJXB8",
    authDomain: "innergy-a55ba.firebaseapp.com",
    projectId: "innergy-a55ba",
    storageBucket: "innergy-a55ba.firebasestorage.app",
    messagingSenderId: "40889729381",
    appId: "1:40889729381:android:e924d1a1551a3157f9a18c",
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: "AIzaSyCNE2H9xBLdQSLt0l5cl40nqVNm8jwJXB8",
    authDomain: "innergy-a55ba.firebaseapp.com",
    projectId: "innergy-a55ba",
    storageBucket: "innergy-a55ba.firebasestorage.app",
    messagingSenderId: "40889729381",
    appId: "1:40889729381:ios:e924d1a1551a3157f9a18c",
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: "AIzaSyCNE2H9xBLdQSLt0l5cl40nqVNm8jwJXB8",
    authDomain: "innergy-a55ba.firebaseapp.com",
    projectId: "innergy-a55ba",
    storageBucket: "innergy-a55ba.firebasestorage.app",
    messagingSenderId: "40889729381",
    appId: "1:40889729381:macos:e924d1a1551a3157f9a18c",
  );

  static const FirebaseOptions windows = FirebaseOptions(
    apiKey: "AIzaSyCNE2H9xBLdQSLt0l5cl40nqVNm8jwJXB8",
    authDomain: "innergy-a55ba.firebaseapp.com",
    projectId: "innergy-a55ba",
    storageBucket: "innergy-a55ba.firebasestorage.app",
    messagingSenderId: "40889729381",
    appId: "1:40889729381:windows:e924d1a1551a3157f9a18c",
  );
}
