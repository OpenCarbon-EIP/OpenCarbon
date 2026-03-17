import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_poc/core/constants/app_constants.dart';
import 'package:flutter_poc/core/errors/app_errors.dart';
import 'package:flutter_poc/features/register/data/models/register_response_model.dart';
import 'package:http/http.dart' as http;

/// @class RegisterApiService
/// @brief Service de bas niveau pour les requêtes HTTP d'authentification.
/// * Communique directement avec le backend sur localhost:3000.
class RegisterApiService {
  RegisterApiService(this._httpClient);

  final http.Client _httpClient;

  /// @brief Envoie une requête POST d'inscription.
  /// @return Un modèle RegisterResponseModel contenant les données de réponse.
  Future<RegisterResponseModel> signup(
    String email,
    String password,
    String role,
    String description,
    String lastName,
    String firstName,
    String professionalTitle,
    String companyName,
    int companySize,
  ) async {
    final String? pathToDB = dotenv.env[AppConstants.dbPath];
    if (pathToDB == null ) {
      throw EnvironmentFailure();
    }
    final uri = Uri.http(pathToDB, '/auth/register');
    final encodedBody = jsonEncode({
      'email': email,
      'password': password,
      'role': role,
      'description': description,
      'last_name': lastName,
      'first_name': firstName,
      'professional_title': professionalTitle,
      'company_name': companyName,
      'company_size': companySize,
    });

    final response = await _httpClient
        .post(uri, headers: {'Content-Type': 'application/json'}, body: encodedBody)
        .timeout(const Duration(seconds: 15));

    if (response.statusCode != 200 && response.statusCode != 201) {
      switch (response.statusCode) {
        case 400:
          throw AuthFailure('Les champs remplis ne sont pas bons.');
        case 409:
          throw ValidationFailure("L'adresse mail est déjà utilisée.");
        default:
          throw Exception('Erreur pendant la connexion');
      }
    }
    final data = json.decode(response.body);
    return RegisterResponseModel.fromJson(data as Map<String, dynamic>);
  }
}
