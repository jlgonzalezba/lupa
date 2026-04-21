import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

const List<String> ADMIN_EMAILS = [
  'admin@lupa.com',
  'jlgonzalezba@gmail.com',
];

bool _isAdminEmail(String? email) {
  if (email == null) return false;
  return ADMIN_EMAILS.contains(email.toLowerCase());
}

class UserData {
  final String uid;
  final String email;
  final String displayName;
  final String role;
  final bool mustChangePassword;
  final DateTime? createdAt;

  UserData({
    required this.uid,
    required this.email,
    required this.displayName,
    required this.role,
    this.mustChangePassword = false,
    this.createdAt,
  });
}

class AuthProvider extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  User? _currentUser;
  UserData? _userData;
  bool _isLoading = true;
  String? _error;

  User? get currentUser => _currentUser;
  UserData? get userData => _userData;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAdmin => _userData?.role == 'admin';
  bool get mustChangePassword => _userData?.mustChangePassword ?? false;

  AuthProvider() {
    debugPrint('AuthProvider init');
    _initAuth();
  }

  Future<void> _initAuth() async {
    debugPrint('Setting up auth listener');
    _auth.authStateChanges().listen((User? user) async {
      debugPrint('Auth state changed: ${user?.uid}');
      _currentUser = user;
      if (user != null) {
        await _loadUserDataFromFirestore(user);
      } else {
        _userData = null;
        _isLoading = false;
        notifyListeners();
      }
    }, onError: (e) {
      debugPrint('Auth listener error: $e');
    });
  }

  Future<void> _loadUserDataFromFirestore(User user) async {
    final isAdmin = _isAdminEmail(user.email);

    try {
      final doc = await _db.collection('users').doc(user.uid).get();
      debugPrint('User doc exists: ${doc.exists}, data: ${doc.data()}');
      if (doc.exists) {
        final data = doc.data()!;
        _userData = UserData(
          uid: user.uid,
          email: user.email ?? '',
          displayName: data['displayName'] ?? user.displayName ?? 'Usuario',
          role: data['role'] ?? (isAdmin ? 'admin' : 'general'),
          mustChangePassword: data['mustChangePassword'] ?? false,
          createdAt: data['createdAt']?.toDate(),
        );
        debugPrint(
            'Loaded existing user, mustChangePassword: ${_userData!.mustChangePassword}');
      } else {
        debugPrint('Creating new user in Firestore...');
        _userData = UserData(
          uid: user.uid,
          email: user.email ?? '',
          displayName: user.displayName ?? 'Usuario',
          role: isAdmin ? 'admin' : 'general',
          mustChangePassword: !isAdmin,
        );
        await _db.collection('users').doc(user.uid).set({
          'email': user.email ?? '',
          'displayName': user.displayName ?? 'Usuario',
          'role': isAdmin ? 'admin' : 'general',
          'mustChangePassword': !isAdmin,
          'createdAt': FieldValue.serverTimestamp(),
        });
        debugPrint(
            'New user created with mustChangePassword: ${_userData!.mustChangePassword}');
      }
    } catch (e) {
      debugPrint(
          'Error loading user data from Firestore: $e - creating default user');
      _userData = UserData(
        uid: user.uid,
        email: user.email ?? '',
        displayName: user.displayName ?? 'Usuario',
        role: isAdmin ? 'admin' : 'general',
        mustChangePassword: !isAdmin,
      );
    }
    _isLoading = false;
    notifyListeners();
    debugPrint(
        'User data loaded, mustChangePassword: ${_userData?.mustChangePassword}, isLoading: $_isLoading');
  }

  Future<bool> signIn(String email, String password) async {
    debugPrint('signIn called: $email');
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      debugPrint('signIn result: ${result.user?.uid}');

      if (result.user != null) {
        _currentUser = result.user;
        await _loadUserDataFromFirestore(result.user!);
        debugPrint('Login success!');
        return true;
      }

      _error = 'Error inesperado';
      _isLoading = false;
      notifyListeners();
      return false;
    } on FirebaseAuthException catch (e) {
      debugPrint('FirebaseAuthException: ${e.code} - ${e.message}');
      _error = '${_getAuthErrorMessage(e.code)} (${e.code})';
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e, stack) {
      debugPrint('Login error: $e, stack: $stack');
      _error = 'Error al iniciar sesión: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
    _currentUser = null;
    _userData = null;
    notifyListeners();
  }

  Future<bool> changePassword(String newPassword) async {
    if (_currentUser == null) return false;

    try {
      await _currentUser!.updatePassword(newPassword);
      await _db.collection('users').doc(_currentUser!.uid).update({
        'mustChangePassword': false,
      });
      _userData = UserData(
        uid: _userData!.uid,
        email: _userData!.email,
        displayName: _userData!.displayName,
        role: _userData!.role,
        mustChangePassword: false,
        createdAt: _userData!.createdAt,
      );
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Error changing password: $e');
      return false;
    }
  }

  String _getAuthErrorMessage(String code) {
    switch (code) {
      case 'user-not-found':
        return 'Usuario no encontrado';
      case 'wrong-password':
        return 'Contraseña incorrecta';
      case 'invalid-email':
        return 'Email inválido';
      case 'user-disabled':
        return 'Usuario deshabilitado';
      case 'invalid-credential':
      case 'invalid_login_credentials':
        return 'Email o contraseña incorrectos';
      default:
        return 'Error al iniciar sesión';
    }
  }
}
