import 'package:flutter/foundation.dart';
import 'package:flutter_poc/core/errors/app_errors.dart';
import 'package:flutter_poc/features/register/domain/usecases/register_usecase.dart';

/// @class RegisterViewModel
/// @brief Gère l'état de l'interface utilisateur pour l'écran d'inscription.
/// * Fournit des propriétés observables (loading, error) et déclenche l'inscription.
class RegisterViewModel extends ChangeNotifier {
  RegisterViewModel(this._usecase);

  final RegisterUsecase _usecase;

  bool _isLoading = false;
  String? _error;

  /// @brief Indique si une opération asynchrone est en cours.
  bool get isLoading => _isLoading;

  /// @brief Contient le message d'erreur à afficher, si présent.
  String? get error => _error;

  /// @brief Déclenche le processus d'inscription et met à jour l'état.
  /// * Cette méthode notifie les auditeurs au début (chargement) et à la fin (succès/erreur).
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
  ) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      await _usecase.call(
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
    } on AuthFailure catch (e) {
      _error = e.toString();
    } on ValidationFailure catch (e) {
      _error = e.toString();
    } on Exception catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
