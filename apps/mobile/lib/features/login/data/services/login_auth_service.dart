import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/*
*  login_auth_service.dart
*
*  This file implements the LoginAuthService class, which is responsible for managing authentication tokens.
*  It uses the flutter_secure_storage package to securely store, retrieve, and delete the authentication token on the device.
*/
class LoginAuthService {
  LoginAuthService(this._storage);

  final FlutterSecureStorage _storage;

  Future<void> saveToken(String token) async => await _storage.write(key: 'auth_token', value: token);

  Future<String?> getToken() async => await _storage.read(key: 'auth_token');

  Future<void> deleteToken() async => await _storage.delete(key: 'auth_token');

  Future<void> saveRole(String role) async => await _storage.write(key: 'user_role', value: role);

  Future<String?> getRole() async => await _storage.read(key: 'user_role');

  Future<void> deleteRole() async => await _storage.delete(key: 'user_role');
}
