import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class OfferAuthService {
    OfferAuthService(this._storage);
  final FlutterSecureStorage _storage;

  Future<String?> getToken() async => await _storage.read(key: 'auth_token');
}