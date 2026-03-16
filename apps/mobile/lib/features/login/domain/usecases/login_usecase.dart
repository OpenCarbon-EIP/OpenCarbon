import 'package:flutter_poc/core/errors/app_errors.dart';
import 'package:flutter_poc/features/login/data/repositories/login_repository.dart';

/*
*  login_usecase.dart
*
*  This file implements the LoginUseCase class, which serves as the business logic layer for the login feature. 
*  It interacts with the LoginRepository to perform the login operation and handles any exceptions that may occur during the process.
*/
class LoginUseCase {
  LoginUseCase(this._repository);

  final LoginRepository _repository;

  Future<void> call(String email, String password) async {
    try {
      return await _repository.login(email, password);
    } on AuthFailure catch (_) {
      rethrow;
    } on Exception catch (_) {
      throw Exception('Failed to login');
    }
  }
}