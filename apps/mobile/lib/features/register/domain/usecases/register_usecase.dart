import 'package:flutter_poc/core/errors/app_errors.dart';
import 'package:flutter_poc/features/register/data/repositories/register_repository.dart';

/// @class RegisterUsecase
/// @brief Classe de logique métier pour l'inscription d'un utilisateur.
/// * Cette classe sert d'intermédiaire entre la couche de présentation (ViewModel)
/// et la couche de données (Repository). Elle encapsule l'action unique de créer un compte.
class RegisterUsecase {
  RegisterUsecase(this._repository);

  /// @brief Constructeur de RegisterUsecase.
  /// @param _repository Instance du dépôt gérant l'inscription.
  final RegisterRepository _repository;

  /// @brief Exécute la logique d'inscription.
  /// @param email Adresse mail de l'utilisateur.
  /// @param password Mot de passe.
  /// @param role Rôle choisi (CONSULTANT ou COMPANY).
  /// @param description Bio ou description de l'utilisateur.
  /// @param lastName Nom de famille.
  /// @param firstName Prénom.
  /// @param professionalTitle Titre professionnel.
  /// @param companyName Nom de l'entreprise (optionnel).
  /// @param companySize Taille de l'entreprise (optionnel).
  /// @return `Future<void>` Indique la fin de l'opération.
  /// @exception AuthFailure En cas d'erreur d'authentification identifiée.
  /// @exception Exception En cas d'erreur serveur générique.
  Future<void> call(
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
    try {
      return await _repository.signup(
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
    } on AuthFailure catch (_) {
      rethrow;
    } on ValidationFailure catch (_) {
      rethrow;
    } on Exception catch (_) {
      rethrow;
    }
  }
}
