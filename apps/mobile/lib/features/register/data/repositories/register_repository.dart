import 'package:flutter_poc/core/errors/app_errors.dart';
import 'package:flutter_poc/features/register/data/services/register_api_service.dart';
import 'package:flutter_poc/features/register/data/services/register_auth_service.dart';

abstract class RegisterRepository {
  Future<void> signup(
    String email,
    String password,
    String role,
    String description,
    String lastName,
    String firstName,
    String professionalTitle,
    String companyName,
    int companySize,
  );
}

/// @class RegisterRepositoryImpl
/// @brief Implémentation concrète de la gestion des données d'inscription.
/// * Coordonne l'appel API et le stockage sécurisé du jeton d'accès.
class RegisterRepositoryImpl implements RegisterRepository {
  RegisterRepositoryImpl(this._api, this._authService);

  final RegisterApiService _api;
  final RegisterAuthService _authService;

  /// @brief Inscrit l'utilisateur via l'API et sauvegarde le token reçu.
  /// @param ... (tous les champs du formulaire)
  /// @exception AuthFailure Si le jeton n'est pas renvoyé par le serveur.
  @override
  Future<void> signup(
    String email,
    String password,
    String role,
    String description,
    String lastName,
    String firstName,
    String professionalTitle,
    String companyName,
    int companySize
  ) async {
    try {
      final response = await _api.signup(
        email,
        password,
        role,
        description,
        lastName,
        firstName,
        professionalTitle,
        companyName,
        companySize,
      );
      final accessToken = response.data?.accessToken;
      if (accessToken == null || accessToken.isEmpty) {
        throw AuthFailure("Le jeton d'inscription n'a pas été renvoyé par le serveur. Veuillez réessayer.");
      }
      await _authService.saveToken(accessToken);
      await _authService.saveRole(role);
    } on AuthFailure catch (_) {
      rethrow;
    } on ValidationFailure catch (_) {
      rethrow;
    } on Exception catch (_) {
      rethrow;
    }
  }
}
