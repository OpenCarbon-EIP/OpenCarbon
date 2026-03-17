import 'package:flutter/foundation.dart';
import 'package:flutter_poc/core/errors/app_errors.dart';
import 'package:flutter_poc/features/login/data/repositories/login_repository.dart';

/*
*  login_viewmodel.dart
*
*  This file implements the LoginViewModel class, which serves as the presentation layer for the login feature. 
*  It interacts with the LoginUseCase to perform the login operation and manages the loading state and error messages for the UI.
*/
class LoginViewModel extends ChangeNotifier {
  LoginViewModel(this._repository);

  final LoginRepository _repository;

  bool _isLoading = false;
  String? _error;

  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      await _repository.login(email, password);
    } on AuthFailure catch (e) {
      _error = e.toString();
    } on Exception catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
