import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider(this._storage) {
    _checkToken();
  }

  final FlutterSecureStorage _storage;
  bool _isAuthenticated = false;
  bool _isInitialized = false;
  String? _role;

  bool get isAuthenticated => _isAuthenticated;
  bool get isInitialized => _isInitialized;
  String? get role => _role;

  bool get isConsultant => _role == 'CONSULTANT';
  bool get isCompany => _role == 'COMPANY';

  Future<void> _checkToken() async {
    final token = await _storage.read(key: 'auth_token');
    _role = await _storage.read(key: 'user_role');

    _isAuthenticated = token != null;
    _isInitialized = true;
    notifyListeners();
  }

  Future<void> loginSuccess() async {
    await _checkToken();
  }

  Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'user_role');
    _isAuthenticated = false;
    _role = null;
    notifyListeners();
  }
}