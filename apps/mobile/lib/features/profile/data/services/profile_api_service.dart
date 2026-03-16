import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_poc/core/constants/app_constants.dart';
import 'package:flutter_poc/core/errors/app_errors.dart';
import 'package:flutter_poc/features/profile/data/models/profile_model.dart';
import 'package:http/http.dart' as http;

class ProfileApiService {
  ProfileApiService(this._httpClient);

  final http.Client _httpClient;

  Future<ProfileModel> getProfile(String token) async {
    final String? dbPath = dotenv.env[AppConstants.dbPath];
    if (dbPath == null) {
      throw EnvironmentFailure();
    }
    final uri = Uri.http(dbPath, '/users/me');
    final response = await _httpClient.get(
      uri,
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
    );

    if (response.statusCode != 200) {
      switch (response.statusCode) {
        case 401:
          throw UnauthorizedFailure("Vous n'êtes pas autorisé(e) à voir les offres.");
        default:
          throw Exception('Erreur pendant le chargement des opportunités');
      }
    }

    final decoded = json.decode(response.body) as Map<String, dynamic>;

    return ProfileModel.fromJson(decoded);
  }

  Future<void> updatePassword(
    String token,
    String userId,
    String password,
  ) async {
    final String? dbPath = dotenv.env[AppConstants.dbPath];
    if (dbPath == null) {
      throw EnvironmentFailure();
    }
    final uri = Uri.http(dbPath, '/users/$userId/update');
    final body = json.encode({
      'password': password,
    });
    final response = await _httpClient.put(
      uri,
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      body: body
    );

    if (response.statusCode != 200) {
      switch (response.statusCode) {
        case 401:
          throw UnauthorizedFailure("Vous n'êtes pas autorisé(e) à modifier ce profile.");
        case 403:
          throw UnauthorizedFailure("Vous n'êtes pas autorisé(e) à modifier le profile d'un autre utilisateur.");
        case 404:
          throw NotFoundFailure("Le profil que vous essayez de modifier n'existe pas.");
        default:
          throw Exception('Erreur pendant la mise à jour du mot de passe.');
      }
    }
  }

  Future<void> updateEmail(
      String token,
      String userId,
      String email,
      ) async {
    final String? dbPath = dotenv.env[AppConstants.dbPath];
    if (dbPath == null) {
      throw EnvironmentFailure();
    }
    final uri = Uri.http(dbPath, '/users/$userId/update');
    final body = json.encode({
      'email': email,
    });
    final response = await _httpClient.put(
        uri,
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: body
    );

    if (response.statusCode != 200) {
      switch (response.statusCode) {
        case 401:
          throw UnauthorizedFailure("Vous n'êtes pas autorisé(e) à modifier ce profile.");
        case 403:
          throw UnauthorizedFailure("Vous n'êtes pas autorisé(e) à modifier le profile d'un autre utilisateur.");
        case 404:
          throw NotFoundFailure("Le profil que vous essayez de modifier n'existe pas.");
        default:
          throw Exception('Erreur pendant le chargement des opportunités');
      }
    }
  }

  Future<void> updateFirstAndLastName(
      String token,
      String userId,
      String firstName,
      String lastName
      ) async {
    final String? dbPath = dotenv.env[AppConstants.dbPath];
    if (dbPath == null) {
      throw EnvironmentFailure();
    }
    final uri = Uri.http(dbPath, '/users/$userId/update');
    final body = json.encode({
      'first_name': firstName,
      'last_name': lastName,
    });
    final response = await _httpClient.put(
        uri,
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
        body: body
    );

    if (response.statusCode != 200) {
      switch (response.statusCode) {
        case 401:
          throw UnauthorizedFailure("Vous n'êtes pas autorisé(e) à modifier ce profile.");
        case 403:
          throw UnauthorizedFailure("Vous n'êtes pas autorisé(e) à modifier le profile d'un autre utilisateur.");
        case 404:
          throw NotFoundFailure("Le profil que vous essayez de modifier n'existe pas.");
        default:
          throw Exception('Erreur pendant le chargement des opportunités');
      }
    }
  }
}
